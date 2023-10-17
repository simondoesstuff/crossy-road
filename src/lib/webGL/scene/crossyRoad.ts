import {Object3D} from "$lib/webGL/resources";
import {events, gl, modelViewMatrix, shader, updateModelViewMatrix, updateNormalMatrix} from "$lib/webGL/glManager";
import {mat4} from "gl-matrix";

const tileWidth = 20;
const obstacleYShift = 0.14;

let safe: Object3D;
let safe2: Object3D;
let road: Object3D;
let roadStripe: Object3D;
let roadCap: Object3D;
let roadCap2: Object3D;
let treeBase: Object3D;
let treeTop: Object3D;
let rock: Object3D;

interface Tile {
    type: 'safe' | 'road' | 'obstacle',
    obj: Object3D,
    x?: number,
    y?: number,
    z?: number,
    orientation?: number,
}

let lanes: Tile[][] = [];
let tiles: Map<Object3D, Tile[]>;


export async function init() {
    safe = await Object3D.fromPath('./resourcePacks/basic/safe.ply');
    safe2 = await Object3D.fromPath('./resourcePacks/basic/safe2.ply');
    road = await Object3D.fromPath('./resourcePacks/basic/road.ply');
    roadStripe = await Object3D.fromPath('./resourcePacks/basic/roadStripe.ply');
    roadCap = await Object3D.fromPath('./resourcePacks/basic/roadCap.ply');
    roadCap2 = await Object3D.fromPath('./resourcePacks/basic/roadCap2.ply');

    treeBase = await Object3D.fromPath('./resourcePacks/basic/treeBase.ply');
    treeTop = await Object3D.fromPath('./resourcePacks/basic/treeTop.ply');
    rock = await Object3D.fromPath('./resourcePacks/basic/rock.ply');

    gl.clearColor(0, 0, 0.1, 1.0);
    gl.uniform4fv(shader.uniform.directionalLightDir, [2.0, 1.0, 0.7, 0]);
    gl.uniform4fv(shader.uniform.directionalLightColor, [0.5, 0.5, 0.5, 1]);
    gl.uniform4fv(shader.uniform.ambientLightColor, [.5, .5, .5, 1]);

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

    addRock(1, 4);
    addRock(5, 5);
    addRock(11, 0);
    addRock(14, 9);
    bakeLanesToTiles();

    let rotation = 0
    events.render.add((dt) => {
        rotation += dt / 1000;

        const rootMatrix = mat4.create();
        mat4.translate(rootMatrix, rootMatrix, [-190, -60, -150]);
        mat4.rotateX(rootMatrix, rootMatrix, Math.PI / 6);
        mat4.rotateY(rootMatrix, rootMatrix, Math.sin(rotation) * .2);
        mat4.translate(rootMatrix, rootMatrix, [0, 0, -80]);

        for (const object of tiles.keys()) {
            object.bind();

            for (const tile of tiles.get(object)!) {
                const tileMatrix = mat4.clone(rootMatrix);
                const x = (tile.x ?? 0) * tileWidth;
                const y = (tile.y ?? 0) * tileWidth;
                const z = (tile.z ?? 0) * tileWidth;

                mat4.translate(tileMatrix, tileMatrix, [x, y, z]);
                mat4.rotate(tileMatrix, tileMatrix, Math.PI/2 * (tile.orientation ?? 0), [0, 1, 0]);
                if (tile.type == 'safe') mat4.scale(tileMatrix, tileMatrix, [1, 3, 1]);

                updateModelViewMatrix(tileMatrix);
                updateNormalMatrix();
                object.draw();
            }
        }

        updateModelViewMatrix(rootMatrix);
    });
}

export function addBoulevard(type: 'safe' | 'road', width: number) {
    // const x = -lanes.length * tileWidth;
    const x = 19;
    switch (type) {
        case 'safe':
            for (let j = 0; j < width; j++) {
                let obj = (j % 2 == 1) ? safe : safe2;
                lanes.push([{ type: 'safe', obj, x }]);
            }
            break;
        case 'road':
            if (width == 1) {
                lanes.push([{ type: 'road', obj: road, x }]);
            } else {
                lanes.push([{ type: 'road', obj: roadCap2, x }]);
                for (let j = 0; j < width - 2; j++) {
                    lanes.push([{ type: 'road', obj: roadStripe, x }]);
                }
                lanes.push([{ type: 'road', obj: roadCap, x }]);
            }
            break;
    }
}

export function addRock(x: number, z: number, orientation?: number, variant?: number) {
    orientation ??= Math.floor(Math.random() * 4);
    // todo rock variants
    lanes[z].push({ type: 'obstacle', obj: rock, x, y: obstacleYShift, orientation });
}

export function addTree(x: number, z: number, height: number) {
    let tree = [
        { type: 'obstacle', obj: treeBase, x, y: obstacleYShift } as Tile,
    ];

    for (let i = 0; i < height; i++) {
        tree.push({ type: 'obstacle', obj: treeTop, x, y: .4 * i + obstacleYShift });
    }

    // ordering in the lane is not important
    lanes[z].push(...tree);
}

function bakeLanesToTiles() {
    tiles = new Map();
    for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        for (const tile of lane) {
            tile.z = -i;
            if (!tiles.has(tile.obj)) tiles.set(tile.obj, []);
            tiles.get(tile.obj)!.push(tile);
        }
    }
}
