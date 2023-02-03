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
    }
});

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

export default {
    name: "Core",
    description: "Core Quartet patches and hooks",
    authors: [Devs.dzshn],
    required: true,
    settings,
    patches: [
        {
            match: /function (\w+)\(\w+,\w+\)\{.{1,100}\[data-menuview\]/,
            replace: "Quartet.GrabbedObjects.transitionTo=$1;$&"
        },
        {
            match: /(const \w+=)(\{none:\{back:null)/,
            replace: "$1Quartet.GrabbedObjects.Menus=$2"
        },
        {
            match: /(const \w+=)(\{tetrio:\{id:)/,
            replace: "$1Quartet.GrabbedObjects.Assets=$2"
        },
        {
            match: /,(\w+)=(\{home:\{starter:)/,
            replace: ";const $1=Quartet.GrabbedObjects.Layout=$2"
        },
        {
            match: /(const \w+=)(function\(\)\{const \w+=\{sfx:\{state:)/,
            replace: "$1Quartet.GrabbedObjects.Loader=$2"
        },
        {
            match: /function (\w+)\(\w+\)\{.{1,100}\.suppressable&&/,
            replace: "Quartet.GrabbedObjects.showNotification=$1;$&",
        },
        {
            match: /(const \w+=)(\(\(\)=>\{.{1,100}"No-GPU")/,
            replace: "$1Quartet.GrabbedObjects.Fingerprint=$2",
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
            //    ARR/DAS/SDF
            //    your computer's serial ID
            match: /`\${\w+\} \/\/ \$\{\w+\}-core \/\/ \$\{\w+\}-GB \/\/ \$\{\w+\} \/\/ (\$\{\w+\}) \/\/ (\$\{\w+\}) \/\/ \$\{\w+\} \/\/ (\$\{\w+\}) \/\/ (\$\{\w+\}) \/\/ \$\{\w+\}`/,
            replace: `\`${userAgent} // 8-core // 0-GB // Intel(R) HD Graphics // $1 // $2 // 1920x1080@1 // $3 // $4 // N/A\``,
            predicate: () => settings.data.anonymiseFingerprint,
        },
    ],
    components: [
        { component: QuartetConfig, target: "after", at: "#config_electron" },
        { component: QuartetConfigMenu, target: "tail", at: "#menus" },
    ],
} satisfies Plugin;
