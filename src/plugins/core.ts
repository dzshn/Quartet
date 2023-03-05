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
import QuartetConfig from "@components/QuartetConfig.svelte";
import QuartetConfigMenu from "@components/QuartetConfigMenu.svelte";
import { Plugin } from "@patcher";

const settings = definePluginSettings({
    anonymiseFingerprint: {
        type: SettingType.BOOLEAN,
        title: "anonymise your TETR.IO fingerprint",
        description: "Removes data about which client (and browser) you use, as well as hardware info",
        default: true,
        requiresRestart: true,
    },
});

export default {
    name: "Quartet",
    description: "Core Quartet patches and hooks",
    authors: [Devs.dzshn],
    required: true,
    settings,
    patches: [
        {
            match: /function (\w+)\(\w+,\w+\)\{.{1,100}\[data-menuview\]/,
            replace: "Quartet.Internal.Objects.transitionTo=$1;$&",
        },
        {
            match: /(const \w+=)(\{none:\{back:null)/,
            replace: "$1Quartet.Internal.Objects.Menus=$2",
        },
        {
            match: /(const \w+=)(\{tetrio:\{id:.{10,100}\/minos)/,
            replace: "$1Quartet.Internal.Objects.MinoAssets=$2",
        },
        {
            match: /,(\w+)=(\{tetrio:\{id:.{10,100}\/ghost)/,
            replace: ";const $1=Quartet.Internal.Objects.GhostAssets=$2",
        },
        {
            match: /,(\w+)=(\{home:\{starter:)/,
            replace: ";const $1=Quartet.Internal.Objects.Layout=$2",
        },
        {
            match: /(const \w+=)(function\(\)\{const \w+=\{sfx:\{state:)/,
            replace: "$1Quartet.Internal.Objects.Loader=$2",
        },
        {
            match: /function (\w+)\(\w+\)\{.{1,100}\.suppressable&&/,
            replace: "Quartet.Internal.Objects.showNotification=$1;$&",
        },
        {
            match: /(const \w+=)(\(\(\)=>\{.{1,100}"No-GPU")/,
            replace: "$1Quartet.Internal.Objects.Fingerprint=$2",
        },
        {
            // In order:
            //    User-agent,
            //    CPU core count,
            //    memory in GB,
            //    GPU,
            //    FingerprintJS fp,
            //    timestamp + random number,
            //    display res,
            //    your keybinds,
            //    ARR/DAS/SDF,
            //    your computer's serial ID
            match:
                /`(\${\w+\}) \/\/ \$\{\w+\}-core \/\/ \$\{\w+\}-GB \/\/ \$\{\w+\} \/\/ (\$\{\w+\}) \/\/ (\$\{\w+\}) \/\/ \$\{\w+\} \/\/ (\$\{\w+\}) \/\/ (\$\{\w+\}) \/\/ \$\{\w+\}`/,
            replace:
                `$1 // 8-core // 0-GB // Intel(R) HD Graphics // $2 // $3 // 1920x1080@1 // $4 // $5 // N/A\``,
            predicate: () => settings.data.anonymiseFingerprint,
        },
    ],
    components: [
        { component: QuartetConfig, target: "after", at: "#config_electron" },
        { component: QuartetConfigMenu, target: "tail", at: "#menus" },
    ],
} satisfies Plugin;
