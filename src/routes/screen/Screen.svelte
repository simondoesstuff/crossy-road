<script lang="ts">
    import {main} from "$lib/webGL/init";
    import {onMount} from "svelte";

    let canvas;
    let clientWidth, clientHeight;
    let gl;

    function canvasResize() {
        clientWidth = canvas?.clientWidth;
        clientHeight = canvas?.clientHeight;
        gl?.viewport(0, 0, clientWidth, clientHeight)
    }

    onMount(() => {
        gl = main(canvas);
        canvasResize();
    });
</script>

<svelte:window on:resize={canvasResize}/>

<!-- WebGL Canvas -->
<canvas id="screen"
        class="w-full h-full"
        bind:this={canvas}
        bind:clientWidth
        bind:clientHeight
        width={clientWidth}
        height={clientHeight}
    >
</canvas>