import {Vec} from "$lib/webGL/math/linear_algebra";
import {lerpVec} from "$lib/webGL/animation";
import {events} from "$lib/webGL/glManager";
import {alive, pos as playerPos} from "$lib/webGL/scene/state/player";


// the camera "tries" to center around the player, lerps towards.
// when it's still, it starts "falling" behind on the z axis.
// when the player is dead, it will follow for a short time, then give up.
// the camera does not get "bored" when the player has been dead, it will
// just remain at a roughly fixed position (disregarding momentum).

export let pos = new Vec(7, 0, 0);
const lerpSpeed = 3;
const boredTime = 5;
const boredSpeed = 1;
const corpseTime = 1; // time will follow the corpse

let timeSinceLastMove = 0;
let target = pos.clone();

export function init() {
    events.frame.add(update);

    // when the player dies, consider the camera caffeinated
    alive.listenFor(false, caffeinate);
}

export function caffeinate() {
    timeSinceLastMove = 0;
}

function update(dt: number) {
    timeSinceLastMove += dt;

    if (alive.get()) {
        if (timeSinceLastMove > boredTime) {
            // todo re enable this
            // target.z -= boredSpeed * dt;
            // target.x += boredSpeed * dt * .24; // drift at an angle
        } else {
            target.x = playerPos.x;
            target.z = playerPos.z;
        }
    } else if (timeSinceLastMove <= corpseTime) {
        target.x = playerPos.x;
        target.z = playerPos.z;
    }

    pos = lerpVec(pos, target, lerpSpeed * dt)
}
