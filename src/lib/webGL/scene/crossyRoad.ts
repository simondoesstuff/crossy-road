import {models, Object3D} from "$lib/webGL/resources";
import {events, gl, modelViewMatrix, shader, updateModelViewMatrix, updateNormalMatrix} from "$lib/webGL/glManager";
import * as player from "$lib/webGL/scene/player";
import {mat4} from "gl-matrix";
import {drawPos} from "$lib/webGL/scene/player";

const tileWidth = 20;
const roadHeight = .036;
const safeHeight = .13;

interface Tile {
    type: 'safe' | 'road' | 'obstacle' | 'train',
    obj: Object3D,
    x?: number,
    y?: number,
    z?: number,
    orientation?: number,
}

let lanes: Tile[][] = [];
let tiles: Map<Object3D, Tile[]>;


export async function init() {
    gl.clearColor(0, 0, 0.1, 1.0);
    gl.uniform4fv(shader.uniform.directionalLightDir, [2.0, 1.0, 0.7, 0]);
    gl.uniform4fv(shader.uniform.directionalLightColor, [0.5, 0.5, 0.5, 1]);
    gl.uniform4fv(shader.uniform.ambientLightColor, [.5, .5, .5, 1]);

    player.init();

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
    bakeLanesToTiles();

    let rotation = 0
    events.render.add((dt) => {
        rotation += dt;
        player.update(dt);

        const rootMatrix = mat4.create();
        mat4.rotateX(rootMatrix, rootMatrix, Math.PI/4);
        mat4.translate(rootMatrix, rootMatrix, [-140, -210, -100]);
        mat4.rotateY(rootMatrix, rootMatrix, Math.sin(rotation) * .1);
        // mat4.translate(rootMatrix, rootMatrix, [-200, 0, -200]);

        for (const object of tiles.keys()) {
            object.bind();

            for (const tile of tiles.get(object)!) {
                const tileMatrix = mat4.clone(rootMatrix);
                const x = (tile.x ?? 0) * tileWidth;
                const y = (tile.y ?? 0) * tileWidth;
                const z = (tile.z ?? 0) * tileWidth;

                mat4.translate(tileMatrix, tileMatrix, [x, y, z]);
                mat4.rotateY(tileMatrix, tileMatrix, Math.PI/2 * (tile.orientation ?? 0));
                if (tile.type == 'safe') mat4.scale(tileMatrix, tileMatrix, [1, 3, 1]);

                updateModelViewMatrix(tileMatrix);
                updateNormalMatrix();
                object.draw();
            }
        }

        // player object
        {
            const playerMatrix = mat4.clone(rootMatrix);
            const x = player.drawPos.x * tileWidth;
            const z = -player.drawPos.z * tileWidth;
            const tileZ = Math.trunc(player.drawPos.z);
            const y = (player.drawPos.y + tileHeight(tileZ)) * tileWidth;

            mat4.translate(playerMatrix, playerMatrix, [x, y, z]);
            mat4.rotateY(playerMatrix, playerMatrix, Math.PI/2 * player.orient);
            const fatStretch = (4 - player.stretch) / 3;
            mat4.scale(playerMatrix, playerMatrix, [fatStretch, player.stretch, fatStretch]);

            updateModelViewMatrix(playerMatrix);
            updateNormalMatrix();
            models.player.bind();
            models.player.draw();
        }

        updateModelViewMatrix(rootMatrix);
    });
}

function tileHeight(z: number) {
    return lanes[z][0].type == 'safe' ? safeHeight : roadHeight;
}

export function addBoulevard(type: 'safe' | 'road', width: number) {
    const x = 19;
    switch (type) {
        case 'safe':
            for (let j = 0; j < width; j++) {
                let obj = (j % 2 == 1) ? models.safe : models.safe2;
                lanes.push([{ type: 'safe', obj, x }]);
            }
            break;
        case 'road':
            if (width == 1) {
                lanes.push([{ type: 'road', obj: models.road, x }]);
            } else {
                lanes.push([{ type: 'road', obj: models.roadCap2, x }]);
                for (let j = 0; j < width - 2; j++) {
                    lanes.push([{ type: 'road', obj: models.roadStripe, x }]);
                }
                lanes.push([{ type: 'road', obj: models.roadCap, x }]);
            }
            break;
    }
}

export function addTrain(z: number) {
    const shift = tileHeight(z);
    lanes[z].push({ type: 'train', obj: models.track, x: 19, y: shift });
    lanes[z].push({ type: 'train', obj: models.trackPost, x: 5, y: shift });
}

export function addObstacle(x: number, z: number, orientation?: number, variant?: number) {
    const shift = tileHeight(z);
    orientation ??= Math.floor(Math.random() * 4);
    // todo rock variants
    lanes[z].push({ type: 'obstacle', obj: models.rock, x, y: shift, orientation });
}

export function addTree(x: number, z: number, height: number) {
    let tree = [
        { type: 'obstacle', obj: models.treeBase, x, y: safeHeight } as Tile,
    ];

    for (let i = 0; i < height; i++) {
        tree.push({ type: 'obstacle', obj: models.treeTop, x, y: .4 * i + safeHeight });
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
