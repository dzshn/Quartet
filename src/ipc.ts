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

import { app, ipcMain } from "electron";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { DataDir, IpcChannel } from "types";

export const DATA_DIR = join(app.getPath("userData"), "..", "Quartet");
export const SETTINGS_PATH = join(DATA_DIR, "settings.json");
export const THEMES_DIR = join(DATA_DIR, "themes");

export function readSettingsSync() {
    try {
        return readFileSync(SETTINGS_PATH, "utf-8");
    } catch (err) {
        return "{}";
    }
}

export function writeSettingsSync(data: string) {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(SETTINGS_PATH, data);
}

ipcMain.on(IpcChannel.GET_SETTINGS, event => event.returnValue = readSettingsSync());
ipcMain.on(IpcChannel.SET_SETTINGS, (_, data: string) => writeSettingsSync(data));
ipcMain.on(IpcChannel.GET_PATH, (event, dir: DataDir) => {
    if (dir === DataDir.DATA)
        event.returnValue = DATA_DIR;
    else if (dir === DataDir.SETTINGS)
        event.returnValue = SETTINGS_PATH;
    else if (dir === DataDir.THEMES)
        event.returnValue = THEMES_DIR;
    else
        throw new Error(`unknown directory ${dir}`);
});
