import { ipcRenderer, IpcRendererEvent } from "electron";
import { graphics } from "systeminformation";

type IpcRendererListener = (event: IpcRendererEvent, ...args: any[]) => void;

const Beryl = {
    refreshRate: 60,
    /**
     * Replacement for window.IPC (TETR.IO's preload.js sets it to ipcRenderer)
     */
    ipc: {
        on(channel: string, listener: IpcRendererListener) {
            ipcRenderer.on(channel, listener);
        },
        send(channel: string, ...args: any[]) {
            ipcRenderer.send(channel, ...args);
        },
    },
};

graphics().then(({ displays }) => {
    Beryl.refreshRate = Math.max(...displays.map(({ currentRefreshRate }) => currentRefreshRate || 60));
});

export default Beryl;
