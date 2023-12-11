import * as input from "../../input";
import {lerp, step} from "../../animation";
import {Vec} from "$lib/webGL/math/linear_algebra";
import {Event, Store} from "$lib/webGL/utils";
import {isObstacle, score} from "$lib/webGL/scene/state/tileState";
import {events} from "$lib/webGL/glManager";
import * as camera from "$lib/webGL/scene/display/camera";


const jumpDuration = .20;
const jumpHeight = .20;
const stretchRange = .2;
const stretchSpeed = 3.864 / jumpDuration;
const spinSpeed = 2.5 / jumpDuration;

const dxdt = 1 / jumpDuration;
const modelRadius = .4;

export let pos = new Vec(10, 0, 5); // initial position
export let orient = 0;
export let stretch = Vec.zero(3).add(1);
export const onMove = new Event<() => void>();
export const alive = new Store(true);

let t = 0;
let t0 = -jumpDuration; // used to get a normalized t
let posTarget = pos.clone();
let stretchTargets: number[] = [];
let targetOrient = 0;
let drift = 0; // used when the player is killed by a vehicle

export function init() {
    const onUp = (dir: [number, number], newOrient: number) => () => {
        if (!alive.get()) return;

        stretchTargets = [1 + stretchRange, 1];
        targetOrient = newOrient;

        const x = Math.round(pos.x + dir[0]);
        const z = Math.round(pos.z + dir[1]);

        {
            if (isObstacle(x, z)) return;
        }

        posTarget.x = x;
        posTarget.z = z;

        if (t == 0) {
            t = posTarget.xz.sub(pos.xz).mag();
            t0 = t;
        }

        camera.caffeinate();
        onMove.fire();
    };

    input.up.add('forward', onUp([0, 1], 0));
    input.up.add('backward', onUp([0, -1], 2));
    input.up.add('left', onUp([-1, 0], 1));
    input.up.add('right', onUp([1, 0], 3));

    const onDown = () => {
        if (!alive.get()) return;
        stretchTargets = [1 - stretchRange];
    }

    input.down.add('forward', onDown);
    input.down.add('backward', onDown);
    input.down.add('left', onDown);
    input.down.add('right', onDown);

    events.lateFrame.add(update);
}


function update(dt: number) {
    if (!alive.get()) {
        pos.x += drift * dt;
        return;
    }

    if (stretchTargets.length != 0) {
        if (Math.abs(stretch.y - stretchTargets[0]) < .01) {
            stretchTargets.shift();
        } else {
            stretch.y = lerp(stretch.y, stretchTargets[0], stretchSpeed * dt);
            const fat = (4 - stretch.y) / 3;
            stretch.x = fat;
            stretch.z = fat;
        }
    }

    if (orient != targetOrient) {
        if (Math.abs(orient - targetOrient) >= 2) {
            if (orient < targetOrient) {
                orient += 4;
            } else {
                orient -= 4;
            }
        }

        orient = lerp(orient, targetOrient, spinSpeed * dt);
    }

    if (t == 0) return;

    dt = Math.min(dt, t/dxdt); // don't overshoot
    t = posTarget.xz.sub(pos.xz).mag();

    move(dt);

    if (Math.abs(t) < .01) {
        t = 0;
        pos = posTarget.clone();
    }
}

function move(dt: number) {
    if (!alive.get()) return;

    // quadratic vertical movement
    const t1 = t/t0; // normalized t
    const t2 = t1 * t1;
    pos.y = -4 * jumpHeight * (t2 - t1);
    pos.y = Math.max(pos.y, 0);

    // linear horizontal movement
    const dx = dxdt * dt;
    pos.x = step(pos.x, posTarget.x, dx);
    pos.z = step(pos.z, posTarget.z, dx);

    const newScore = Math.round(pos.z);
    if (newScore > score.get()) {
        score.set(newScore);
    }
}

// used when the player is killed by a vehicle.
// flatten the player on the given axis
export function kill(intersectDelta: [number, number], newVelocity: number) {
    orient = Math.round(orient) % 4;
    const onX = Math.abs(intersectDelta[0]) < Math.abs(intersectDelta[1]);

    stretch = Vec.zero(3).add(1.17);
    if (onX) {
        // 1. move to the edge of the intersection
        // 2. squash along intersection axis
        pos.x += intersectDelta[0] / 20;
        // todo remove the modelRadius correction factor by improving the collision detection
        pos.x += modelRadius / 3 * -Math.sign(intersectDelta[0]);
        // (x/20) to convert to tile units
        stretch.x = 0.1;
    } else {
        pos.z -= intersectDelta[1] / 20; // z is negated due to camera orientation
        pos.z -= modelRadius * -Math.sign(intersectDelta[1]);
        stretch.z = 0.1
    }

    stretchTargets = [];
    targetOrient = orient;
    posTarget = pos.clone();

    drift = newVelocity;
    alive.set(false);
}