<script lang="ts">
    import Screen from "./comps/screen/Screen.svelte";
    import {ready as readyEvent} from "$lib/UIState";
    import Loading from "./comps/load/Loading.svelte";
    import * as gl from "$lib/webGL/glManager";

    let ready = false;

    readyEvent.add(() => {
        ready = true;
        gl.startRendering();
    });
</script>

{#if !ready}
    <div class="absolute full z-10">
        <Loading/>
    </div>
{/if}

<main class="absolute full">
    <!-- WebGL Canvas -->
    <Screen/>
</main>
