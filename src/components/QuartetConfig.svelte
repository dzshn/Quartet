<script lang="ts">
    import { GrabbedObjects } from "Quartet";

    GrabbedObjects.menus.config_quartet = {
        header: 'CONFIG / QUARTET',
        footer: 'change Quartet settings',
        back: "config",
    };

    function handleClick() {
        GrabbedObjects.transitionTo("config_quartet");
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events --->
<div
    class="scroller_item scroller_item_config has_description ns rg_target_pri"
    data-hover="hover"
    data-hit="hit2"
    on:click={handleClick}
>
    <h1>Quartet</h1>
    <p>change settings for Quartet</p>
</div>
