<script lang="ts">
    import * as glManager from "$lib/webGL/glManager";
    import * as crossyScene from "$lib/webGL/scene/crossyRoadScene";
    import {onMount} from "svelte";
    import {score as scoreStore} from "$lib/webGL/scene/state/state";

    let canvas: HTMLCanvasElement;
    let score: number = 0;

    onMount(async () => {
        // todo revert try catch
        // try {
            await glManager.init(canvas);
            await crossyScene.init();

            glManager.startRendering();
            scoreStore.listen((s: number) => score = s);
        // } catch (e: any) {
        //     if (typeof e === "string") {
        //         alert("Error: " + e);
        //     } else throw e;
        // }
    });
</script>

<h1 class="absolute top-0 left-0 m-5 text-6xl">
    {score + 1}
</h1>

<!-- WebGL Canvas -->
<canvas id="screen" class="w-screen h-screen"
        bind:this={canvas}>
</canvas>

<style>
    @font-face {
        font-family: "Soloman";
        src: url("/fonts/soloman.ttf");
    }

    h1 {
        font-family: Soloman, sans-serif;
        -webkit-text-stroke: 3px black;
    }
</style>