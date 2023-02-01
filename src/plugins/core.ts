import { Devs } from "@api/constants";
import QuartetConfig from "@components/QuartetConfig.svelte";
import QuartetConfigMenu from "@components/QuartetConfigMenu.svelte";
import { Plugin } from "@patcher";

export default {
    name: "Core",
    description: "Core Quartet patches and hooks",
    authors: [Devs.dzshn],
    required: true,
    patches: [
        {
            match: /function (\w+)\(\w+,\w+\)\{.{1,100}\[data-menuview\]/,
            replace: "Quartet.GrabbedObjects.transitionTo=$1;$&"
        },
        {
            match: /(const \w+=)(\{none:\{back:null)/,
            replace: "$1Quartet.GrabbedObjects.menus=$2"
        },
        {
            match: /(const \w+=)(\{tetrio:\{id:)/,
            replace: "$1Quartet.GrabbedObjects.assets=$2"
        },
        {
            match: /,(\w+)=(\{home:\{starter:)/,
            replace: ";const $1=Quartet.GrabbedObjects.layout=$2"
        },
        {
            match: /(const \w+=)(function\(\)\{const \w+=\{sfx:\{state:)/,
            replace: "$1Quartet.GrabbedObjects.Loader=$2"
        },
        {
            match: /function (\w+)\(\w+\)\{.{1,100}\.suppressable&&/,
            replace: "Quartet.GrabbedObjects.showNotification=$1;$&",
        }
    ],
    components: [
        { component: QuartetConfig, target: "after", at: "#config_electron" },
        { component: QuartetConfigMenu, target: "tail", at: "#menus" },
    ],
} satisfies Plugin;
