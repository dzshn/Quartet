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
import { ipcRenderer, IpcRendererEvent } from "electron";
import { IpcChannel } from "types";
import { join } from "path";

const { graphics }: typeof import("systeminformation") = require(
    join(process.env.__TETRIO_ASAR!, "node_modules/systeminformation")
);

type IpcRendererListener = (event: IpcRendererEvent, ...args: any[]) => void;

const tetrioChannels = [
    "anglecompat",
    "blockmovement",
    "close",
    "devtools",
    "emergency",
    "flash",
    "fullscreen",
    "goto",
    "nuke",
    "presence",
    "vsync",
];

const quartetChannels = Object.entries(IpcChannel).map(([, v]) => v);

function assertChannelAllowed(channel: IpcChannel) {
    if (!quartetChannels.includes(channel))
        throw new Error(`Illegal IPC channel ${channel}. This incident will be reported.`);
}

const Beryl = {
    refreshRate: 60,
    ipc: {
        on(channel: IpcChannel, listener: IpcRendererListener) {
            assertChannelAllowed(channel);
            ipcRenderer.on(channel, listener);
        },
        send(channel: IpcChannel, ...args: any[]) {
            assertChannelAllowed(channel);
            ipcRenderer.send(channel, ...args);
        },
        sendSync(channel: IpcChannel, ...args: any[]): any {
            assertChannelAllowed(channel);
            return ipcRenderer.sendSync(channel, ...args);
        },
        invoke(channel: IpcChannel, ...args: any[]): Promise<any> {
            assertChannelAllowed(channel);
            return ipcRenderer.invoke(channel, ...args);
        },
    },
    /**
     * Replacement for window.IPC (TETR.IO's preload.js sets it to ipcRenderer)
     *
     * @private
     */
    _tetrioIpc: {
        // Don't throw, just do nothing
        on(channel: string, listener: IpcRendererListener) {
            if (!tetrioChannels.includes(channel))
                Log.error("Beryl", `unknown channel ${channel} called from unsafe IPC`);
            else
                ipcRenderer.on(channel, listener);
        },
        send(channel: string, ...args: any[]) {
            if (!tetrioChannels.includes(channel))
                Log.error("Beryl", `unknown channel ${channel} called from unsafe IPC`);
            else
                ipcRenderer.send(channel, ...args);
        },
    },
};

graphics().then(({ displays }) => {
    Beryl.refreshRate = Math.max(...displays.map(({ currentRefreshRate }) => currentRefreshRate || 60));
});

export default Beryl;
