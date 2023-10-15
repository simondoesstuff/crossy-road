<script lang="ts">
    import Screen from "./screen/Screen.svelte";
</script>

<h1 class="text-4xl font-bold text-center absolute w-full h-16 p-5">
    Crossy Road
</h1>

<!-- WebGL Canvas -->
<div class="outline outline-2 text-white">
    <Screen/>
</div>

<style lang="postcss">
    h1 {
        letter-spacing: .3rem;
    }
</style>
