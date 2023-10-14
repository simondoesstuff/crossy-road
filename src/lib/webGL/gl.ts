import {Event} from './utils';
import {compileShader, type Shader} from "$lib/webGL/shader";
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
let currentShader: Shader;


/// Assumes that only one canvas is used for WebGL
export async function init(canvas: HTMLCanvasElement) {
    gl = canvas.getContext("webgl")!;

    if (!gl) {
        throw "Unable to initialize WebGL. Your browser or machine may not support it.";
    }

    // load shaders
    shaders = new Map<string, Shader>();
    shaders.set('default', await compileShader('default'));
    useShader('default');

    // set shader uniforms

    let projMatrix = mat4.create();

    const fov = 45 * Math.PI / 180;
    const far = 120;
    mat4.perspective(projMatrix, fov, gl.canvas.width / gl.canvas.height, 0.1, far);
    gl.uniformMatrix4fv(currentShader.uniform.projectionMatrix, false, projMatrix);

    // load models
    const obj = await load('./models/rainbowCube.ply', PLYLoader);
    const attr = obj.attributes;
    console.log(obj);

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

    // const normalBuffer = gl.createBuffer()!;
    // gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.NORMAL.value), gl.STATIC_DRAW);

    // load attributes

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);

    // color
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(
        currentShader.attribute.color,
        attr.COLOR_0.size,
        gl.UNSIGNED_BYTE,
        true, // normalize
        0, // stride
        0, // offset
    );
    gl.enableVertexAttribArray(currentShader.attribute.color);

    // position
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        currentShader.attribute.position,
        attr.POSITION.size,
        gl.FLOAT,
        false, // normalize
        0, // stride
        0, // offset
    );
    gl.enableVertexAttribArray(currentShader.attribute.position);

    // normal
    // gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    // gl.vertexAttribPointer(
    //     currentShader.attribute.normal,
    //     attr.NORMAL.size,
    //     gl.FLOAT,
    //     false, // normalize
    //     0, // stride
    //     0, // offset
    // );
    // gl.enableVertexAttribArray(currentShader.attribute.normal);

    // scene setup

    let rotation = 0;

    gl.clearColor(0, 0.5, 0.9, 1.0); // Clear to black, fully opaque
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    // gl.enable(gl.CULL_FACE); // Cull triangles which normal is not towards the camera
    gl.uniformMatrix4fv(currentShader.uniform.projectionMatrix, false, projMatrix);

    events.render.add((dt) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        rotation += dt / 1000;

        // model view matrix

        let modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, -.1 * far, -.7 * far]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [0, 1, 0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, Math.sin(rotation*2)/4, [1, 0, 0]);
        gl.uniformMatrix4fv(currentShader.uniform.modelViewMatrix, false, modelViewMatrix);

        for (let x of [-1, 0, 1]) {
            for (let y of [-1, 0, 1]) {
                let y2 = 10 * y;
                let x2 = 10 * x;
                y2 += Math.sin(rotation) * 10 + 10;

                let newMatrix = mat4.clone(modelViewMatrix);
                mat4.translate(newMatrix, newMatrix, [x2, y2, 0.0]);

                const vertCount = obj.indices.value.length;
                gl.uniformMatrix4fv(currentShader.uniform.modelViewMatrix, false, newMatrix);
                gl.drawElements(gl.TRIANGLES, vertCount, gl.UNSIGNED_SHORT, 0);

            }
        }
    });

    checkCanvasSize();
    startRendering(); // todo remove; shoudl be called separately
}

export function useShader(name: string) {
    currentShader = shaders.get(name)!;
    gl.useProgram(currentShader.program);
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