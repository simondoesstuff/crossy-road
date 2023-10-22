import * as input from "../input";

// y = -1/2 at^2 + vt
// y' = -at + v // delta y depends on t_total
// v_initial = -1/2 a (jump_duration)

const jumpDuration = .135;
const jumpVelocity = 7;
const stretchiness = .5;

const gravity = 2 * jumpVelocity / jumpDuration;
const dxdt = 1 / jumpDuration;

export let drawPos = { x: 7, z: 1, y: 0 }; // todo revert
let targetPos = { x: 7, z: 1, y: 0 };
let t = 0;
export let orientation = 0;
export let stretch = 1;


export function init() {
    const onUp = (dir: [number, number], newOrient: number) => () => {
        if (t != 0) return;

        t = -jumpDuration;
        targetPos.x += dir[0];
        targetPos.z += dir[1];
        orientation = newOrient;
    };

    input.up.add('forward', onUp([0, 1], 0));
    input.up.add('backward', onUp([0, -1], 2));
    input.up.add('left', onUp([-1, 0], 1));
    input.up.add('right', onUp([1, 0], 3));

    const onDown = (newOrient: number) => () => {
        orientation = newOrient;
        stretch = .7;
    }

    input.down.add('forward', onDown(0));
    input.down.add('backward', onDown(2));
    input.down.add('left', onDown(1));
    input.down.add('right', onDown(3));
}

export function update(dt: number) {
    if (t == 0) return;

    dt = Math.min(dt, -t); // don't overshoot
    t += dt;

    move(dt);

    if (t >= 0) {
        t = 0;
        drawPos.x = targetPos.x;
        drawPos.y = targetPos.y;
        drawPos.z = targetPos.z;
        stretch = 1;
    }
}

function move(dt: number) {
    const pos = drawPos;
    const target = targetPos;

    // quadratic vertical movement
    const dy = -gravity * t - jumpVelocity;
    pos.y += dy * dt;
    stretch = 1 + stretchiness * pos.y;

    // linear horizontal movement
    const dx = dxdt * dt;
    if (pos.x != target.x) pos.x += dx * Math.sign(target.x - pos.x);
    if (pos.z != target.z) pos.z += dx * Math.sign(target.z - pos.z);
}