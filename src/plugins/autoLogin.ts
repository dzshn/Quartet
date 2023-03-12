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

const settings = definePluginSettings({
    mode: {
        type: SettingType.SELECT,
        title: "when to skip",
        options: [
            { label: "always", value: "always", title: "Always skip the login screen" },
            { label: "when needed", value: "quickjoin", title: "Skip the login screen when using replay or room URLs" },
        ],
        default: "always",
        requiresRestart: true,
    },
});

export default {
    name: "AutoLogin",
    description: "Skip the login screen on web versions",
    authors: [Devs.dzshn],
    target: "web",
    settings,
    patches: [
        {
            match: /window\.IS_ELECTRON&&"never"!==\w+\.electron\.loginskip/,
            replace: "true",
        },
        {
            match: /"always"===\(\w+\.electron\.loginskip\|\|"always"\)/,
            replace: "true",
            predicate: () => settings.data.mode === "always",
        },
    ],
} satisfies Plugin;
