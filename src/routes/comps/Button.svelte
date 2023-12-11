<script>
    import Arcade from "./Arcade.svelte";

    export let onClick;
</script>

<button
        class="hover:brightness-110 hover:scale-110 hover:shadow-xl active:brightness-95 active:scale-100 transition-all"
        on:click={onClick}
>
    <Arcade>
        <div class="letterSpacing font-bold">
            <slot/>
        </div>
    </Arcade>
</button>

<style>
    .letterSpacing {
        letter-spacing: 2px;
    }
</style>