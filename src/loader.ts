import electron, { app, BrowserWindowConstructorOptions } from "electron";
import { join } from "path";


console.log(
    "[Quartet] Loading...\n" +
    "  ／l、      \n" +
    "（ﾟ､ ｡ ７    \n" +
    "  l、 ~ヽ    \n" +
    "  じしf_,)ノ ",
);

const tetrioAsarPath = join(require.main!.path, "..", "_app.asar");

//@ts-ignore skull emoji
app.setAppPath(tetrioAsarPath);

if (!process.argv.includes("--vanilla")) {
    process.env.__TETRIO_PRELOAD_PATH = join(tetrioAsarPath, "preload.js");

    class BrowserWindow extends electron.BrowserWindow {
        constructor(options?: BrowserWindowConstructorOptions) {
            if (options?.webPreferences?.preload && options.title)
                options.webPreferences.preload = join(__dirname, "preload.js");

            super(options);
        }
    }

    Object.assign(BrowserWindow, electron.BrowserWindow);
    const cachedElectron = require.cache[require.resolve("electron")]!;
    delete cachedElectron.exports;
    cachedElectron.exports = { ...electron, BrowserWindow };
} else {
    console.log("[Quartet] nvm");
}

console.log("[Quartet] Loaded! Booting up game now");
require(join(tetrioAsarPath, "main.js"));

