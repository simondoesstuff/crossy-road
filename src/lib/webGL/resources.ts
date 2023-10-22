/// This module handles the loading of resources (usually models) and the creation of buffers.

import {PLYLoader} from "@loaders.gl/ply";
import {load} from "@loaders.gl/core";
import type {PLYMesh} from "@loaders.gl/ply/dist/lib/ply-types";
import {gl, shader as glShader} from "$lib/webGL/glManager";

/// Note, only supports ply files.
export class Object3D {
    private indices: WebGLBuffer;
    private position: WebGLBuffer;
    private color: WebGLBuffer;
    private normal: WebGLBuffer;

    private readonly mesh: PLYMesh;
    private readonly count: number;

    public constructor(mesh: PLYMesh) {
        this.mesh = mesh;
        if (!mesh.indices) throw new Error("No indices found in mesh.");
        this.count = mesh.indices.value.length;
        this.reinitializeBuffers();
    }

    public static async fromPath(path: string) {
        return new Object3D(await load(path, PLYLoader));
    }

    public bind() {
        const shader = glShader;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);

        // color
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color);
        gl.vertexAttribPointer(
            shader.attribute.color,
            3,
            gl.UNSIGNED_BYTE,
            true, // normalize
            0, // stride
            0, // offset
        );

        // position
        gl.bindBuffer(gl.ARRAY_BUFFER, this.position);
        gl.vertexAttribPointer(
            shader.attribute.position,
            3,
            gl.FLOAT,
            false, // normalize
            0, // stride
            0, // offset
        );

        // normal
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal);
        gl.vertexAttribPointer(
            shader.attribute.normal,
            3,
            gl.FLOAT,
            false, // normalize
            0, // stride
            0, // offset
        );

        gl.enableVertexAttribArray(shader.attribute.color);
        gl.enableVertexAttribArray(shader.attribute.position);
        gl.enableVertexAttribArray(shader.attribute.normal);
    }

    /// Note, this function assumes that the object is already bound.
    /// Attempting to draw() without calling bind() first will result in undefined behavior.
    public draw() {
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    public delete() {
        gl.deleteBuffer(this.indices);
        gl.deleteBuffer(this.position);
        gl.deleteBuffer(this.color);
        gl.deleteBuffer(this.normal);
    }

    /// This only needs to be called if the buffers have been delete()d.
    public reinitializeBuffers() {
        const mesh = this.mesh;
        const attr = mesh.attributes;

        this.indices = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices!.value), gl.STATIC_DRAW);

        this.position = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.POSITION.value), gl.STATIC_DRAW);

        this.color = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(attr.COLOR_0.value), gl.STATIC_DRAW);

        this.normal = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.NORMAL.value), gl.STATIC_DRAW);
    }
}

export interface Models {
    safe: Object3D;
    safe2: Object3D;
    road: Object3D;
    roadStripe: Object3D;
    roadCap: Object3D;
    roadCap2: Object3D;
    treeBase: Object3D;
    treeTop: Object3D;
    rock: Object3D;
    track: Object3D;
    trackPost: Object3D;
    player: Object3D;
}

export let models: Models = {} as Models;

async function loadModels(pack: string) {
    const keys = [
        'safe', 'safe2', 'road', 'roadStripe', 'roadCap', 'roadCap2',
        'treeBase', 'treeTop', 'rock', 'track', 'trackPost', 'player'
    ];

    const prefix = `./resourcePacks/${pack}/`;

    for (const model of keys) {
        // @ts-ignore
        models[model] = await Object3D.fromPath(prefix + model + '.ply');
    }
}

export async function init() {
    await loadModels('basic');
}