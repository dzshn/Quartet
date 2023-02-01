import { Plugins } from "@patcher";

// TODO: bother with ipc and all that (tetr.io also uses localStorage btw)

export interface Settings {
    plugins: Record<string, {
        enabled: boolean;
        [option: string]: any;
    }>;
}

const defaults = {
    plugins: {},
};

const settings = (() => {
    try {
        return { ...defaults, ...JSON.parse(localStorage.getItem("quartetConfig") || "") };
    } catch {
        return defaults;
    }
})() as Settings;

export enum SettingType {
    STRING,
    BOOLEAN,
}

const proxyCache: Record<string, any> = {};

function makeProxy<T extends object>(settings: T, root: object = settings, path = ""): T {
    return proxyCache[path] ??= new Proxy(settings, {
        get(target, prop: Extract<keyof T, string>) {
            const value = target[prop];

            if (!(prop in target)) {
                if (path === "plugins" && prop in Plugins) {
                    return (target[prop] as any) = makeProxy({
                        enabled: Plugins[prop].required || false
                    }, root, `plugins.${prop}`);
                }

                return value;
            }

            if (typeof value === "object" && !Array.isArray(value) && value != null)
                return makeProxy(value, root, `${path}${path && "."}${prop}`);

            return value;
        },
        set(target, prop: Extract<keyof T, string>, value) {
            target[prop] = value;
            localStorage.setItem("quartetConfig", JSON.stringify(root));
            return true;
        },
    });
}

export const Settings = makeProxy(settings);

type TypeOfSetting<O extends PluginSettingDef> =
    O extends StringPluginSetting ? string :
    never;

type SettingsData<D extends SettingsDefinition> = {
    [K in keyof D]: TypeOfSetting<D[K]>;
};

export interface DefinedSettings<D extends SettingsDefinition = SettingsDefinition> {
    data: SettingsData<D>;
    def: D;
    pluginName: string;
    // TODO: svelte store
}

export interface StringPluginSetting {
    type: SettingType.STRING;
    title: string;
    description?: string;
    default?: string;
    placeholder?: string;
}

export interface BooleanPluginSetting {
    type: SettingType.BOOLEAN;
    title: string;
    default?: string;
}

export type SettingsDefinition = Record<string, PluginSettingDef>;

export type PluginSettingDef = (
    StringPluginSetting | BooleanPluginSetting
);

export function definePluginSettings<D extends SettingsDefinition>(def: D) {
    const definedSettings = {
        get data() {
            if (!definedSettings.pluginName)
                throw new Error("not initialised yet!!");
            return Settings.plugins[definedSettings.pluginName];
        },
        def,
        pluginName: "",
    } as DefinedSettings<D>;
    return definedSettings;
}