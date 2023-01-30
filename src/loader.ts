/*!
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

    console.log("[Quartet] Loaded! Booting up game now");
} else {
    console.log("[Quartet] nvm");
}

require(join(tetrioAsarPath, "main.js"));
