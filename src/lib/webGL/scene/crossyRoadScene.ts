import * as state from './state/tileState';
import {caffeinate, resetCamera} from "$lib/webGL/scene/display/camera";
import {alive} from "$lib/webGL/scene/state/player";
import {resetMap} from "$lib/webGL/scene/state/mapGen";

/*
Manages high level state such as starting and resetting the game.
 */

export function reset() {
    alive.set(true); // player module will automatically reset
    resetCamera();
    resetMap(); // will also call eraseMap() internally which deletes tiles
}

export async function* init() {
    yield* state.init();
}