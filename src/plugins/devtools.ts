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
import { Loader, Menus, transitionTo } from "@api/objects";
import { definePluginSettings, SettingType } from "@api/settings";
import { Plugin } from "@patcher";

const settings = definePluginSettings({
    immediatelyTransitionTo: {
        type: SettingType.SELECT,
        title: "immediately transition to here when TETR.IO starts",
        description:
            "When the game starts, you'll see this menu instead of the main one. This is useful if you're working on one",
        default: "none",
        // We use a getter as the DOM might not be loaded yet
        get options() {
            const menus = [...document.querySelectorAll("[data-menuview]")]
                .map(el => (el as HTMLElement).dataset.menuview!);

            // If we're called before components are hooked, include them
            if (!menus.includes("config_quartet"))
                menus.push("config_quartet");

            return [
                "none",
                // Also sort by length so options grid looks a bit nicer
                ...menus.sort().sort((a, b) => a.length - b.length).map(key => {
                    const menu = Menus[key];
                    return { label: key, value: key, title: `Header: ${menu.header}\nFooter: ${menu.footer}` };
                }),
            ];
        },
    },
});

export default {
    name: "Devtools",
    description: "useful stuff for plugin developers",
    authors: [Devs.dzshn],
    settings,

    start() {
        if (settings.data.immediatelyTransitionTo !== "none") {
            Loader.ready(() => {
                transitionTo(settings.data.immediatelyTransitionTo);
            });
        }
    },
} satisfies Plugin;
