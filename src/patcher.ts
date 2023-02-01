import { Log } from "@api";
import { DefinedSettings, Settings } from "@api/settings";
import type { ComponentType } from "svelte";

import plugins from "~plugins";

export const Plugins = Object.fromEntries(plugins.map(p => [p.name, p]));

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
    patches?: Patch[];
    components?: ComponentHook[];
    start?: () => void;
    stop?: () => void;
    settings?: DefinedSettings;
}

// TETR.IO is launched from /bootstrap.js, which makes a XHR to /js/tetrio.js and evals it
// We intercept that by temporarily replacing window.eval (lol)
const originalEval = window.eval;
window.eval = x => {
    window.eval = originalEval; // only do this once
    x += "\n//# sourceURL=TETRIO\n";
    originalEval.call(undefined, applyPatches(x));
    resolveBootstrap();
};

export function hookComponent(component: ComponentType, target: HookTarget, at: string) {
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

function initialiseSettings(plugin: Plugin) {
    Settings.plugins[plugin.name] ??= { enabled: !!plugin.required };
    if (!plugin.settings)
        return;

    plugin.settings.pluginName = plugin.name;
    for (const [key, def] of Object.entries(plugin.settings.def)) {
        if ("default" in def)
            Settings.plugins[plugin.name][key] = def.default;
    }
}

function applyPatches(src: string): string {
    Log.log("Patcher", "Applying all patches now!");
    for (const plugin of plugins) {
        initialiseSettings(plugin);
        if (!Settings.plugins[plugin.name].enabled)
            continue;

        if (plugin.patches?.length)
            Log.log("Patcher", "Applying patches from", plugin.name);

        for (const patch of plugin.patches || []) {
            if (patch.predicate && !patch.predicate())
                continue;

            const newSrc = src.replace(patch.match, patch.replace);
            if (src === newSrc)
                Log.warn("Patcher", `Patch for ${plugin.name} had no effect! ${patch.match} -> ${patch.replace}`);

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

        if (plugin.components?.length)
            Log.log("Patcher", "Hooking up components from", plugin.name);

        for (const { component, target, at } of plugin.components || []) {
            try {
                hookComponent(component, target, at);
            } catch (err) {
                Log.warn("Patcher", `Hooking compoment for ${plugin.name} failed! ${err}`);
            }
        }
    }

    Log.log("Patcher", "Starting up all plugins now!");
    for (const plugin of plugins) {
        if (!plugin.required && !Settings.plugins[plugin.name].enabled)
            continue;

        if (!plugin.start)
            continue;

        Log.log("Patcher", "Starting", plugin.name);
        plugin.start();
    }
});
