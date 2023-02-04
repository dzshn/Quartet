import { app, ipcMain } from "electron";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { IpcChannel } from "types";

export const DATA_DIR = join(app.getPath("userData"), "..", "Quartet");
export const SETTINGS_PATH = join(DATA_DIR, "settings.json");

export function readSettingsSync() {
    try {
        return readFileSync(SETTINGS_PATH, "utf-8");
    } catch (err) {
        return "{}";
    }
}

export function writeSettingsSync(data: string) {
    mkdirSync(DATA_DIR, { recursive: true });
    return writeFileSync(SETTINGS_PATH, data);
}

ipcMain.on(IpcChannel.GET_SETTINGS, event => event.returnValue = readSettingsSync());
ipcMain.on(IpcChannel.SET_SETTINGS, (event, data: string) => event.returnValue = writeSettingsSync(data));
