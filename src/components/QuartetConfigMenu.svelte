<script lang="ts">
    import { Settings, SettingType } from "@api/settings";
    import { GrabbedObjects } from "Quartet";

    import plugins from "~plugins";

    function notifyRestart(what: string) {
        GrabbedObjects.showNotification({
            msg: `${what} requires a restart to fully apply. hit F5 to restart!`,
            icon: "warning",
            color: "#fb84bc",
        });
    }
</script>

<div class="right_scroller ns" data-menuview="config_quartet">
    <div class="scroller_block">
        <h1>Quartet indev {QUARTET_VERSION}</h1>
        <p>welcome to Quartet!</p>
    </div>

    {#each plugins as plugin}
        {@const settings = Settings.plugins[plugin.name]}
        {@const displayName = plugin.name.toUpperCase()}

        <div class="scroller_block">
            <h2>{displayName}</h2>
            <p class="sub">{plugin.description}</p>
            <div
                class="checkbox rg_target_pri"
                class:checked={settings.enabled}
                class:disabled={plugin.required}
                on:click={() => {
                    Settings.plugins[plugin.name].enabled = !settings.enabled;
                    if (plugin.patches?.length)
                        notifyRestart(`${settings.enabled ? "enabling" : "disabling"} ${displayName}`);
                }}
            >
                enable this plugin
            </div>
            <div class="button_tr_h" style:display="flex">
                {#each plugin.authors as { name, url, github }}
                    <div class="qt-author">
                        {#if url}
                            <a href={url} target="_blank" rel="noreferrer">{name}</a>
                        {:else}
                            <span>{name}</span>
                        {/if}
                        {#if github}
                            <img src="https://github.com/{github}.png?size=48" alt={name} />
                        {/if}
                    </div>
                {/each}
            </div>

            {#each Object.entries(plugin.settings?.def ?? {}) as [key, def]}
                <hr />
                {#if def.type === SettingType.STRING}
                    <div class="control_group">
                        <h1>{def.title}</h1>
                        <input
                            placeholder={def.placeholder}
                            autocomplete="off"
                            class="config_input rg_target_pri"
                            bind:value={Settings.plugins[plugin.name][key]}
                        />
                    </div>
                {:else if def.type === SettingType.BOOLEAN}
                    <div
                        class="checkbox rg_target_pri"
                        class:checked={Settings.plugins[plugin.name][key]}
                        title={def.description}
                        on:click={() => Settings.plugins[plugin.name][key] = !settings[key]}
                        on:click={() => notifyRestart(displayName)}
                    >
                        {def.title}
                    </div>
                {:else if def.type === SettingType.CUSTOM}
                    <svelte:component this={def.component} />
                {/if}
            {/each}
        </div>
    {/each}

    <p class="rc_moreinfo i18n_mono">read if cute</p>
</div>

<style>
    .qt-author {
        display: flex;
        margin-left: 10px;
    }
    .qt-author > a,
    .qt-author > span {
        color: #fff;
        text-decoration: none;
        align-self: center;
        margin-right: 10px;
    }
    .qt-author > img {
        border-radius: 100%;
    }
</style>
