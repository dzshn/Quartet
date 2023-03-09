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

import { execSync } from "child_process";

export const gitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
export const shortVersion = process.env.npm_package_version!;
export const longVersion = `${shortVersion}+git.${gitHash}`;
export const license = dedent(`
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
`);

export function dedent(text: string) {
    const lines = text.split("\n");
    let commonWhitespace = "";
    for (const line of lines) {
        const whitespace = line.replace(line.trimStart(), "");
        if (line === whitespace)
            continue;
        if (!commonWhitespace || whitespace.length < commonWhitespace.length) {
            commonWhitespace = whitespace;
        }
    }
    return lines.map(line => line.replace(commonWhitespace, "")).join("\n");
}
