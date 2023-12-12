// Computes a random number with the given variance and mean
// according to the normal distribution. This happens in O(1)
// using the Box-Muller transformation technique.
export function normal(mean: number, sigma: number): number {
    const u0 = Math.random() + .001; // domain of log is > 0
    const u1 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u0)) * Math.cos(2 * Math.PI * u1)
    // this technique provides a second random value free of charge... disregarding it
    // const z1 = Math.sqrt(-2 * Math.log(u0)) * Math.sin(2 * Math.PI * u1)
    return sigma * z0 + mean;
}

// Exactly like roll normal, but rounds and takes the abs val.
// Bad for rolling negative decimals.
export function normalDiscrete(mean: number, sigma: number): number {
    return Math.abs(Math.round(normal(mean, sigma)));
}

// Boolean trial based on a fixed probability of success.
export function bernoulli(p?: number): boolean {
    p ??= .5;
    const u0 = Math.random();
    return u0 < p;
}

// Takes an array of weights to bias a random, discrete choice.
export function choice(weights: any[]): number { // todo not tested
    const u0 = Math.random();
    const sum = weights.reduce((a, b) => a + b, 0);
    const u1 = u0 * sum;
    for (let i = 0; i < weights.length; i++) {
        if (u1 <= weights[i]) return i;
    }
    return weights.length - 1;
}

// Uniformly distributed random number in the range [min, max]
export function uniform(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

// Discrete uniformly distributed random number in the range [min, max]
export function uniformDiscrete(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

