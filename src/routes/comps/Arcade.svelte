<script>
    export let scaleDelta = .1;
    let back;

    $: if (back) {
        back.style.transform = `scale(${100 * (1 + scaleDelta)}%)`;
    }
</script>

<div class="center">
    <div class="style bg-sky-300 z-10">
        <slot/>
    </div>

    <div bind:this={back} class="style absolute bg-white">
        <slot/>
    </div>
</div>

<style>
    .style {
        @apply p-5 cutCorners;
    }
</style>