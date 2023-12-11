// todo consider a clever init system that uses awaitAll to maximize concurrency

import {Event} from './utils';
import {type CrossyShader, initShaders, type Shader} from "$lib/webGL/shader";
import {mat4} from "gl-matrix";
import {init as inputInit} from '$lib/webGL/input';
import {init as resourcesInit} from '$lib/webGL/resources';

export let gl: WebGLRenderingContext;

export const events = {
    resize: new Event<(w: number, h: number) => void>(),
    // deltaTime in ms
    frame: new Event<(deltaTime: number) => void>(),
    lateFrame: new Event<(deltaTime: number) => void>(),
    ready: new Event<() => void>(), // called after initialization
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

    addEventListener('resize', () => checkCanvasSize()); // todo resize isn't working
    inputInit();
    await resourcesInit();

    // load shaders
    // set shader uniforms

    shaders = await initShaders();
    shader = shaders.get('crossy') as CrossyShader;
    gl.useProgram(shader.program);

    events.resize.add((w, h) => {
        let projMatrix = mat4.create();
        const far = 1000;
        const scale = 190;
        const aspect = w/h;
        const orthHeight = scale;
        const orthWidth = scale * aspect;
        mat4.ortho(projMatrix, -orthWidth/2, orthWidth/2, -orthHeight/2, orthHeight/2, 0.1, far);
        gl.uniformMatrix4fv(shader.uniform.projectionMatrix, false, projMatrix);
    });

    // scene setup

    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.enable(gl.CULL_FACE); // Cull triangles which normal is not towards the camera
    gl.cullFace(gl.BACK); // Cull back faces

    events.frame.add(() => {
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

        const dt = deltaTime/1000;
        events.frame.fire(dt);
        events.lateFrame.fire(dt);
        requestAnimationFrame(doFrame);
    }

    // @ts-ignore
    startRendering = () => {};
    requestAnimationFrame(doFrame);
}