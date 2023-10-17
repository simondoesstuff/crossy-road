import {Object3D} from "$lib/webGL/resources";
import {events, gl, modelViewMatrix, shader, updateModelViewMatrix, updateNormalMatrix} from "$lib/webGL/glManager";
import {mat4} from "gl-matrix";

const roadLength = 20;
const tileWidth = 20;

let safeTile: Object3D;
let safeTileAlt: Object3D;
let roadTile: Object3D;
let roadTileStripe: Object3D;
let roadTileCap: Object3D;
let roadTileCap2: Object3D;

let boulevards = [
    {
        type: 'safe',
        width: 1,
    },
    {
        type: 'road',
        width: 2,
    },
    {
        type: 'safe',
        width: 3,
    },
    {
        type: 'road',
        width: 1
    },
    {
        type: 'safe',
        width: 1
    },
    {
        type: 'road',
        width: 4
    },
    {
        type: 'safe',
        width: 1
    },
    {
        type: 'safe',
        width: 1
    }
];

interface Tile {
    type: Object3D,
    x?: number,
    orientation?: number,
}

let tiles: Tile[][];

export async function init() {
    safeTile = await Object3D.fromPath('./resourcePacks/basic/safe.ply');
    safeTileAlt = await Object3D.fromPath('./resourcePacks/basic/safe2.ply');
    roadTile = await Object3D.fromPath('./resourcePacks/basic/road.ply');
    roadTileStripe = await Object3D.fromPath('./resourcePacks/basic/roadStripe.ply');
    roadTileCap = await Object3D.fromPath('./resourcePacks/basic/roadCap.ply');
    roadTileCap2 = await Object3D.fromPath('./resourcePacks/basic/roadCap2.ply');

    tiles = [];
    for (let i = 0; i < boulevards.length; i++) {
        const boulevard = boulevards[i];
        switch (boulevard.type) {
            case 'safe':
                for (let j = 0; j < boulevard.width; j++) {
                    let type = ((i + j) % 2 == 0) ? safeTile : safeTileAlt;
                    tiles.push([{ type }]);
                }
                break;
            case 'road':
                if (boulevard.width == 1) {
                    tiles.push([{ type: roadTile }]);
                } else {
                    tiles.push([{ type: roadTileCap2 }]);
                    for (let j = 0; j < boulevard.width - 2; j++) {
                        tiles.push([{ type: roadTileStripe }]);
                    }
                    tiles.push([{ type: roadTileCap }]);
                }
                break;
        }
    }

    gl.clearColor(0, 0, 0.1, 1.0);
    gl.uniform4fv(shader.uniform.directionalLightDir, [2.0, 1.0, 0.7, 0]);
    gl.uniform4fv(shader.uniform.directionalLightColor, [0.5, 0.5, 0.5, 1]);
    gl.uniform4fv(shader.uniform.ambientLightColor, [.5, .5, .5, 1]);

    // updateModelViewMatrix((matrix) => {
    //     mat4.translate(matrix, matrix, [0, 0, -200]);
    //     mat4.rotate(matrix, matrix, Math.PI / -4, [1, 0, 0]);
    // });

    let rotation = 0
    events.render.add((dt) => {
        rotation += dt / 1000;

        const rootMatrix = mat4.create();
        mat4.translate(rootMatrix, rootMatrix, [200, -80, -150]);
        mat4.rotateX(rootMatrix, rootMatrix, Math.PI / 6);
        mat4.rotateY(rootMatrix, rootMatrix, Math.sin(rotation) * .2);
        mat4.translate(rootMatrix, rootMatrix, [0, 0, -80]);

        for (let i = 0; i < tiles.length; i++) {
            const lane = tiles[i];
            const laneMatrix = mat4.create();
            mat4.translate(laneMatrix, rootMatrix, [0, 0, -i * tileWidth]);

            for (const tile of lane) {
                const tileMatrix = mat4.clone(laneMatrix);
                mat4.translate(tileMatrix, laneMatrix, [tileWidth * (tile.x ?? 0), 0, 0]);
                mat4.rotate(tileMatrix, tileMatrix, Math.PI/2 * (tile.orientation ?? 0), [0, 1, 0]);

                if (tile.type == safeTile || tile.type == safeTileAlt) {
                    mat4.scale(tileMatrix, tileMatrix, [1, 3, 1]);
                }

                updateModelViewMatrix(tileMatrix);
                updateNormalMatrix();

                const obj = tile.type;
                obj.bind();
                obj.draw();
            }
        }

        // updateModelViewMatrix(rootMatrix);
    });
}