import * as input from "../input";

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

let t = 0;
let targetPos = { x: 7, z: 1, y: 0 };
let stretchTargets: number[] = [];
let targetOrient = 0;

export let drawPos = { x: 7, z: 1, y: 0 }; // todo revert
export let orient = 0;
export let stretch = 1;


export function init() {
    const onUp = (dir: [number, number], newOrient: number) => () => {
        if (t != 0) return;

        t = -jumpDuration;
        targetPos.x += dir[0];
        targetPos.z += dir[1];
        targetOrient = newOrient;
        stretchTargets = [1 + stretchRange,  1];
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
        drawPos.x = targetPos.x;
        drawPos.y = targetPos.y;
        drawPos.z = targetPos.z;
    }
}

function move(dt: number) {
    const pos = drawPos;
    const target = targetPos;

    // quadratic vertical movement
    const dy = -gravity * t - jumpVelocity;
    pos.y += dy * dt;

    // linear horizontal movement
    const dx = dxdt * dt;
    if (pos.x != target.x) pos.x += dx * Math.sign(target.x - pos.x);
    if (pos.z != target.z) pos.z += dx * Math.sign(target.z - pos.z);
}