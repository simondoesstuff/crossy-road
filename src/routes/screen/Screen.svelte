<script lang="ts">
    import * as glManager from "$lib/webGL/gl";
    import {onMount} from "svelte";

    let canvas: HTMLCanvasElement;

    onMount(() => {
        try {
            glManager.init(canvas);
            glManager.checkCanvasSize();
        } catch (e: any) {
            if (typeof e === "string") {
                alert("Error: " + e);
            } else throw e;
        }
    });
</script>

<svelte:window on:resize={glManager.checkCanvasSize}/>

<!-- WebGL Canvas -->
<canvas id="screen" class="w-full h-full"
        bind:this={canvas}>
</canvas>