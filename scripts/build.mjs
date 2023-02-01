import { execSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import process from "node:process";

import esbuild from "esbuild";
import * as svelte from "svelte/compiler";
import sveltePreprocess from "svelte-preprocess";

const watch = process.argv.includes("--watch");
const web = process.argv.includes("--web");
const gitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
const version = `${process.env.npm_package_version} (${gitHash})`;

const sveltePreprocessor = sveltePreprocess({
    async typescript({ content }) {
        return esbuild.transform(content, {
            loader: "ts",
            tsconfigRaw: {
                compilerOptions: {
                    importsNotUsedAsValues: "preserve",
                    preserveValueImports: true
                }
            }
        });
    }
});


/** @type {import("esbuild").BuildOptions} */
const esbuildOpts = {
    logLevel: "info",
    metafile: true,
    minify: !watch,
    bundle: true,
    platform: "node",
    target: ["chrome83"],
    external: ["electron"],
    sourcemap: watch ? "inline" : "external",
    legalComments: "linked",
    plugins: [
        {
            name: "svelte",
            setup(build) {
                build.onLoad({ filter: /\.svelte$/ }, async args => {
                    const src = await readFile(args.path, "utf-8");

                    let contents = (await svelte.preprocess(src, sveltePreprocessor)).code;
                    contents = svelte.compile(contents).js.code;

                    return { contents, loader: "js" };
                });
            },
        },
        {
            name: "plugins",
            setup(build) {
                build.onResolve({ filter: /^~plugins$/ }, args => ({
                    namespace: "all-plugins", path: args.path
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
            }
        }
    ],
    define: {
        QUARTET_VERSION: JSON.stringify(version),
        QUARTET_DEV: JSON.stringify(watch),
    }
};

const contexts = [];

if (web) {
    const userscriptCtx = await esbuild.context({
        ...esbuildOpts,
        entryPoints: ["src/Quartet.ts"],
        outfile: "dist/Quartet.user.js",
        format: "iife",
        globalName: "Quartet",
        define: {
            ...esbuildOpts.define,
            window: "unsafeWindow",
        },
        banner: {
            js: `\
                // ==UserScript==
                // @name         Quartet
                // @description  A cute and minimal TETR.IO client mod
                // @version      0.1.0 (23e89b4)
                // @author       dzshn (https://dzshn.xyz)
                // @license      GPL-3.0
                // @donate       https://ko-fi.com/dzshn
                // @match        *://tetr.io/*
                // @run-at       document-start
                // ==/UserScript==
            `.split("\n").map(x => x.trimStart()).join("\n"),
        },
        footer: { js: "Object.defineProperty(unsafeWindow,'Quartet',{get:()=>Quartet})" }
    });

    contexts.push(userscriptCtx);
}

const loaderCtx = await esbuild.context({
    ...esbuildOpts,
    entryPoints: ["src/loader.ts"],
    outfile: "dist/loader.js",
});

const preloadCtx = await esbuild.context({
    ...esbuildOpts,
    entryPoints: ["src/preload.ts"],
    outfile: "dist/preload.js",
});

const quartetCtx = await esbuild.context({
    ...esbuildOpts,
    entryPoints: ["src/Quartet.ts"],
    outfile: "dist/quartet.js",
    format: "iife",
    globalName: "Quartet",
});

contexts.push(loaderCtx, preloadCtx, quartetCtx);

function simplifyInputs(obj) {
    // Make analysis a bit easier to read by shortening node_modules paths:
    // node_modules/.pnpm/package@ver/node_modules/package -> package
    obj.inputs = Object.fromEntries(Object.entries(obj.inputs).map(
        ([k, v]) => [k.replace(/^node_modules\/(\.pnpm\/.*\/node_modules\/)?/, ""), v]
    ));
}

if (watch) {
    contexts.forEach(ctx => ctx.watch());
} else {
    for (const ctx of contexts) {
        const { metafile } = await ctx.rebuild();
        if (!metafile) throw "fish";
        simplifyInputs(metafile);
        Object.values(metafile.outputs).forEach(simplifyInputs);
        console.log(await esbuild.analyzeMetafile(metafile));
        await ctx.dispose();
    }
}
