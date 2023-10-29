import {models, Object3D} from "$lib/webGL/resources";
import {events, gl, shader, updateModelViewMatrix, updateNormalMatrix} from "$lib/webGL/glManager";
import * as player from "$lib/webGL/scene/player";
import * as camera from "$lib/webGL/scene/camera";
import {mat4} from "gl-matrix";
import type {Tile} from "$lib/webGL/scene/state/state";


const tileWidth = 20;
const tileHeight = .72; // refers to ground tiles

let tiles: Map<Object3D, Tile[]>;
let offsets: number[];

export async function init() {
    gl.clearColor(0, 0, 0.1, 1.0);
    gl.uniform4fv(shader.uniform.directionalLightDir, [-1.0, 1.0, 0.9, 0]);
    gl.uniform4fv(shader.uniform.directionalLightColor, [0.6, 0.6, 0.6, 1]);
    gl.uniform4fv(shader.uniform.ambientLightColor, [.6, .6, .6, 1]);

    player.init();
    player.onMove.add(() => camera.caffinate());

    events.render.add((dt) => {
        player.update(dt);
        camera.update(dt, player.pos);

        const rootMatrix = mat4.create();
        mat4.rotateX(rootMatrix, rootMatrix, Math.PI / 4);
        mat4.rotateY(rootMatrix, rootMatrix, Math.PI / -10);

        let camPos = camera.pos.mul(tileWidth).unwrapF32Array();
        camPos[0] *= -1; // flip x axis
        mat4.translate(rootMatrix, rootMatrix, camPos);
        mat4.translate(rootMatrix, rootMatrix, [-35, -200, -100]);

        for (const object of tiles.keys()) {
            object.bind();

            for (const tile of tiles.get(object)!) {
                const tileMatrix = mat4.clone(rootMatrix);
                const x = (tile.pos.x ?? 0) * tileWidth;
                const yOffset = tile.dontShift ? 0: offsets[tile.pos.z];
                const y = (tile.pos.y ?? 0) * tileWidth + yOffset;
                const z = (-tile.pos.z ?? 0) * tileWidth;

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
            const x = player.pos.x * tileWidth;
            const z = -player.pos.z * tileWidth;

            const tileZ = Math.trunc(player.pos.z);
            const yOffset = offsets[tileZ];
            const y = player.pos.y * tileWidth + yOffset;

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

export function updateTiles(newTiles: Generator<Tile>, newOffsets: number[]) {
    tiles = new Map();
    offsets = newOffsets;

    // tiles are grouped by object to reduce rebinding
    for (const tile of newTiles) {
        if (!tiles.has(tile.obj)) tiles.set(tile.obj, []);
        tiles.get(tile.obj)!.push(tile);
    }
}
