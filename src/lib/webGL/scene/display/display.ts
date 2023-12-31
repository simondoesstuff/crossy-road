import {models, Object3D} from "$lib/webGL/resources";
import {events, gl, shader, updateModelViewMatrix, updateNormalMatrix} from "$lib/webGL/glManager";
import * as camera from "$lib/webGL/scene/display/camera";
import {mat4} from "gl-matrix";
import type {Tile} from "$lib/webGL/scene/state/tileState";
import * as player from "$lib/webGL/scene/state/player";
import {init as cameraInit} from "$lib/webGL/scene/display/camera";

const tileWidth = 20;

let tiles: Map<Object3D, Tile[]>;
let offsets: number[];
let playerMvMatrix: mat4;

export async function* init() {
    gl.clearColor(0, 0, 0.1, 1.0);

    gl.uniform4fv(shader.uniform.directionalLightDir, [-1.0, 1.0, 0.9, 0]);
    gl.uniform4fv(shader.uniform.directionalLightColor, [0.23, 0.23, 0.23, 1]);
    gl.uniform4fv(shader.uniform.ambientLightColor, [.72, .72, .72, 1]);

    cameraInit();

    yield .5;

    let rot = 0;
    events.frame.add((dt) => {
        rot += dt * 90;

        // todo perfect the directional light angle
        // {
        //     const yaw = 30 * Math.PI / 180;
        //     const pitch = rot * Math.PI / 180;
        //     const dir = new Vec(
        //         Math.cos(yaw) * Math.cos(pitch),
        //         Math.sin(pitch),
        //         Math.sin(yaw) * Math.cos(pitch),
        //     );
        //
        //     gl.uniform4fv(shader.uniform.directionalLightDir, [-10,10,-10,1]);
        //
        //     models.player.bind();
        //     const matrix = mat4.create();
        //     mat4.scale(matrix, matrix, [.1, .1, .1]);
        //     updateModelViewMatrix(matrix);
        //     models.player.draw();
        //
        //     gl.uniform4fv(shader.uniform.directionalLightDir, [...dir.data, 0]);
        // }

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

                tile.mvMatrix = tileMatrix;
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

            const tileZ = Math.round(player.pos.z);
            const yOffset = offsets[tileZ];
            const y = player.pos.y * tileWidth + yOffset;

            mat4.translate(playerMatrix, playerMatrix, [x, y, z]);
            mat4.scale(playerMatrix, playerMatrix, player.stretch.data as [number, number, number]);
            mat4.rotateY(playerMatrix, playerMatrix, Math.PI/2 * player.orient);

            playerMvMatrix = playerMatrix;
            updateModelViewMatrix(playerMatrix);
            updateNormalMatrix();
            models.player.bind();
            models.player.draw();
        }
    });
}

export function getPlayerMvMatrix () {
    return playerMvMatrix;
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
