import { Log } from "@api";
import { ipcRenderer, IpcRendererEvent } from "electron";
import { graphics } from "systeminformation";
import { IpcChannel } from "types";

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
        }
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
