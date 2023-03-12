<script lang="ts">
    import { Settings, SettingType } from "@api/settings";
    import { showNotification } from "@api/objects";

    import plugins from "~plugins";

    function notifyRestart(...what: string[]) {
        showNotification({
            msg: `${what.join(" ")} requires a restart to fully apply. hit F5 to restart!`,
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
        {@const settings = Settings[plugin.name]}
        {@const displayName = plugin.name.toUpperCase()}

        <div class="scroller_block">
            <h2>{displayName}</h2>
            <p class="sub">{plugin.description}</p>
            <div
                class="checkbox rg_target_pri"
                class:checked={settings.enabled}
                class:disabled={plugin.required}
                on:click={() => {
                    Settings[plugin.name].enabled = !settings.enabled;
                    if (plugin.patches?.length)
                        notifyRestart(settings.enabled ? "enabling" : "disabling", displayName);
                }}
                data-hover="tap"
                data-hit="click"
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

            {#if plugin.settings}
                <hr />
            {/if}

            {#each Object.entries(plugin.settings?.def ?? {}) as [key, def]}
                {#if def.type === SettingType.STRING}
                    <div class="control_group">
                        <h1>{def.title}</h1>
                        <input
                            placeholder={def.placeholder}
                            autocomplete="off"
                            class="config_input rg_target_pri"
                            bind:value={/* qhar */ /* eslint-disable svelte/valid-compile */ Settings[plugin.name][key]}
                        />
                    </div>
                {:else if def.type === SettingType.BOOLEAN}
                    <div
                        class="checkbox rg_target_pri"
                        class:checked={Settings[plugin.name][key]}
                        title={def.description}
                        on:click={() => Settings[plugin.name][key] = !settings[key]}
                        on:click={() => def.requiresRestart && notifyRestart("updating", displayName)}
                        data-hover="tap"
                        data-hit="click"
                    >
                        {def.title}
                    </div>
                {:else if def.type === SettingType.SELECT}
                    <div class="control_group flex-row">
                        <h1>{def.title}</h1>
                        {#if def.description}
                            <p>{def.description}</p>
                        {/if}
                        {#each def.options as opt}
                            {@const option = typeof opt === "string" ? { label: opt, value: opt } : opt}
                            <div
                                class="control_button rg_target_pri flex-item"
                                class:pressed={Settings[plugin.name][key] === option.value}
                                title={option.title}
                                on:click={() => Settings[plugin.name][key] = option.value}
                                on:click={() => def.requiresRestart && notifyRestart("updating", displayName)}
                                data-hover="tap"
                                data-hit="click"
                            >
                                {option.label}
                            </div>
                        {/each}
                    </div>
                {:else if def.type === SettingType.CUSTOM}
                    <!-- avoid <svelte:component> as it is reactive -->
                    {@const Component = def.component}
                    <Component bind:value={Settings[plugin.name][key]} />
                {/if}
            {/each}
        </div>
    {/each}

    <p class="rc_moreinfo" style:font-family="PFW">read if cute</p>
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
        border-radius: 3px;
    }

    .control_group .flex-item {
        min-width: fit-content;
        width: 10vw;
    }

    /* shhhh no one will know */
    .control_group {
        padding-right: .75em;
    }
    .control_group .flex-item:last-child {
        margin-right: .25em;
    }
</style>
