import {bernoulli, uniform} from "$lib/webGL/math/statistics";
import {addCar, xBounds} from "$lib/webGL/scene/state/tileState";
import {lerp} from "$lib/webGL/animation";

/*
todo currently cars are looping instead of being spawned in for the sake of efficiency
    this is not ideal -- need a solution to avoid waves of GC lag spikes
 */

const carSize = 1.6;
const config = {
    minGap: 1,
    maxGap: 12,
    minVelocity: .8,
    maxVelocity: 5,
    velVariance: 2,
    hardMode: 200 // z value at which the game becomes hard
};

let spawners: Map<number, Spawner> = new Map();

type Spawner = {
    minGap: number,
    maxGap: number, // controls the frequency of spawning
    velocity: number,
    update: (t: number) => void,
};

export function init() {
    // events.lateFrame.add(() => {
    //     for (const spawner of spawners.values()) {
    //         spawner.update(performance.now() / 1000);
    //     }
    //
    //     updateDisplay();
    // });
}

export function eraseAllSpawners() {
    spawners.clear();
}

export function spawnerOn(z: number) {
    const {minGap, maxGap, velocity} = chooseParams(z);
    populate(minGap, maxGap, velocity, z);

    const minGapDelay = minGap / Math.abs(velocity);
    const maxGapDelay = maxGap / Math.abs(velocity);

    const minDelay = carSize / Math.abs(velocity); // time it takes to travel one car length
    const orientation = Math.sign(velocity) == 1 ? 0 : 2;

    // random initial time prevents an initial wave of cars
    let nextTime = performance.now() / 1000 + uniform(minGapDelay, maxGapDelay/2) + minDelay;

    spawners.set(z, {
        minGap,
        maxGap,
        velocity,
        update: (now) => {
            if (now > nextTime) {
                nextTime = uniform(minGapDelay, maxGapDelay) + now + minDelay;
                const x = velocity > 0 ? xBounds[0] : xBounds[1];
                addCar(x, z, velocity, orientation)
            }
        }
    });
}

export function spawnerOff(z: number) {
    spawners.delete(z);
}

// assumes the lane is empty and places cars randomly to appear as though
// cars were being spawned for a while
function populate(minGap: number, maxGap: number, vel: number, z: number) {
    let x = xBounds[0];
    const orientation = Math.sign(vel) == 1 ? 0 : 2;

    while (x < xBounds[1] - carSize) {
        x += uniform(minGap, maxGap) + carSize;
        addCar(x, z, vel, orientation);
    }
}

function chooseParams(z: number) {
    const dir = (bernoulli() ? 1 : -1);
    const challenge = Math.min(1, z / config.hardMode);
    const avgVel = lerp(config.minVelocity, config.maxVelocity, challenge);

    let vel = uniform(avgVel - config.velVariance, avgVel + config.velVariance);
    vel = Math.max(config.minVelocity, Math.min(config.maxVelocity, vel));

    return {
        minGap: config.minGap,
        maxGap: config.maxGap,
        velocity: vel * dir
    };
}
