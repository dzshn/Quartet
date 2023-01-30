import type { ComponentType } from "svelte";
import plugins from "~plugins";

import { Log } from "@api";
import { Settings } from "@api/settings";

export const bootstrapDone = new Promise<void>(r => resolveBootstrap = r);

let resolveBootstrap: () => void;

type HookTarget = "after" | "before" | "head" | "tail";

export interface ComponentHook {
    component: ComponentType;
    target: HookTarget;
    at: string;
}

export interface Patch {
    match: string | RegExp;
    replace: string;
    predicate?: () => boolean;
}

export interface PluginAuthor {
    name: string;
    /** A website you'd like to link yourself to. */
    url?: string;
    /** Your github username. Used to fetch a profile picture */
    github?: string;
}

export interface Plugin {
    name: string;
    description: string;
    authors: PluginAuthor[];
    required?: boolean;
    patches: Patch[];
    components: ComponentHook[];
    start?: () => void;
    stop?: () => void;
}

// TETR.IO is launched from /bootstrap.js, which makes a XHR to /js/tetrio.js and evals it
// We intercept that by temporarily replacing window.eval (lol)
const originalEval = window.eval;
window.eval = (x) => {
    window.eval = originalEval; // only do this once
    originalEval.call(undefined, applyPatches(x));
    resolveBootstrap();
};

export function hookComponent(component: ComponentType, target: HookTarget, at: string): InstanceType<ComponentType> {
    const query = document.querySelector(at);
    if (!query)
        throw new Error("query failed");

    const parent = query.parentElement;
    if (!parent && (target === "after" || target === "before"))
        throw new Error("queried object has no parent, but is needed");

    if (target === "after")
        return new component({ target: parent!, anchor: query.nextElementSibling || undefined });

    if (target === "before")
        return new component({ target: parent!, anchor: query });

    if (target === "head")
        return new component({ target: query, anchor: query.firstElementChild || undefined });

    if (target === "tail")
        return new component({ target: query });

    throw new Error("invalid target");
}

function applyPatches(src: string): string {
    Log.log("Patcher", "Applying all patches now!");
    for (const plugin of plugins) {
        if (Settings.plugins[plugin.name] == null)
            Settings.plugins[plugin.name] = { enabled: !!plugin.required };

        if (!Settings.plugins[plugin.name].enabled)
            continue;

        if (plugin.patches.length)
            Log.log("Patcher", "Applying patches from", plugin.name);

        for (const patch of plugin.patches) {
            if (patch.predicate && !patch.predicate())
                continue;

            const newSrc = src.replace(patch.match, patch.replace);
            if (src === newSrc)
                Log.warn("Patcher", `Patch for ${plugin.name} failed! ${patch.match} -> ${patch.replace}`);

            src = newSrc;
        }
    }

    return src;
}

bootstrapDone.then(() => {
    Log.log("Patcher", "Hooking up all components now!");
    for (const plugin of plugins) {
        if (!plugin.required && !Settings.plugins[plugin.name].enabled)
            continue;

        if (plugin.components.length)
            Log.log("Patcher", "Hooking up components from", plugin.name);

        for (const { component, target, at } of plugin.components) {
            try {
                hookComponent(component, target, at);
            } catch (err) {
                Log.warn("Patcher", `Hooking compoment for ${plugin.name} failed! ${err}`);
            }
        }
    }
});
