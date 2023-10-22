import {events, gl, shader, updateModelViewMatrix, updateNormalMatrix} from "$lib/webGL/glManager";
import {Object3D} from "$lib/webGL/resources";
import {mat4} from "gl-matrix";

export async function init() {
    const scale = 160;

    // load models
    const obj = await Object3D.fromPath('./resourcePacks/basic/player.ply');

    gl.clearColor(0, 0, 0.1, 1.0);
    gl.uniform4fv(shader.uniform.directionalLightDir, [2.0, 1.0, 0.7, 0]);
    gl.uniform4fv(shader.uniform.directionalLightColor, [0, 0.2, 0.2, 1]);
    gl.uniform4fv(shader.uniform.ambientLightColor, [.7, .7, .7, 1]);

    obj.bind();

    let rotation = 0;
    events.render.add((dt) => {
        rotation += dt;

        let modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, -.1 * scale, -.7 * scale]);

        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, Math.sin(rotation * .5) * 25 + 10, 0.0]);
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, Math.sin(rotation * 2.23) * 5]);

        mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [0, 1, 0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, Math.sin(rotation * 2.87) * .2, [1, 0, 1]);
        mat4.translate(modelViewMatrix, modelViewMatrix, [11, 0, 0]);

        updateModelViewMatrix(modelViewMatrix);
        updateNormalMatrix();

        obj.draw();
    });
}