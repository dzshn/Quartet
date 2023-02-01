/*!
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

import type { BaseTexture } from "pixi.js";

export * as Api from "@api";
export { Settings } from "@api/settings";
export * as Patcher from "@patcher";

type TextureName = "i" | "j" | "l" | "o" | "s" | "t" | "z" | "d" | "gb" | "gbd";

type ResourceType = "sfx" | "fonts" | "textures" | "feecof" | "homebanner" | "environment";

export const GrabbedObjects = {} as {
    transitionTo: (menuId: string, /* no idea yet */ _?: boolean) => void,
    menus: Record<string, {
        header: string;
        footer: string;
        back: string | null;
        onenter?: () => void;
        onexit?: () => void;
        onreenter?: () => void;
    }>;
    layout: Record<string, {
        starter: string;
        back: string;
        items: Record<string, {
            up?: string;
            down?: string;
            left?: string;
            right?: string;
        }>;
    }>;
    assets: Record<string, {
        id: string;
        name: string;
        format: "simple" | "connected",
        assets: Record<string, Record<"hd" | "uhd", {
            url: string;
            loaded: boolean;
            loading: boolean;
            baseTexture?: BaseTexture;
            textures: Record<string, unknown>;
        }>>;
        colors: Record<"base" | "glow", Record<TextureName, number>>;
    }>;
    Loader: {
        /** Adds a callback that will be called once everything is loaded (and after login) */
        ready: (cb: (_: unknown) => void) => void;
        /** Sets everything as loaded. Calls all ready callbacks. */
        finish: () => void;
        /** Goes back to loading screen. */
        unready: () => void;
        /** Sets the state of a resource to a message (shown on bottom right on load screen) */
        setState: (resource: ResourceType, state: string) => void;
        /** Unsets the state of a resource, meaning it loaded. */
        finishLoad: (resource: ResourceType) => void;
        /** Force-updates the game. If silent, a notification will not be shown. */
        update: (silent: boolean) => void;
        /** Set from bootstrap.js(?), this returns the SHA-1 sum of tetrio.js */
        i: () => string;
    }
};
