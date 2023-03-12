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

import { Devs } from "@api/constants";
import { definePluginSettings, SettingType } from "@api/settings";
import { Plugin } from "patcher";
import { writable } from "svelte/store";

import SkinSetting from "./components/SkinSetting.svelte";

const settings = definePluginSettings({
    skin: {
        type: SettingType.CUSTOM,
        component: SkinSetting,
    },
});

export interface Skin {
    name: string;
    file: File;
    url: string;
}

export const skins = writable([] as Skin[]);

export default {
    name: "AssetManager",
    description: "meow",
    authors: [Devs.dzshn],
    default: true,
    settings,
} satisfies Plugin;
