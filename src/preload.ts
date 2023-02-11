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

import { Log } from "@api";
import { anonymousUA } from "@api/constants";
import { Settings } from "@api/settings";
import { contextBridge, webFrame } from "electron";
import fs, { readFileSync, watch } from "fs";
import { join } from "path";
import QuartetBeryl from "QuartetBeryl";
import { DataDir, IpcChannel } from "types";
import { promisify } from "util";

const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

contextBridge.exposeInMainWorld("QuartetBeryl", QuartetBeryl);

const themesDir = QuartetBeryl.ipc.sendSync(IpcChannel.GET_PATH, DataDir.THEMES);

let settings: Partial<Settings>;
try {
    settings = JSON.parse(QuartetBeryl.ipc.sendSync(IpcChannel.GET_SETTINGS));
} catch (error) {
    settings = {};
}

if (settings.Quartet?.anonymiseFingerprint)
    webFrame.executeJavaScript(`
        void Object.defineProperty(navigator, "userAgent", {
            get: () => ${JSON.stringify(anonymousUA)},
        });
    `);

const themeKeys: Record<string, string> = {};

async function applyThemeFile(path: string) {
    const key = themeKeys[path];
    if (key)
        webFrame.removeInsertedCSS(key);

    Log.log("CSS", key ? `Reapplying ${path}` : `Applying ${path}`);

    try {
        themeKeys[path] = webFrame.insertCSS(
            await readFile(path, { encoding: "utf-8" })
        );
    } catch (err) {
        Log.error("CSS", `Error applying ${path}`, err);
    }
}

(async () => {
    try {
        await mkdir(themesDir, { recursive: true });
        for (const filename of await readdir(themesDir)) {
            if (filename.startsWith(".") || !filename.endsWith(".css"))
                continue;

            await applyThemeFile(join(themesDir, filename));
        }

        const fileTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

        watch(themesDir, { persistent: false }, async (event, filename) => {
            const path = join(themesDir, filename);
            if (!filename || filename.startsWith(".") || !filename.endsWith(".css"))
                return;

            if (event === "rename") {
                try {
                    await stat(path);
                } catch (err) {
                    Log.log("CSS", `unloading ${path} (file deleted)`);
                    const key = themeKeys[path];
                    if (key)
                        webFrame.removeInsertedCSS(key);
                }
                return;
            }

            // Debounce theme updates
            clearTimeout(fileTimeouts[filename]);
            fileTimeouts[filename] = setTimeout(() => applyThemeFile(path), 600);
        });
    } catch (err) {
        Log.error("CSS", err);
    }
})();

webFrame.executeJavaScript(readFileSync(join(__dirname, "quartet.js"), "utf-8"));
