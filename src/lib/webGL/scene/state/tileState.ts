import type {Object3D} from "$lib/webGL/resources";
import {models} from "$lib/webGL/resources";
import {BoundingBox, Vec} from "$lib/webGL/math/linear_algebra";
import * as display from "$lib/webGL/scene/display/display";
import {events as glEvents} from "$lib/webGL/glManager";
import * as player from "$lib/webGL/scene/state/player";
import {Store} from "$lib/webGL/utils";
import {init as mapGenInit} from "$lib/webGL/scene/state/mapGen";
import type {mat4} from "gl-matrix";
import {vec3} from "gl-matrix";


/*
    This module manages things like:

    Where are the objects? What are their speeds?
    For a lane, what is the type of biome? What intersects an object?
    High level state, independent of rendering.

    Per frame, it manages these states including moving objects with velocity
    and commanding the display module to reflect the results. This module is
    tightly coupled with the player module which manages similar high level
    state about the player (and nothing to do with the rendering of the player).
 */


export const xBounds = [0, 20]; // objects that leave the bounds are removed

const roadHeight = .72 + .6;
const safeHeight = 2.6;

export const score = new Store(0);

export interface Tile {
    type: 'safe' | 'road' | 'obstacle' | 'train' | 'log' | 'car',
    obj: Object3D,
    pos: Vec,
    mvMatrix?: mat4, // calculated for rendering, reused for collision detection
    xVel?: number,
    dontShift?: boolean // only used to differentiate ground tiles
    orientation?: number,
}

// todo car collisions should be handled by marking a lane as active (when the player enters it) ...
// and for each frame of car movement, the respective tile should be marked as occupied (conservative)
// the player can check for a potential collision in O(1) by comparing the bounding box of the player
// and car(s) in the same tile. The marked tiles are updated in O(cars) per frame.

let lanes: Tile[][] = [];

export async function* init() {
    for await (const r of mapGenInit())
        yield .30 * r;
    for await (const r of player.init())
        yield .30 + .15 * r;
    for await (const r of display.init())
        yield .45 + .50 * r;

    updateDisplay();

    glEvents.frame.add(marchObjects);

    glEvents.lateFrame.add(() => {
        if (!player.alive.get()) return;

        const objs = carsIntersecting();
        if (objs.length == 0) return;

        const hit = objs[0];
        const vel = hit.tile.xVel ?? 0;
        player.kill(hit.delta, vel);
    });
}

export function eraseMap() {
    lanes = [];
    updateDisplay();
}

export function laneCount() {
    return lanes.length;
}

// Considers an existing lane "retired"-- it will no longer be updated or rendered.
// Players should not be allowed to get near a retired lane. This is to expose
// redundant objects for garbage collection.
export function retireLane(z: number) {
    // note that lanes array is not spliced because the indices are important
    // and this avoids some array shifting.
    lanes[z] = [];
}

// determines the intersecting objects at the given position of the given bounding box.
export function playerIntersections(filterFor: (tile: Tile) => boolean = () => true) {
    // utility function to apply a matrix transformation(s) to a bounding box
    const transformVec = (vec: Vec, matrix: mat4) => {
        // the input vectors are in the XZ (horizontal) plane, but the matrix is in XYZ(W)
        const v3 = vec3.fromValues(vec.x, 0, vec.y); // convert to vec3
        const vt = vec3.transformMat4(vec3.create(), v3, matrix); // apply transformation
        return new Vec(vt[0], vt[2]);
    }

    // similarly, for a box
    const transformBox = (box: [Vec, Vec], matrix: mat4) => {
        return [
            transformVec(box[0], matrix),
            transformVec(box[1], matrix)
        ];
    }

    type hit = {tile: Tile, delta: [number, number]};
    let objects: hit[] = [];

    const playerMatrix = display.getPlayerMvMatrix();
    const playerBox = models.player.boundingRect;
    const playerBox_t = transformBox(playerBox, playerMatrix);

    const scanLane = (z: number) => {
        const lane = lanes[z];
        if (!lane) return;

        for (const tile of lane) {
            if (!filterFor(tile)) continue;
            const matrix = tile.mvMatrix;
            if (!matrix) break; // can't compute intersections until at least one frame has passed

            const tileBox = tile.obj.boundingRect;
            const tileBox_t = transformBox(tileBox, matrix);

            const intersectDelta = BoundingBox.intersect(playerBox_t[0], playerBox_t[1], tileBox_t[0], tileBox_t[1]);
            if (intersectDelta) {
                objects.push({
                    tile,
                    delta: intersectDelta as [number, number]
                });
            }
        }
    }

    const zCenter = Math.trunc(player.pos.z);
    scanLane(zCenter);

    if (player.pos.z == zCenter) {
        // since the player is perfectly centered, we only need to check the lane they're in
        return objects;
    }

    // additionally scan the next closest lane
    const zOff = player.pos.z > zCenter ? 1 : -1;
    scanLane(zCenter + zOff);

    return objects;
}

export function carsIntersecting() {
    return playerIntersections(tile => tile.type == 'car')
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
    if (lanes[z].length == 0) return false;
    return lanes[z][0].type == 'safe';
}

// information can reach display via reference, call this when
// new objects are added so they can be properly grouped on the display module
export function updateDisplay() {
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
    const x = 19; // only used for rendering purposes
    switch (type) {
        case 'safe':
            // alt ensures that back to back safe tiles will not be of the same color
            let alt = 1;
            if (lanes.length != 0) {
                const lane = lanes[lanes.length - 1];
                if (lane.length != 0 && lane[0].obj == models.safe2) {
                    alt = 0;
                }
            }

            for (let j = 0; j < width; j++) {
                let obj = (j % 2 == alt) ? models.safe : models.safe2;
                lanes.push([{type: 'safe', obj, pos: new Vec(x)}]);
            }
            break;
        case 'road':
            if (width == 1) {
                lanes.push([{type: 'road', obj: models.road, pos: new Vec(x)}]);
            } else {
                lanes.push([{type: 'road', obj: models.roadCap2, pos: new Vec(x)}]);
                for (let j = 0; j < width - 2; j++) {
                    lanes.push([{type: 'road', obj: models.roadStripe, pos: new Vec(x)}]);
                }
                lanes.push([{type: 'road', obj: models.roadCap, pos: new Vec(x)}]);
            }
            break;
    }
}

export function addTrain(z: number) {
    lanes[z].push({type: 'train', obj: models.track, pos: new Vec(18.5)});
    lanes[z].push({type: 'train', obj: models.trackPost, pos: new Vec(5)});
}

export function addCar(x: number, z: number, speed?: number, orientation?: number, variant?: number) {
    orientation ??= Math.floor(Math.random() * 4);
    speed ??= 0;
    // todo add car variants
    const car = {type: "car", obj: models.car1, pos: new Vec(x), xVel: speed, orientation} as Tile;
    lanes[z].push(car);
}

export function addRock(x: number, z: number, orientation?: number, variant?: number) {
    orientation ??= Math.floor(Math.random() * 4);
    // todo rock variants
    lanes[z].push({type: 'obstacle', obj: models.rock, pos: new Vec(x), orientation});
}

export function addTree(x: number, z: number, height: number) {
    let tree = [
        {type: 'obstacle', obj: models.treeBase, pos: new Vec(x)} as Tile,
    ];

    for (let i = 0; i < height; i++) {
        tree.push({type: 'obstacle', obj: models.treeTop, pos: new Vec(x, .4 * i)});
    }

    // ordering in the lane is not important
    lanes[z].push(...tree);
}