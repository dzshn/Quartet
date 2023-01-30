import process from "node:process";
import esbuild from "esbuild";
import * as svelte from "svelte/compiler";
import sveltePreprocess from "svelte-preprocess";
import { readFile, readdir } from "node:fs/promises";
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
    logLevel: "info",
    metafile: true,
    minify: !watch,
    bundle: true,
    platform: "node",
    target: ["ESNext"],
    external: ["electron"],
    sourcemap: watch ? "inline" : "external",
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
        {
            name: "plugins",
            setup(build) {
                build.onResolve({ filter: /^~plugins$/ }, (args) => ({
                    namespace: "all-plugins", path: args.path
                }));
                build.onLoad({ filter: /^~plugins$/, namespace: "all-plugins" }, async (args) => {
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
        console.log(await esbuild.analyzeMetafile(metafile))
        await ctx.dispose();
    }
}
