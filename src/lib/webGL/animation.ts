// Quadratic jump:
// y = -1/2 at^2 + vt
// y' = -at + v // delta y depends on t_total
// v_initial = -1/2 a (jump_duration)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
