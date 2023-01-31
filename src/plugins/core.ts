import { Devs } from "@api/constants";
import QuartetConfig from "@components/QuartetConfig.svelte";
import QuartetConfigMenu from "@components/QuartetConfigMenu.svelte";
import type { Plugin } from "@patcher";

export default {
    name: "Core",
    description: "Core Quartet patches and hooks",
    authors: [Devs.dzshn],
    required: true,
    patches: [
        {
            match: /function (\w+)\(\w+,\w+\)\{.{1,100}\[data-menuview\].{1,1000}\.bindGuide\(.{1,50}\|\|\{\}\)\}/,
            replace: "$&Quartet.GrabbedObjects.transitionTo=$1;",
        },
        {
            match: /(const \w+=)(\{none:\{back:null)/,
            replace: "$1Quartet.GrabbedObjects.menus=$2"
        },
        {
            match: /(const \w+=)(\{tetrio:\{id:)/,
            replace: "$1Quartet.GrabbedObjects.assets=$2",
        }
    ],
    components: [
        { component: QuartetConfig, target: "after", at: "#config_electron" },
        { component: QuartetConfigMenu, target: "tail", at: "#menus" },
    ],
} satisfies Plugin;
