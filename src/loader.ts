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

import { anonymousUA } from "@api/constants";
import { Settings } from "@api/settings";
import electron, { app, BrowserWindowConstructorOptions, session } from "electron";
import { readSettingsSync } from "ipc";
import { join } from "path";

console.log(
    "[Quartet] Loading...\n"
        + "  ／l、      \n"
        + "（ﾟ､ ｡ ７    \n"
        + "  l、 ~ヽ    \n"
        + "  じしf_,)ノ ",
);

console.log(`[Quartet] On v${QUARTET_VERSION}`);
for (const p of ["node", "v8", "uv", "electron", "chrome"])
    console.log(`  ; ${p} ${process.versions[p]}`);

const tetrioAsarPath = join(require.main!.path, "..", "_app.asar");

// @ts-ignore skull emoji
app.setAppPath(tetrioAsarPath);

if (!process.argv.includes("--vanilla")) {
    process.env.__TETRIO_ASAR = tetrioAsarPath;

    let settings: Partial<Settings>;
    try {
        settings = JSON.parse(readSettingsSync());
    } catch {
        settings = {};
    }

    class BrowserWindow extends electron.BrowserWindow {
        constructor(options?: BrowserWindowConstructorOptions) {
            if (options?.webPreferences?.preload && options.title) {
                options.webPreferences.preload = join(__dirname, "preload.js");
                // We rewrite preload completely, so we might as well make it safer.
                options.webPreferences.contextIsolation = true;
                // @ts-ignore (doesn't exist in newer electron versions)
                options.webPreferences.worldSafeExecuteJavaScript = true;
                // Why is this set to false??
                options.webPreferences.backgroundThrottling = true;
            }

            super(options);

            // Silly hack in case you cannot open devtools (usually because you exploded this script or preload)
            if (process.argv.includes("--devtools"))
                // @ts-ignore
                this.toggleDevTools();
        }
    }

    Object.assign(BrowserWindow, electron.BrowserWindow);
    const cachedElectron = require.cache[require.resolve("electron")]!;
    delete cachedElectron.exports;
    cachedElectron.exports = { ...electron, BrowserWindow };

    app.whenReady().then(() => {
        // Default is to always do, but defaults may not be set yet, so regard null as true
        if (settings.Quartet?.anonymiseFingerprint !== false) {
            session.defaultSession.webRequest.onBeforeSendHeaders(({ requestHeaders }, cb) => {
                requestHeaders["user-agent"] = anonymousUA;
                cb({ cancel: false, requestHeaders });
            });
        }
    });

    console.log("[Quartet] Loaded! Booting up game now");
} else {
    console.log("[Quartet] nvm");
}

require(join(tetrioAsarPath, "main.js"));
