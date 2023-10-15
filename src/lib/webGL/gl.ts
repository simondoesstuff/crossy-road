import {Event, normalize} from './utils';
import {type CrossyShader, initShaders, type Shader} from "$lib/webGL/shader";
import {load} from '@loaders.gl/core';
import {PLYLoader} from "@loaders.gl/ply";
import {mat4} from "gl-matrix";

export let gl: WebGLRenderingContext;

export const events = {
    resize: new Event<(w: number, h: number) => void>(),
    // deltaTime in ms
    render: new Event<(deltaTime: number) => void>()
}

let shaders: Map<string, Shader>;
let shader: CrossyShader;


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
    console.log(shader);

    let projMatrix = mat4.create();

    const fov = 45 * Math.PI / 180;
    const far = 160;
    mat4.perspective(projMatrix, fov, gl.canvas.width / gl.canvas.height, 0.1, far);
    gl.uniformMatrix4fv(shader.uniform.projectionMatrix, false, projMatrix);

    gl.uniform4fv(shader.uniform.directionalLightDir, [2.0, 1.0, 0.7, 0]);
    gl.uniform4fv(shader.uniform.directionalLightColor, [0, 0.2, 0.2, 1]);
    gl.uniform4fv(shader.uniform.ambientLightColor, [.7, .7, .7, 1]);

    gl.useProgram(shaders.get('default')!.program);
    gl.uniformMatrix4fv(shaders.get('default')!.uniform.projectionMatrix, false, projMatrix);
    gl.useProgram(shader.program);

    // load models

    const obj = await load('./models/crossChicken.ply', PLYLoader);
    const attr = obj.attributes;

    // create buffers; bind to shader

    const indicesBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices.value), gl.STATIC_DRAW);

    const positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.POSITION.value), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(attr.COLOR_0.value), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.NORMAL.value), gl.STATIC_DRAW);

    // load attributes

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);

    // color
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(
        shader.attribute.color,
        attr.COLOR_0.size,
        gl.UNSIGNED_BYTE,
        true, // normalize
        0, // stride
        0, // offset
    );
    gl.enableVertexAttribArray(shader.attribute.color);

    // position
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        shader.attribute.position,
        attr.POSITION.size,
        gl.FLOAT,
        false, // normalize
        0, // stride
        0, // offset
    );
    gl.enableVertexAttribArray(shader.attribute.position);

    // normal
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(
        shader.attribute.normal,
        attr.NORMAL.size,
        gl.FLOAT,
        false, // normalize
        0, // stride
        0, // offset
    );
    gl.enableVertexAttribArray(shader.attribute.normal);

    // scene setup

    let rotation = 0;

    gl.clearColor(0, 0.5, 0.9, 1.0); // Clear to black, fully opaque
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.enable(gl.CULL_FACE); // Cull triangles which normal is not towards the camera
    gl.cullFace(gl.BACK); // Cull back faces
    gl.uniformMatrix4fv(shader.uniform.projectionMatrix, false, projMatrix);

    let canChange = true;

    events.render.add((dt) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        rotation += dt / 1000;

        if (Math.abs(Math.sin(rotation * 2)) < .01 && canChange) {
            if (shader == shaders.get('default')) {
                shader = shaders.get('crossy') as CrossyShader;
                gl.useProgram(shader.program);
                gl.clearColor(0, 0.5, 0.9, 1.0); // Clear to black, fully opaque
            } else {
                shader = shaders.get('default')!;
                gl.useProgram(shader.program);
                gl.clearColor(0, 0, 0.1, 1); // Clear to black, fully opaque
            }
            canChange = false;
        } else {
            canChange = true;
        }

        // model view matrix

        let modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, -.1 * far, -.7 * far]);

        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, Math.sin(rotation * .5) * 25 + 10, 0.0]);
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, Math.sin(rotation * 2.23) * 5]);

        mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [0, 1, 0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, Math.sin(rotation * 2.87) * .2, [1, 0, 1]);
        mat4.translate(modelViewMatrix, modelViewMatrix, [11, 0, 0]);

        let normalMatrix = mat4.clone(modelViewMatrix);
        mat4.invert(normalMatrix, normalMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(shader.uniform.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(shader.uniform.normalMatrix, false, normalMatrix);

        const vertCount = obj.indices.value.length;
        gl.drawElements(gl.TRIANGLES, vertCount, gl.UNSIGNED_SHORT, 0);
    });

    checkCanvasSize();
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