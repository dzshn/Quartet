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

import { IpcRendererEvent } from "electron";

export enum IpcChannel {
    GET_SETTINGS = "QuartetGetSettings",
    SET_SETTINGS = "QuartetSetSettings",
    GET_PATH = "QuartetGetPath",
}

interface IpcSpec {
    [IpcChannel.GET_SETTINGS]: () => string;
    [IpcChannel.SET_SETTINGS]: (settings: string) => void;
    [IpcChannel.GET_PATH]: (dir: DataDir) => string;
}

export type IpcArguments<C extends IpcChannel> = Parameters<IpcSpec[C]>;
export type IpcReturn<C extends IpcChannel> = ReturnType<IpcSpec[C]>;
export type IpcCallback<C extends IpcChannel> = (...args: IpcArguments<C>) => IpcReturn<C>;

export type IpcRendererListener<T extends any[]> = (event: IpcRendererEvent, ...args: T) => void;

export interface Ipc {
    on<C extends IpcChannel>(channel: C, listener: IpcRendererListener<IpcArguments<C>>): void;
    send<C extends IpcChannel>(channel: C, ...args: IpcArguments<C>): void;
    sendSync<C extends IpcChannel>(channel: C, ...args: IpcArguments<C>): IpcReturn<C>;
    invoke<C extends IpcChannel>(channel: C, ...args: IpcArguments<C>): Promise<IpcReturn<C>>;
}

export enum DataDir {
    DATA,
    SETTINGS,
    THEMES,
}
