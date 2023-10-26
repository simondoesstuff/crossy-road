import {Vec} from "$lib/webGL/linear_algebra";
import {lerpVec} from "$lib/webGL/animation";


// the camera "tries" to center around the player, lerps towards
// when it's still, it starts "falling" behind on the z axis

export let pos = Vec.zero(3);
const lerpSpeed = 3;
const boredTime = 5;
const boredSpeed = .5;

let timeSinceLastMove = 0;

export function caffinate() {
    timeSinceLastMove = 0;
}

export function update(dt: number, target: Vec) {
    timeSinceLastMove += dt;

    let effectiveTimeSince = 0;
    if (timeSinceLastMove > boredTime) {
        // todo enable
        // effectiveTimeSince = timeSinceLastMove - boredTime;
    }

    let target2 = target.clone();
    target2.y = 0; // don't follow the player's height
    target2.z -= boredSpeed * effectiveTimeSince;

    pos = lerpVec(pos, target2, lerpSpeed * dt)
    console.log(pos.data)
}
