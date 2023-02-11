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

import { Plugins } from "@patcher";
import { ComponentType } from "svelte";
import { IpcChannel } from "types";

// TODO: bother with ipc and all that (tetr.io also uses localStorage btw)

export interface Settings {
    [plugin: string]: {
        enabled: boolean;
        [option: string]: any;
    };
}

const settings = (() => {
    try {
        return JSON.parse(QuartetBeryl.ipc.sendSync(IpcChannel.GET_SETTINGS));
    } catch {
        return {};
    }
})() as Settings;

const proxyCache: Record<string, any> = {};

function makeProxy<T extends object>(settings: T, root: object = settings, path = ""): T {
    return proxyCache[path] ??= new Proxy(settings, {
        get(target, prop: Extract<keyof T, string>) {
            const value = target[prop];

            if (!(prop in target)) {
                if (path === "" && prop in Plugins) {
                    return (target[prop] as any) = makeProxy(
                        {
                            enabled: Plugins[prop].required || false,
                        },
                        root,
                        `${prop}`,
                    );
                }

                return value;
            }

            if (typeof value === "object" && !Array.isArray(value) && value != null)
                return makeProxy(value, root, `${path}${path && "."}${prop}`);

            return value;
        },
        set(target, prop: Extract<keyof T, string>, value) {
            target[prop] = value;
            QuartetBeryl.ipc.send(IpcChannel.SET_SETTINGS, JSON.stringify(root, null, 4));
            return true;
        },
    });
}

export const Settings = makeProxy(settings);

export enum SettingType {
    STRING,
    BOOLEAN,
    SELECT,
    CUSTOM,
}

type TypeOfSetting<O extends PluginSettingDef> = O extends StringPluginSetting ? string
    : never;

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
    description?: string;
    default?: boolean;
}

export interface SelectPluginSetting {
    type: SettingType.SELECT;
    title: string;
    description?: string;
    options: (string | { label: string; value: string; title?: string })[];
    default?: string;
}

export interface CustomPluginSetting {
    type: SettingType.CUSTOM;
    component: ComponentType;
}

export type SettingsDefinition = Record<string, PluginSettingDef>;

export type PluginSettingDef =
    & (
        | StringPluginSetting
        | BooleanPluginSetting
        | SelectPluginSetting
        | CustomPluginSetting
    )
    & {
        title: string;
        requiresRestart?: boolean;
    };

export function definePluginSettings<D extends SettingsDefinition>(def: D) {
    const definedSettings = {
        get data() {
            if (!definedSettings.pluginName)
                throw new Error("not initialised yet!!");
            return Settings[definedSettings.pluginName];
        },
        def,
        pluginName: "",
    } as DefinedSettings<D>;
    return definedSettings;
}
