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

import { IpcCallback, IpcChannel } from "types";

const quartetChannels = Object.entries(IpcChannel).map(([, v]) => v);

function assertChannelAllowed(channel: IpcChannel) {
    if (!quartetChannels.includes(channel))
        throw new Error(`Illegal IPC channel ${channel}. This incident will be reported.`);
}

const listeners: { [C in IpcChannel]: IpcCallback<C> } = {
    [IpcChannel.GET_SETTINGS]: () => localStorage.getItem("quartetConfig") ?? "{}",
    [IpcChannel.SET_SETTINGS]: data => localStorage.setItem("quartetConfig", data),
    [IpcChannel.GET_PATH]: () => {
        throw new Error("Not available in browsers!");
    },
};

export const QuartetBeryl = {
    ipc: {
        on(channel) {
            assertChannelAllowed(channel);
        },
        send(channel, ...args) {
            assertChannelAllowed(channel);
            listeners[channel](...args);
        },
        sendSync(channel, ...args) {
            assertChannelAllowed(channel);
            return listeners[channel](...args);
        },
        async invoke(channel, ...args) {
            assertChannelAllowed(channel);
            return listeners[channel](...args);
        },
    },
} as Pick<typeof import("QuartetBeryl").default, "ipc">;
