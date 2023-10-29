import * as input from "../input";
import { lerp } from "../animation";
import {Vec} from "$lib/webGL/linear_algebra";
import {Event} from "$lib/webGL/utils";
import {isObstacle} from "$lib/webGL/scene/state/state";

// y = -1/2 at^2 + vt
// y' = -at + v // delta y depends on t_total
// v_initial = -1/2 a (jump_duration)

const jumpDuration = .18;
const jumpVelocity = 1.27 / jumpDuration;
const stretchRange = .2;
const stretchSpeed = 3.864 / jumpDuration;
const spinSpeed = 2.5 / jumpDuration;

const gravity = 2 * jumpVelocity / jumpDuration;
const dxdt = 1 / jumpDuration;

export let pos = new Vec(7, 0, 0); // initial position
export let orient = 0;
export let stretch = 1;
export const onMove = new Event<() => void>();

let t = 0;
let posTarget = pos.clone();
let stretchTargets: number[] = [];
let targetOrient = 0;

export function init() {
    const onUp = (dir: [number, number], newOrient: number) => () => {
        if (t != 0) return;

        targetOrient = newOrient;
        stretchTargets = [1 + stretchRange,  1];

        {
            const x = Math.trunc(pos.x) + dir[0];
            const z = Math.trunc(pos.z) + dir[1];
            if (isObstacle(x, z)) return;
        }

        t = -jumpDuration;
        posTarget.x += dir[0];
        posTarget.z += dir[1];
        onMove.fire();
    };

    input.up.add('forward', onUp([0, 1], 0));
    input.up.add('backward', onUp([0, -1], 2));
    input.up.add('left', onUp([-1, 0], 1));
    input.up.add('right', onUp([1, 0], 3));

    const onDown = () => {
        if (t != 0) return;
        stretchTargets = [1 - stretchRange];
    }

    input.down.add('forward', onDown);
    input.down.add('backward', onDown);
    input.down.add('left', onDown);
    input.down.add('right', onDown);
}

export function update(dt: number) {
    if (stretchTargets.length != 0) {
        if (Math.abs(stretch - stretchTargets[0]) < .01) {
            stretchTargets.shift();
        } else {
            stretch = lerp(stretch, stretchTargets[0], stretchSpeed * dt);
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

    dt = Math.min(dt, -t); // don't overshoot
    t += dt;

    move(dt);

    if (t >= 0) {
        t = 0;
        pos = posTarget.clone();
    }
}

function move(dt: number) {
    // quadratic vertical movement
    const dy = -gravity * t - jumpVelocity;
    pos.y += dy * dt;

    // linear horizontal movement
    const dx = dxdt * dt;
    if (pos.x != posTarget.x) pos.x += dx * Math.sign(posTarget.x - pos.x);
    if (pos.z != posTarget.z) pos.z += dx * Math.sign(posTarget.z - pos.z);
}