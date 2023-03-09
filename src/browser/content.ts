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

type Browser = typeof import("webextension-polyfill");

const browser: Browser = typeof (globalThis as any).browser === "undefined"
    ? (globalThis as any).chrome
    : (globalThis as any).browser;

const script = document.createElement("script");
script.src = browser.runtime.getURL("quartet.js");
document.documentElement.prepend(script);
