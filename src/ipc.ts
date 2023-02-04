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
