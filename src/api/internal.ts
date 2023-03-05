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

type Objects = typeof import("@api/objects");

const setters = {} as Record<keyof Objects, (v: any) => void>;

/**
 * Magic write-only object for use in patches.
 * @see {@link src/plugins/core} for usage.
 */
export const Objects = new Proxy({}, {
    get() {
        throw new Error("Write-only object.");
    },
    set: (_, prop: keyof Objects, value) => {
        setters[prop](value);
        return true;
    },
});

export function grabberFor<K extends keyof Objects>(name: K, callback: (v: Objects[K]) => void) {
    setters[name] = callback;
}
