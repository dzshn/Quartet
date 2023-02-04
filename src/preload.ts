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

import { anonymousUA } from "@api/constants";
import { Settings } from "@api/settings";
import { contextBridge, webFrame } from "electron";
import { readFileSync } from "fs";
import { join } from "path";
import QuartetBeryl from "QuartetBeryl";
import { IpcChannel } from "types";

contextBridge.exposeInMainWorld("QuartetBeryl", QuartetBeryl);

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

webFrame.executeJavaScript(readFileSync(join(__dirname, "quartet.js"), "utf-8"));
