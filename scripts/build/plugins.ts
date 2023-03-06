/*
 * Quartet, a client mod for TETR.IO
 * Copyright (c) 2023 Sofia Lima and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

import esbuild from "esbuild";
import fflate from "fflate";
import sveltePreprocess from "svelte-preprocess";
import * as svelte from "svelte/compiler";
import { Manifest } from "webextension-polyfill";
import { longVersion, shortVersion } from "./util";

const zip = promisify(fflate.zip);

const sveltePreprocessor = sveltePreprocess({
    async typescript({ content }) {
        return esbuild.transform(content, {
            loader: "ts",
            tsconfigRaw: {
                compilerOptions: {
                    importsNotUsedAsValues: "preserve",
                    preserveValueImports: true,
                },
            },
        });
    },
});

/** Minimal svelte plugin with typescript support */
export const sveltePlugin: esbuild.Plugin = {
    name: "svelte",
    setup(build) {
        build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
            const src = await readFile(path, "utf-8");

            let contents = (await svelte.preprocess(src, sveltePreprocessor)).code;
            contents = svelte.compile(contents).js.code;

            return { contents, loader: "js" };
        });
    },
};

/** Project-specific things (currently resolves `~plugins` imports) */
export const quartetPlugin: esbuild.Plugin = {
    name: "quartet",
    setup(build) {
        build.onResolve({ filter: /^~plugins$/ }, args => ({
            namespace: "all-plugins",
            path: args.path,
        }));
        build.onLoad({ filter: /^~plugins$/, namespace: "all-plugins" }, async () => {
            let contents = "const p = []; export default p;\n";
            for (const file of await readdir("./src/plugins")) {
                const mod = file.replace(/.(js|ts|svelte)$/, "");
                if (mod === file)
                    continue;
                contents += `import ${mod} from "./plugins/${file}"; p.push(${mod});\n`;
            }

            return { contents, resolveDir: "./src" };
        });
    },
};

/** Packs up a manifest v3 extension (usuable in Firefox, Chrome, Safari etc) */
export const webextBuilderPlugin: esbuild.Plugin = {
    name: "webext-builder",
    setup(build) {
        const manifest: Manifest.WebExtensionManifest = {
            manifest_version: 3,
            name: "Quartet",
            description: "A cute and minimal TETR.IO client mod",
            author: "dzshn",
            homepage_url: "https://github.com/dzshn/Quartet",
            icons: { "48": "icon.png" },
            version: shortVersion,
            version_name: longVersion,
            host_permissions: ["*://*.tetr.io/*"],
            content_scripts: [
                {
                    matches: ["*://tetr.io/"],
                    js: ["content.js"],
                    run_at: "document_start",
                },
            ],
            web_accessible_resources: [
                {
                    resources: ["quartet.js"],
                    matches: ["*://*.tetr.io/*"],
                },
            ],
        };
        let content: esbuild.OutputFile;
        build.onStart(async () => {
            const { outputFiles, errors, warnings } = await esbuild.build({
                entryPoints: ["src/browser/content.ts"],
                format: "iife",
                write: false,
                bundle: true,
                minify: build.initialOptions.minify,
            });
            if (outputFiles)
                content = outputFiles[0];
            return { errors, warnings };
        });
        build.onEnd(async result => {
            const fileTree = {
                "content.js": content.contents,
                "quartet.js": await readFile("dist/browser.js"),
                "icon.png": await readFile("docs/icon.png"),
                "manifest.json": fflate.strToU8(JSON.stringify(manifest, null, 4)),
            };
            const sizes = Object.fromEntries(
                Object.entries(fileTree).map(
                    ([file, data]) => [file, data.length],
                ),
            );
            await writeFile("dist/extension.zip", await zip(fileTree));
            if (result.metafile) {
                result.metafile.outputs["dist/extension (unpacked)"] = {
                    bytes: Object.values(sizes).reduce((a, b) => a + b),
                    inputs: Object.fromEntries(
                        Object.entries(sizes).map(
                            ([file, size]) => [file, { bytesInOutput: size }],
                        ),
                    ),
                    exports: [],
                    imports: [],
                };
            }
        });
    },
};
