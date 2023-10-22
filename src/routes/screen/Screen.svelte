<script lang="ts">
    import * as glManager from "$lib/webGL/glManager";
    import * as floatScene from "$lib/webGL/scene/floatingObject";
    import * as crossyScene from "$lib/webGL/scene/crossyRoad";
    import {onMount} from "svelte";

    let canvas: HTMLCanvasElement;

    onMount(async () => {
        // todo revert try catch
        // try {
            await glManager.init(canvas);
            // await floatScene.init();
            await crossyScene.init();

            glManager.startRendering();
        // } catch (e: any) {
        //     if (typeof e === "string") {
        //         alert("Error: " + e);
        //     } else throw e;
        // }
    });
</script>

<!-- WebGL Canvas -->
<canvas id="screen" class="w-screen h-screen"
        bind:this={canvas}>
</canvas>