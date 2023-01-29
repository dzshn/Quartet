import { webFrame } from "electron";
import { readFileSync } from "fs";
import { join } from "path";

webFrame.executeJavaScript(readFileSync(join(__dirname, "quartet.js"), "utf-8"));

require(process.env.__TETRIO_PRELOAD_PATH!);
