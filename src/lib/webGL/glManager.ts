import {Event, normalize} from './utils';
import {type CrossyShader, initShaders, type Shader} from "$lib/webGL/shader";
import {load} from '@loaders.gl/core';
import {PLYLoader} from "@loaders.gl/ply";
import {mat4} from "gl-matrix";
import {Object3D} from "$lib/webGL/resources";

export let gl: WebGLRenderingContext;

export const events = {
    resize: new Event<(w: number, h: number) => void>(),
    // deltaTime in ms
    render: new Event<(deltaTime: number) => void>()
}

export let shaders: Map<string, Shader>;
export let shader: CrossyShader;
export let modelViewMatrix = mat4.create();


/// Assumes that only one canvas is used for WebGL
export async function init(canvas: HTMLCanvasElement) {
    gl = canvas.getContext("webgl")!;

    if (!gl) {
        throw "Unable to initialize WebGL. Your browser or machine may not support it.";
    }

    // load shaders
    // set shader uniforms

    shaders = await initShaders();
    shader = shaders.get('crossy') as CrossyShader;
    gl.useProgram(shader.program);

    events.resize.add((w, h) => {
        let projMatrix = mat4.create();
        const fov = 50 * Math.PI / 180;
        const far = null!; // todo make far frustum dist finite?
        mat4.perspective(projMatrix, fov, gl.canvas.width / gl.canvas.height, 0.1, far);
        gl.uniformMatrix4fv(shader.uniform.projectionMatrix, false, projMatrix);
    });

    // scene setup

    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.enable(gl.CULL_FACE); // Cull triangles which normal is not towards the camera
    gl.cullFace(gl.BACK); // Cull back faces

    events.render.add((dt) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    });

    checkCanvasSize();
}

/// Will NOT automatically update the normal matrix
export function updateModelViewMatrix(updater: mat4 | ((matrix: mat4) => void)) {
    if (updater instanceof Function) {
        updater(modelViewMatrix);
    } else {
        modelViewMatrix = updater;
    }

    gl.uniformMatrix4fv(shader.uniform.modelViewMatrix, false, modelViewMatrix);
}

export function updateNormalMatrix() {
    let normalMatrix = mat4.clone(modelViewMatrix);
    mat4.invert(normalMatrix, normalMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix4fv(shader.uniform.normalMatrix, false, normalMatrix);
}

export function checkCanvasSize() {
    const canvas = gl.canvas as HTMLCanvasElement;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    events.resize.fire(canvas.width, canvas.height);
}

export function startRendering() {
    let then: number = 0;

    function doFrame(now: number) {
        if (then === 0) then = now;
        const deltaTime = now - then;
        then = now;

        events.render.fire(deltaTime);
        requestAnimationFrame(doFrame);
    }

    // @ts-ignore
    startRendering = () => {};
    requestAnimationFrame(doFrame);
}