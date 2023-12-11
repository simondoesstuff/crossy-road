/*
      Note:   this module does not actually place the tiles because the state module controls
      the details about the tiles. This module purely tells the state module of the layout
      in the big-picture perspective.
 */


import {bernoulli, choice, normalNice, uniform} from "$lib/webGL/math/statistics";
import {
    addBoulevard, addCar,
    addRock,
    addTree, eraseMap,
    laneCount,
    retireLane,
    score,
    updateDisplay,
    xBounds
} from "$lib/webGL/scene/state/tileState";

type biome = "grass" | "water" | "road"
const laneBuffer = 20; // how many lanes should be buffered before the player reaches the end
const thickRegion = 6; // the width of padding around lane edges of thick obstacle coverage
const trainProb = .05; // todo implement trains
const biomeStats = {
    // water: {
    //     chance: 10,
    //     width: {
    //         mean: 3,
    //         sigma: 3,
    //     }
    // },
    grass: {
        chance: 70,
        width: {
            mean: 1,
            sigma: 2
        }
    },
    road: {
        chance: 30,
        width: {
            mean: 1,
            sigma: 0
        }
    }
    // add waterSafe, waterRoad
}
const obstacleStats = {
    any: .4, // chance of any obstacle
    rock: .3,
    tree: .7,
}

let prevBiome = "water"; // this prevents the initial biome from being water

export function init() {
    resetMap();

    // as the player moves, the chunks will be added to the end of the map
    score.listen((s) => {
        tryExpand();
    });
}

function tryExpand() {
    // the score only increases -- this callback is only called when the player moves forward
    while (laneCount() - score.get() <= laneBuffer) {
        addChunk(); // (ambiguous size)
    }

    // very old lanes should be garbage collected
    const garbageBuffer = 2 * laneBuffer;
    const garbageEdge = score.get() - garbageBuffer;
    for (let i = garbageEdge - laneBuffer; i < garbageEdge; i++) {
        if (i < 0) continue;
        retireLane(i);
    }

    updateDisplay();
}

// Will delete all tiles, and rebuild the safe zone.
// Warning: this will not reset the player's position so if the score
// has not been reset first, the safe zone will not be at zero.
export function resetMap() {
    eraseMap()
    buildGrassBiome(8); // initial safe zone
    tryExpand();
}

function addChunk() {
    /*
     Algorithm:

     The map generator is not capable of putting the same biome back to back
     because the tile by tile generator builds the whole biome at once at visually,
     back to back biomes should look connected. The generator will deliberately
     select the next biome excluding the previous biome.

     Placing a biome:
       Of the biomes (excluding the previous) remaining, select randomly based on the
       probabilities of each biome normalized to exclude the probability of the excluded
       biome.

     Deciding width:
        Once the biome has been selected, the width of the biome is determined by random choice
        considering the spread and mean of the width of that biome given in the config.
     */

    const remain = Object.keys(biomeStats).filter(b => b != prevBiome);
    // @ts-ignore
    const probs = remain.map(b => biomeStats[b].chance);
    const biome = remain[choice(probs)];

    // @ts-ignore
    const mean = biomeStats[biome].width.mean;
    // @ts-ignore
    const sigma = biomeStats[biome].width.sigma;
    const width = normalNice(mean - 1, sigma) + 1; // +1 to avoid 0 width

    switch (biome) {
        // case "water":
        //     buildWaterBiome(width); // todo implement water biome
        //     break;
        case "road":
            buildRoadBiome(width);
            break;
        default:
            buildGrassBiome(width);
            break;
    }
}

function buildGrassBiome(width: number) {
    prevBiome = "grass";
    addBoulevard("safe", width);

    const thick0 = xBounds[0] + thickRegion;
    const thick1 = xBounds[1] - thickRegion;

    for (let z = laneCount() - width; z < laneCount(); z++) {
        for (let i = xBounds[0]; i < xBounds[1]; i++) {
            if (i == 10) continue; // don't place obstacles in the center strip
            if (i < thick0 || i > thick1) {
                // when out of the thin region, place obstacles guaranteed
                addObstacle(i, z);
            } else {
                // otherwise, place obstacles probabilistically
                if (bernoulli(obstacleStats.any)) {
                    addObstacle(i, z);
                }
            }
        }
    }
}

function addObstacle(x: number, z: number) {
    const c = choice([obstacleStats.rock, obstacleStats.tree]);
    switch (c) {
        case 0:
            addRock(x, z);
            break;
        case 1:
            addTree(x, z, uniform(1, 4));
            break;
    }
}

function buildRoadBiome(width: number) {
    prevBiome = "road";
    addBoulevard("road", width);
    // todo experimental
    for (let z = laneCount() - width; z < laneCount(); z++) {
        addCar(13, z, normalNice(0, 2), 2);
    }
}
