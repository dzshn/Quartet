import { Devs } from "@api/constants";
import { definePluginSettings, SettingType } from "@api/settings";
import { Plugin } from "@patcher";
import { GrabbedObjects } from "Quartet";

const settings = definePluginSettings({
    immediatelyTransitionTo: {
        type: SettingType.SELECT,
        title: "immediately transition to here when TETR.IO starts",
        description: "When the game starts, you'll see this menu instead of the main one. This is useful if you're working on one",
        default: "none",
        // We use a getter as the DOM might not be loaded yet
        get options() {
            const menus = [...document.querySelectorAll("[data-menuview]")]
                .map(el => (el as HTMLElement).dataset.menuview!);

            // If we're called before components are hooked, include them
            if (!menus.includes("config_quartet"))
                menus.push("config_quartet");

            return [
                "none",
                ...menus.map(key => {
                    const menu = GrabbedObjects.Menus[key];
                    return { label: key, value: key, title: `Header: ${menu.header}\nFooter: ${menu.footer}` };
                }),
            ];
        },
    }
});

export default {
    name: "Devtools",
    description: "useful stuff for plugin developers",
    authors: [Devs.dzshn],
    settings,

    start() {
        if (settings.data.immediatelyTransitionTo !== "none") {
            GrabbedObjects.Loader.ready(() => {
                GrabbedObjects.transitionTo(settings.data.immediatelyTransitionTo);
            });
        }
    }
} satisfies Plugin;
