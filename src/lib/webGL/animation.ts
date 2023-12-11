// Quadratic jump:
// y = -1/2 at^2 + vt
// y' = -at + v // delta y depends on t_total
// v_initial = -1/2 a (jump_duration)

// lerp is an ease out function
import type {Vec} from "$lib/webGL/math/linear_algebra";

export const lerp = (a: number, b: number, t: number) => {
    t = Math.max(0, Math.min(1, t));
    return a + (b - a) * t;
}


// Sigmoid curve can be created with a piecewise curve:
// X <= 0:
//    y = e^x
// X >= 0:
//    y = B - e^-x

export const lerpVec = (a: Vec, b: Vec, t: number) => {
    return a.merge(b, (x, y) => lerp(x, y, t));
}

// Moves a value towards a target value by a given step.
// If the value moves past the target, it will be set to the target.
export const step = (a: number, b: number, step: number) => {
    if (a == b) return b;
    else if (a < b) {
        return Math.min(a + step, b);
    } else {
        return Math.max(a - step, b);
    }
}