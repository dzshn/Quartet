<script lang="ts">
    import { MinoAssets } from "@api/objects";

    import { get, set, update } from "idb-keyval";
    import { Skin, skins } from "../index";

    export let value: number | null = null;

    const originalAssets = MinoAssets.tetrio;

    let files: FileList | undefined;
    let filePicker: HTMLInputElement;

    get("QuartetSkins").then((v: Skin[] = []) => {
        $skins = v.map(skin => ({ ...skin, url: URL.createObjectURL(skin.file) }));
    });

    function pushFiles(...files: File[]) {
        update("QuartetSkins", (old = []) => {
            $skins = [
                ...old,
                ...files.map( file => ({
                    name: file.name, file, url: URL.createObjectURL(file)
                }))
            ];
            return $skins;
        });
    }

    function updateSkin(index: number | null) {
        if (MinoAssets.tetrio.assets.hd.loaded) {
            Object.values(MinoAssets.tetrio.assets).map(asset => {
                asset.baseTexture?.destroy();
                asset.baseTexture = null;
                asset.textures = {};
                asset.loaded = asset.loading = false;
            });
        }

        if (index === null || !$skins[index]) {
            MinoAssets.tetrio = originalAssets;
            return;
        }

        const { name, url } = $skins[index];
        MinoAssets.tetrio = {
            id: "quartet",
            name,
            assets: {
                hd: {
                    loaded: false,
                    loading: false,
                    textures: {},
                    url,
                    baseTexture: null,
                },
                uhd: MinoAssets.tetrio.assets.uhd,
            },
            colors: MinoAssets.tetrio.colors,
            format: "simple",
        };
    }

    $: pushFiles(...files ?? []);
    $: set("QuartetSkins", $skins);
    $: updateSkin(value);
</script>

<input
    type="file"
    accept="image/*"
    multiple
    bind:this={filePicker}
    bind:files
    id="quartet_skins"
    name="quartet_skins"
/>

<div
    class="control_button rg_target_pri"
    on:click={() => filePicker.click()}
    data-hover="tap"
    data-hit="click"
>
    add skins
</div>

{#each $skins as { file, url }, i}
    <div class="scroller_block zero">
        <h3>{i} ({file.size}b)</h3>
        <div class="button_tr_h">
            <div
                class="control_button button_tr_i rg_target_pri danger"
                on:click={() => {
                    URL.revokeObjectURL(url);
                    $skins.splice(i);
                    $skins = $skins;
                }}
            >
                delete
            </div>
        </div>

        <div
            class="checkbox rg_target_pri"
            class:checked={value === i}
            on:click={() => { value = value === i ? null : i }}
            data-hover="tap"
            data-hit="click"
        >
            use this skin
        </div>

        <input
            placeholder="the skin's name"
            autocomplete="off"
            class="config_input rg_target_pri"
            bind:value={$skins[i].name}
        />

        <img src={url} alt="" />
    </div>
{/each}

<style>
    input[type="file"] {
        display: none;
    }
</style>
