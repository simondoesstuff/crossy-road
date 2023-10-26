// Quadratic jump:
// y = -1/2 at^2 + vt
// y' = -at + v // delta y depends on t_total
// v_initial = -1/2 a (jump_duration)

// lerp is an ease out function
import type {Vec} from "$lib/webGL/linear_algebra";

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;


// Sigmoid curve can be created with a piecewise curve:
// X <= 0:
//    y = e^x
// X >= 0:
//    y = B - e^-x

export const lerpVec = (a: Vec, b: Vec, t: number) => {
    return a.merge(b, (x, y) => lerp(x, y, t));
}
