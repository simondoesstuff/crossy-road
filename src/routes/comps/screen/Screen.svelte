<script lang="ts">
    import * as glManager from "$lib/webGL/glManager";
    import {onMount} from "svelte";
    import DeadScreen from "./DeadScreen.svelte";
    import {aliveStore, ready, scoreStore} from "$lib/UIState";
    import {fly} from 'svelte/transition';
    import {swipe} from 'svelte-gestures';
    import * as inputManager from "$lib/webGL/input";

    let score = scoreStore.get();
    scoreStore.listen((v) => score = v);
    let alive = aliveStore.get();
    aliveStore.listen((v) => alive = v);

    let canvas: HTMLCanvasElement;
    onMount(async () => {
        await glManager.init(canvas);
    });

    let t0 = 0;
    function handleSwipe(direction) {
        const now = performance.now();
        if (now - t0 < 5) return; // 5ms debounce
        t0 = now;
        inputManager.triggerSwipe('swipe' + direction);
    }
    function handleStartSwipe() {
        inputManager.triggerMouseDown();
    }
</script>

<h1 class="absolute top-0 left-0 m-5 text-6xl arcadeText">
    {score}
</h1>

<!-- GameOver/Dead screen let's player respawn -->
{#if !alive}
    <div class="absolute w-full h-full center"
         in:fly={{ delay: 1350, duration: 500, y: -300}}
         out:fly={{ duration: 300, y: -300}}
    >
        <div class="center shadow-2xl">
            <div class="z-10">
                <DeadScreen/>
            </div>
            <div class="absolute scale-y-[85%] scale-x-[110%]">
                <DeadScreen/>
            </div>
        </div>
    </div>
{/if}

<!-- WebGL Canvas -->
<canvas id="screen" class="w-screen h-screen z-[-100]"
        use:swipe={{ timeframe: 1000, minSwipeDistance: 0}} on:swipe={(e) => handleSwipe(e.detail.direction)}
        on:click={() => handleSwipe('top')}
        on:mousedown={handleStartSwipe}
        bind:this={canvas}>
</canvas>

<style>
    h1 {
        -webkit-text-stroke: 2.5px black;
    }
</style>