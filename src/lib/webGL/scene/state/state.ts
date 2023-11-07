import type {Object3D} from "$lib/webGL/resources";
import {BoundingBox, Vec} from "$lib/webGL/linear_algebra";
import {models} from "$lib/webGL/resources";
import * as display from "$lib/webGL/scene/display";
import {events} from "$lib/webGL/glManager";


const xBounds = [0, 19]; // objects that leave the bounds are removed

export interface Tile {
    type: 'safe' | 'road' | 'obstacle' | 'train' | 'log' | 'car',
    obj: Object3D,
    pos: Vec,
    xVel?: number,
    dontShift?: boolean // only used to differentiate ground tiles
    orientation?: number,
}

// todo car collisions should be handled by marking a lane as active (when the player enters it) ...
// and for each frame of car movement, the respective tile should be marked as occupied (conservative)
// the player can check for a potential collision in O(1) by comparing the bounding box of the player
// and car(s) in the same tile. The marked tiles are updated in O(cars) per frame.

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

    lanes[3].push({ type: 'car', obj: models.rock, pos: new Vec(5), orientation: 1, xVel: 2 });

    await dispInit;
    updateDisplay();

    events.render.add(marchObjects);
}

// determines the intersecting objects at the given position of the given bounding box.
export function objectsIntersecting(pos: Vec, box: [Vec, Vec]) {
    const zCenter = Math.trunc(pos.y);
    pos = pos.mul(20); // real world coordinates
    let objects = [];

    // currently searching +/- 1 lane of pos.z
    for (let z = -1; z <= 1; z++) {
        const lane = lanes[zCenter + z];
        if (!lane) continue;

        for (const tile of lane) {
            if (tile.type != 'car') continue;

            const tileBox = tile.obj.boundingRect;
            const tilePos = tile.pos.xz.mul(20);

            if (BoundingBox.intersectAt(pos, ...box, tilePos, ...tileBox)) {
                objects.push(tile);
            }
        }
    }

    return objects;
}

export function carsIntersecting(pos: Vec, box: [Vec, Vec]) {
    return objectsIntersecting(pos, box).filter(tile => tile.type == 'car');
}

// called every frame to update objects with velocity
function marchObjects(dt: number) {
    let needsUpdate = false;

    for (let z = 0; z < lanes.length; z++) {
        const lane = lanes[z];
        for (let i = 0; i < lane.length; i++) {
            const tile = lane[i];
            if (tile.xVel) {
                tile.pos.x += tile.xVel * dt; // march position
                if (tile.pos.x < xBounds[0] || tile.pos.x > xBounds[1]) {
                    tile.xVel *= -1; // reverse direction

                    // todo revert
                    // remove tile if it leaves the bounds
                    // lane.splice(i, 1);
                    // i--;
                    // needsUpdate = true;
                }
            }
        }
    }

    if (needsUpdate) updateDisplay();
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

// information can reach display via reference, call this when
// new objects are added so they can be properly grouped on the display module
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
    const safeHeight = 2.6;
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