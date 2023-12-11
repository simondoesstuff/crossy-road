<script>
    import Arcade from "../Arcade.svelte";
    import Button from "../Button.svelte";
    import {scoreStore} from "$lib/UIState";
    import {reset} from "$lib/webGL/scene/crossyRoadScene";

    let score = scoreStore.get();
    scoreStore.listen((s) => score = s);

    $: subtitle = ((s) => {
        if (s < 25) return "A warmup?";
        if (s < 50) return "Kinda mid.";
        if (s < 100) return "Not bad.";
        if (s < 200) return "Triple digits!";
        if (s < 400) return "They call me the tile master!";
        if (s < 800) return "A tile god!";
        return "You need no introduction.";
    })(score);
</script>

<Arcade scaleDelta=".04">
    <div class="bg-sky-300 p-10 flex-col justify-center w-full">
        <h1 class="arcadeText text-7xl text-center">
            {score}
        </h1>
        <h2 class="font-bold text-center">
            {subtitle}
        </h2>
        <div class="mt-10 center">
            <Button onClick={reset}>
                HIT IT
            </Button>
        </div>
    </div>
</Arcade>