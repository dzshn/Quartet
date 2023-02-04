import { IpcChannel } from "types";

const quartetChannels = Object.entries(IpcChannel).map(([, v]) => v);

function assertChannelAllowed(channel: IpcChannel) {
    if (!quartetChannels.includes(channel))
        throw new Error(`Illegal IPC channel ${channel}. This incident will be reported.`);
}

const listeners: Record<IpcChannel, (...args: any[]) => any> = {
    [IpcChannel.GET_SETTINGS]: () => localStorage.getItem("quartetConfig") ?? "{}",
    [IpcChannel.SET_SETTINGS]: (data: string) => localStorage.setItem("quartetConfig", data),
    [IpcChannel.GET_PATH]: () => { throw new Error("Not available in browsers!"); }
};

export const QuartetBeryl = {
    ipc: {
        on(channel: IpcChannel) {
            assertChannelAllowed(channel);
        },
        send(channel: IpcChannel, ...args: any[]) {
            assertChannelAllowed(channel);
            listeners[channel](...args);
        },
        sendSync(channel: IpcChannel, ...args: any[]): any {
            assertChannelAllowed(channel);
            return listeners[channel](...args);
        },
        async invoke(channel: IpcChannel): Promise<any> {
            assertChannelAllowed(channel);
        }
    },
};
