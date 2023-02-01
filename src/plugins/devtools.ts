import { Devs } from "@api/constants";
import { definePluginSettings, SettingType } from "@api/settings";
import { Plugin } from "@patcher";
import { GrabbedObjects } from "Quartet";

const settings = definePluginSettings({
    immediatelyTransitionTo: {
        type: SettingType.STRING,
        title: "immediately transition to here when TETR.IO starts"
    }
});

export default {
    name: "Devtools",
    description: "useful stuff for plugin developers",
    authors: [Devs.dzshn],
    settings,

    start() {
        if (settings.data.immediatelyTransitionTo) {
            GrabbedObjects.Loader.ready(() => {
                GrabbedObjects.transitionTo(settings.data.immediatelyTransitionTo);
            });
        }
    }
} satisfies Plugin;
