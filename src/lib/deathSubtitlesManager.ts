import {onMount} from "svelte";

export let deathSubtitles: string[] = [];

export async function init() {
    if (deathSubtitles.length > 0) return;
    deathSubtitles = await (await fetch('/deathSubtitles.json')).json();
}

export function deathSubtitle(score: number) {
    if (deathSubtitles.length === 0) {
        return 'A warmup?';
    }

    score /= 7;
    score = Math.floor(score);
    score = Math.min(score, deathSubtitles.length - 1);
    score = Math.max(score, 0);
    return deathSubtitles[score];
}