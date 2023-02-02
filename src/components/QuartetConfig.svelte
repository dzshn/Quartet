<script lang="ts">
    import { GrabbedObjects } from "Quartet";

    GrabbedObjects.Menus.config_quartet = {
        header: "CONFIG / QUARTET",
        footer: "change Quartet settings",
        back: "config",
    };

    GrabbedObjects.Layout.config_quartet = {
        starter: "f!.rg_target_pri",
        back: "#back",
        items: {
            ".rg_target_pri": {
                up: "p!.rg_target_pri",
                down: "n!.rg_target_pri",
                left: "p!.rg_target_pri",
                right: "n!.rg_target_pri",
            }
        },
    };
</script>

<div
    class="scroller_item scroller_item_config has_description ns rg_target_pri"
    data-hover="hover"
    data-hit="hit2"
    on:click={() => GrabbedObjects.transitionTo("config_quartet")}
>
    <h1>Quartet</h1>
    <p>change settings for Quartet</p>
</div>
