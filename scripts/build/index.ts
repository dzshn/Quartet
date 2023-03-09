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

import process from "process";

import esbuild from "esbuild";

import { quartetPlugin, sveltePlugin, webextBuilderPlugin } from "./plugins";
import { dedent, license, longVersion } from "./util";

const watch = process.argv.includes("--watch");
const minify = !process.argv.includes("--no-minify");
const web = process.argv.includes("--web");

const esbuildOpts: esbuild.BuildOptions = {
    logLevel: "info",
    metafile: true,
    minify,
    bundle: true,
    external: ["electron", "systeminformation"],
    sourcemap: watch ? "inline" : "external",
    legalComments: "none",
    plugins: [sveltePlugin, quartetPlugin],
    define: {
        QUARTET_VERSION: JSON.stringify(longVersion),
        QUARTET_DEV: JSON.stringify(watch),
        QUARTET_WEB: "false",
    },
    banner: {
        js: dedent(`\
            /**
             * Quartet, a cute and minimal client mod for TETR.IO
             *
             * @author dzshn (https://dzshn.xyz)
             * @license GPL-3.0-or-later
             * @version ${longVersion}
             */
        `) + license,
    },
};

interface Target {
    base: esbuild.BuildOptions;
    tasks: esbuild.BuildOptions[];
}

const desktopTarget: Target = {
    base: {
        platform: "node",
        target: ["chrome83"], // :<
    },
    tasks: [
        {
            entryPoints: ["src/loader.ts"],
            outfile: "dist/loader.js",
            footer: { js: "//# sourceURL=QuartetLoader" },
        },
        {
            entryPoints: ["src/preload.ts"],
            outfile: "dist/preload.js",
            footer: { js: "//# sourceURL=QuartetPreload" },
        },
        {
            entryPoints: ["src/Quartet.ts"],
            outfile: "dist/quartet.js",
            format: "iife",
            globalName: "Quartet",
            footer: { js: "//# sourceURL=Quartet" },
        },
    ],
};

const webTarget: Target = {
    base: {
        entryPoints: ["src/Quartet.ts"],
        platform: "browser",
        target: ["esnext"],
        format: "iife",
        globalName: "Quartet",
        define: {
            QUARTET_WEB: "true",
        },
        inject: ["src/browser/shims.ts"],
    },
    tasks: [
        {
            outfile: "dist/Quartet.user.js",
            define: {
                window: "unsafeWindow",
            },
            banner: {
                js: userScriptHeader({
                    name: "Quartet",
                    namespace: "https://github.com/dzshn",
                    description: "A cute and minimal TETR.IO client mod",
                    version: longVersion,
                    author: "dzshn (https://dzshn.xyz)",
                    license: "GPL-3.0-or-later",
                    donate: "https://ko-fi.com/dzshn",
                    match: "*://tetr.io/*",
                    "run-at": "document-start",
                }) + "\n" + license,
            },
            footer: {
                js: "Object.defineProperty(unsafeWindow,'Quartet',{get:()=>Quartet})\n//# sourceURL=Quartet",
            },
        },
        {
            outfile: "dist/browser.js",
            plugins: [webextBuilderPlugin],
            footer: { js: "//# sourceURL=Quartet" },
        },
    ],
};

function simplifyInputs(obj: esbuild.Metafile | esbuild.Metafile["outputs"][string]) {
    // Make analysis a bit easier to read by shortening node_modules paths:
    // node_modules/.pnpm/package@ver/node_modules/package -> package
    obj.inputs = Object.fromEntries(
        Object.entries(obj.inputs).map(
            ([k, v]) => [k.replace(/^node_modules\/(\.pnpm\/.*\/node_modules\/)?/, ""), v],
        ),
    );
}

function userScriptHeader(metadata: Record<string, string>) {
    const length = Math.max(...Object.keys(metadata).map(k => k.length));

    return [
        "// ==UserScript==",
        ...Object.entries(metadata).map(
            ([k, v]) => `// @${k}${" ".repeat(length - k.length)}  ${v}`,
        ),
        "// ==/UserScript==",
    ].join("\n");
}

function mergeOptions(...options: esbuild.BuildOptions[]) {
    return options.reduce((a, b) => {
        const merged = { ...a, ...b };
        if (a.define && b.define)
            merged.define = { ...a.define, ...b.define };
        if (a.plugins && b.plugins)
            merged.plugins = [...a.plugins, ...b.plugins];
        return merged;
    });
}

async function main() {
    const contexts: esbuild.BuildContext[] = [];
    const targets = [desktopTarget];

    if (web) targets.push(webTarget);

    for (const target of targets)
        for (const task of target.tasks)
            contexts.push(await esbuild.context(mergeOptions(esbuildOpts, target.base, task)));

    if (watch) {
        contexts.forEach(ctx => ctx.watch());
    } else {
        const results = await Promise.all(contexts.map(ctx => ctx.rebuild()));
        for (const { metafile } of results) {
            if (!metafile) continue;
            Object.values(metafile.outputs).forEach(simplifyInputs);
            console.log(await esbuild.analyzeMetafile(metafile));
        }
        contexts.forEach(ctx => ctx.dispose());
    }
}

main();
