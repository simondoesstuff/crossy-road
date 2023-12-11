<script>
    import * as rive from "rive-js";
    import {onMount} from "svelte";
    import {loading} from "$lib/webGL/glManager";

    let canvas;
    let progress = 'What\'s good?';

    onMount(() => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const r = new rive.Rive({
            src: '/rive/Loading Bar by Bobbeh.riv',
            canvas: canvas,
            autoplay: true,
            stateMachines: "State Machine 1",
            onLoad: () => {
                r.resizeToCanvas()
                const controls = r.stateMachineInputs('State Machine 1');
                const control = controls[0];

                const updateProgress = (v) => {
                    control.value = v * 100;
                    progress = `${Math.round(v * 100)}%`;

                    if (v === 1) {
                        r.stop();
                        r.cleanup();
                    }
                }

                loading.listen(updateProgress);
                updateProgress(loading.get());
            },
        });
    });
</script>

<div id="loadingScreen" class="full center">
    <div class="absolute full center">
        <h1 class="arcadeText text-4xl p-10 text-center relative z-10 top-[-12vh]">
            {progress}
        </h1>
    </div>

    <canvas bind:this={canvas} class="h-[50vh] aspect-square overflow-clip relative">
    </canvas>
</div>

<style>
    #loadingScreen {
        background-color: #313131;
        filter: contrast(1.5);
    }

    h1 {
        @apply text-cyan-200;
    }
</style>