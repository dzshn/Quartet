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

import { Devs } from "@api/constants";
import { definePluginSettings, SettingType } from "@api/settings";
import { Plugin } from "patcher";

const settings = definePluginSettings({
    adblock: {
        type: SettingType.BOOLEAN,
        title: "force-disable third-party advertisements",
        description: "Most useful on web versions.",
        default: false,
        requiresRestart: true,
    },
});

export default {
    name: "Untrack",
    description: "disable TETR.IO's trackers",
    authors: [Devs.dzshn],
    default: true,
    settings,
    patches: [
        {
            // In order:
            //    User-agent (kept),
            //    CPU core count (obfuscated to 8 cores),
            //    Memory (stripped out),
            //    GPU (obfuscated to "Intel(R) HD Graphics", common iGPU),
            //    FingerprintJS fp (kept, too complicated),
            //    Persistent timestamp + random number (kept),
            //    Display resolution (obfuscated to 1920x1080@1),
            //    Keybinds (kept),
            //    ARR/DAS/SDF (kept),
            //    Motherboard serial ID (set by TETR.IO desktop, stripped out)
            // (Some information is still kept in the fingerprint in order to avoid
            // triggering any sort of anti-cheat)
            // See also: Quartet.Object.Fingerprint
            match:
                /`(\${\w+\}) \/\/ \$\{\w+\}-core \/\/ \$\{\w+\}-GB \/\/ \$\{\w+\} \/\/ (\$\{\w+\}) \/\/ (\$\{\w+\}) \/\/ \$\{\w+\} \/\/ (\$\{\w+\}) \/\/ (\$\{\w+\}) \/\/ \$\{\w+\}`/,
            replace: "`$1 // 8-core // 0-GB // Intel(R) HD Graphics // $2 // $3 // 1920x1080@1 // $4 // $5 // N/A`",
        },
        {
            // https://developer.matomo.org/guides/tracking-javascript-guide
            match: /_paq\.push/g,
            replace: "[].push",
        },
        {
            match: /api\.enthusiastgaming\.net/,
            replace: "meow?",
            predicate: () => settings.data.adblock,
        },
    ],
} satisfies Plugin;
