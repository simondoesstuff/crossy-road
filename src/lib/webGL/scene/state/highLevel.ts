/*
    This module consists of very high level functions that control things like:
    starting the game, resetting the game, changing the resource pack, etc.
 */

import {caffeinate} from "$lib/webGL/scene/display/camera";
import {resetMap} from "$lib/webGL/scene/state/mapGen";
import {alive} from "$lib/webGL/scene/state/player";

export function reset() {
    caffeinate();
    alive.set(true); // player module will automatically reset
    resetMap(); // will also call eraseMap() internally which deletes tiles
}