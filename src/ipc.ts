import { app, ipcMain } from "electron";
import { readFileSync, writeFileSync } from "fs";
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

ipcMain.handle(IpcChannel.GET_SETTINGS, () => readSettingsSync());
ipcMain.handle(IpcChannel.SET_SETTINGS, (_, data: string) => writeFileSync(SETTINGS_PATH, data));
