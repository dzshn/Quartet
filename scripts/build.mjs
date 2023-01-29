import process from "node:process";
import esbuild from "esbuild";
import * as svelte from "svelte/compiler";
import sveltePreprocess from "svelte-preprocess";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";


const watch = process.argv.includes("--watch");
const gitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();

const sveltePreprocessor = sveltePreprocess({
    typescript({ content }) {
        return esbuild.transformSync(content, { loader: "ts" });
    }
});


/** @type {import("esbuild").BuildOptions} */
const esbuildOpts = {
    minify: !watch,
    logLevel: "info",
    bundle: true,
    platform: "node",
    target: ["ESNext"],
    external: ["electron"],
    sourcemap: "inline",
    legalComments: "linked",
    plugins: [
        {
            name: "svelte",
            setup(build) {
                build.onLoad({ filter: /\.svelte$/ }, async (args) => {
                    const src = await readFile(args.path, "utf-8");

                    let contents = (await svelte.preprocess(src, sveltePreprocessor)).code;
                    contents = svelte.compile(contents).js.code;

                    return { contents, loader: "js" };
                });
            },
        },
    ],
    define: {
        QUARTET_VERSION: JSON.stringify(`${process.env.npm_package_version} (${gitHash})`),
    }
};

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

const contexts = [loaderCtx, preloadCtx, quartetCtx];

if (watch) {
    contexts.forEach(ctx => ctx.watch());
} else {
    await Promise.all(contexts.map(ctx => ctx.rebuild()));
    await Promise.all(contexts.map(ctx => ctx.dispose()));
}
