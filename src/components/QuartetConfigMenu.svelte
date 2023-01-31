<script lang="ts">
    import { Settings } from "@api/settings";

    import plugins from "~plugins";
</script>

<div class="right_scroller" data-menuview="config_quartet">
    <div class="scroller_block">
        <h1 class="ns">Quartet alpha {QUARTET_VERSION}</h1>
    </div>

    {#each plugins as plugin}
        <div class="scroller_block">
            <h2 class="ns">{plugin.name}</h2>
            <p class="sub ns">{plugin.description}</p>
            <div
                class="checkbox ns rg_target_pri"
                class:checked={Settings.plugins[plugin.name].enabled}
                class:disabled={plugin.required}
            >
                enable this plugin
            </div>
            <div class="button_tr_h ns" style:display="flex">
                {#each plugin.authors as { name, url, github }}
                    <div class="qt-author">
                        {#if url}
                            <a href={url} target="_blank" rel="noreferrer">{name}</a>
                        {:else}
                            <span>{name}</span>
                        {/if}
                        {#if github}
                            <img src="https://github.com/{github}.png?size=48" alt={name}>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/each}
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
