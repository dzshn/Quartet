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

function formattedLog(level: "log" | "error" | "warn" | "info" | "debug", scope: string, ...args: any[]) {
    const altPalette = level === "error" || level === "warn";
    const bgColors = altPalette ? ["#7d2850", "#963060"] : ["#fb84bc", "#fdb9d9"];
    const fgColor = altPalette ? "#feedf5" : "#321020";
    console[level](
        "%c Quartet %c %s %c",
        `background: ${bgColors[0]}; color: ${fgColor}; font-weight: bold;`,
        `background: ${bgColors[1]}; color: ${fgColor};`,
        scope,
        "",
        ...args,
    );
}

export const Log = {
    log: formattedLog.bind(null, "log"),
    error: formattedLog.bind(null, "error"),
    warn: formattedLog.bind(null, "warn"),
    info: formattedLog.bind(null, "info"),
    debug: formattedLog.bind(null, "debug"),
};
