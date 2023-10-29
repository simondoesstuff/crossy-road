import type {Object3D} from "$lib/webGL/resources";
import {Vec} from "$lib/webGL/linear_algebra";
import {models} from "$lib/webGL/resources";
import * as display from "$lib/webGL/scene/display";

export interface Tile {
    type: 'safe' | 'road' | 'obstacle' | 'train',
    obj: Object3D,
    pos: Vec,
    dontShift?: boolean // only used to differentiate ground tiles
    orientation?: number,
}

let lanes: Tile[][] = [];

export async function init() {
    let dispInit = display.init(); // promise captured for concurrent initialization

    addBoulevard('safe', 1);
    addBoulevard('road', 3);
    addBoulevard('safe', 3);
    addBoulevard('road', 2);
    addBoulevard('safe', 1);
    addBoulevard('road', 1);
    addBoulevard('safe', 2);

    addTree(0, 4, 2);
    addTree(0, 5, 3);
    addTree(2, 5, 2);
    addTree(15, 4, 1);
    addTree(15, 5, 1);
    addTree(14, 6, 2);
    addTree(7, 5, 4);

    addObstacle(1, 4);
    addObstacle(5, 5);
    addObstacle(11, 0);
    addObstacle(14, 9);

    addTrain(6);
    addTrain(3);

    await dispInit;
    updateDisplay();
}

export function isObstacle(x: number, z: number) {
    const lane = lanes[z];
    if (!lane) return true; // out of bounds might as well be an obstacle

    for (const tile of lane) {
        if (tile.pos.x == x) {
            return tile.type == 'obstacle';
        }
    }

    return false;
}

export function isGrass(z: number) {
    // 0th element of the lane is always the boulevard
    return lanes[z][0].type == 'safe';
}

function updateDisplay() {
    for (let z = 0; z < lanes.length; z++) {
        const lane = lanes[z];
        for (const tile of lane) {
            tile.pos.expandDim(3);
            tile.pos.z = z;

            if (tile.type == 'safe' || tile.type == 'road') {
                tile.dontShift = true;
            }
        }
    }

    const roadHeight = .72;
    const safeHeight = 2.7;
    const offsets = lanes.map((_, z) =>
        isGrass(z) ? safeHeight : roadHeight
    );

    // generator function
    function* tiles() {
        for (let z = 0; z < lanes.length; z++) {
            const lane = lanes[z];
            for (const tile of lane) {
                yield tile;
            }
        }
    }

    display.updateTiles(tiles(), offsets);
}

export function addBoulevard(type: 'safe' | 'road', width: number) {
    const x = 19;
    switch (type) {
        case 'safe':
            for (let j = 0; j < width; j++) {
                let obj = (j % 2 == 1) ? models.safe : models.safe2;
                lanes.push([{ type: 'safe', obj, pos: new Vec(x) }]);
            }
            break;
        case 'road':
            if (width == 1) {
                lanes.push([{ type: 'road', obj: models.road, pos: new Vec(x) }]);
            } else {
                lanes.push([{ type: 'road', obj: models.roadCap2, pos: new Vec(x) }]);
                for (let j = 0; j < width - 2; j++) {
                    lanes.push([{ type: 'road', obj: models.roadStripe, pos: new Vec(x) }]);
                }
                lanes.push([{ type: 'road', obj: models.roadCap, pos: new Vec(x) }]);
            }
            break;
    }
}

export function addTrain(z: number) {
    lanes[z].push({ type: 'train', obj: models.track, pos: new Vec(18.5) });
    lanes[z].push({ type: 'train', obj: models.trackPost, pos: new Vec(5) });
}

export function addObstacle(x: number, z: number, orientation?: number, variant?: number) {
    orientation ??= Math.floor(Math.random() * 4);
    // todo rock variants
    lanes[z].push({ type: 'obstacle', obj: models.rock, pos: new Vec(x), orientation });
}

export function addTree(x: number, z: number, height: number) {
    let tree = [
        { type: 'obstacle', obj: models.treeBase, pos: new Vec(x)} as Tile,
    ];

    for (let i = 0; i < height; i++) {
        tree.push({ type: 'obstacle', obj: models.treeTop, pos: new Vec(x, .4 * i) });
    }

    // ordering in the lane is not important
    lanes[z].push(...tree);
}