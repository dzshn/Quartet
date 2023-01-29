import QuartetConfig from "@components/QuartetConfig.svelte";
import QuartetConfigMenu from "@components/QuartetConfigMenu.svelte";
import type { ComponentType } from "svelte";
import { Log } from "./api";
import type { BaseTexture } from "pixi.js";

export * as Api from "./api";

let resolveBootstrap: () => void;

export const bootstrapDone = new Promise<void>(r => { resolveBootstrap = r; });

type TextureName = "i" | "j" | "l" | "o" | "s" | "t" | "z" | "d" | "gb" | "gbd";

export const GrabbedObjects = {} as {
    transitionTo: (menuId: string, /* no idea yet */ _?: boolean) => void,
    menus: Record<string, {
        header: string,
        footer: string,
        back: string | null,
        onenter?: () => void,
        onexit?: () => void,
        onreenter?: () => void,
    }>,
    assets: Record<string, {
        id: string,
        name: string,
        format: "simple" | "connected",
        assets: Record<string, Record<"hd" | "uhd", {
            url: string,
            loaded: boolean,
            loading: boolean,
            baseTexture?: BaseTexture,
            textures: Record<string, unknown>,
        }>>,
        colors: Record<"base" | "glow", Record<TextureName, number>>,
    }>
};

const patches = [
    {
        match: /function (\w+)\(\w+,\w+\)\{.{1,100}\[data-menuview\].{1,1000}\.bindGuide\(.{1,50}\|\|\{\}\)\}/,
        replace: "$&Quartet.GrabbedObjects.transitionTo=$1;",
    },
    {
        match: /(const \w+=)(\{none:\{back:null)/,
        replace: "$1Quartet.GrabbedObjects.menus=$2"
    },
    {
        match: /(const \w+=)(\{tetrio:\{id:)/,
        replace: "$1Quartet.GrabbedObjects.assets=$2",
    }
];

function applyPatches(src: string): string {
    Log.log("Patcher", "Applying patches now!");

    for (const patch of patches) {
        const newSrc = src.replace(patch.match, patch.replace);

        if (newSrc === src)
            Log.warn("Patcher", `Standard patch had no effect: ${patch.match} -> ${patch.replace}`);

        src = newSrc;
    }

    return src;
}


type HookTarget = {
    [K in "after" | "before" | "head" | "tail"]?: string
};


function hookComponent(component: ComponentType, { after, before, head, tail }: HookTarget) {
    if ([after, before, head, tail].filter(Boolean).length !== 1)
        throw new Error("one of after, before, head or tail must be given");

    const target = document.querySelector((after || before || head || tail)!);
    if (!target)
        throw new Error("query failed");

    const parent = target.parentElement;
    const next = target.nextElementSibling;
    const prev = target.previousElementSibling;

    if ((after || before) && !parent)
        throw new Error("no parent for queried element");

    if ((after || tail) && !next)
        throw new Error("no next sibling for queried element");

    if (after)
        new component({ target: parent!, anchor: next! });
    else if (before)
        new component({ target: parent!, anchor: prev! });
    else if (head)
        new component({ target, anchor: target.firstElementChild || undefined });
    else
        new component({ target });
}

// TETR.IO is launched from /bootstrap.js, which makes a XHR to /tetrio.js and evals it
// We intercept that by replacing window.eval
const originalEval = window.eval;
window.eval = (x) => {
    window.eval = originalEval; // only do this once
    originalEval.call(undefined, applyPatches(x));
    resolveBootstrap();
};

(async () => {
    await bootstrapDone;

    Log.log("Patcher", "Hooking up custom components!");
    hookComponent(QuartetConfig, { after: "#config_electron" });
    hookComponent(QuartetConfigMenu, { tail: "#menus" });
})();
