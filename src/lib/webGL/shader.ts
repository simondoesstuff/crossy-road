import {gl} from "./glManager";
import {importFile} from "$lib/webGL/utils";

let shaders: Map<string, Shader>;

export interface Shader {
    name: string;
    program: WebGLProgram;
    attribute: {
        position: number;
        normal: number;
        color: number;
    },
    uniform: {
        projectionMatrix: WebGLUniformLocation;
        modelViewMatrix: WebGLUniformLocation;
    }
}

export interface CrossyShader extends Shader {
    uniform: {
        projectionMatrix: WebGLUniformLocation;
        modelViewMatrix: WebGLUniformLocation;
        normalMatrix: WebGLUniformLocation;
        directionalLightDir: WebGLUniformLocation;
        directionalLightColor: WebGLUniformLocation;
        ambientLightColor: WebGLUniformLocation;
    }
}

export async function initShaders(): Promise<Map<string, Shader>> {
    let shaders = new Map<string, Shader>();
    shaders.set('default', await compileShader('default'));

    const crossy = await compileShader('crossy') as CrossyShader;
    crossy.uniform.directionalLightDir = gl.getUniformLocation(crossy.program, 'u_directionalLightDir')!;
    crossy.uniform.directionalLightColor = gl.getUniformLocation(crossy.program, 'u_directionalLightColor')!;
    crossy.uniform.ambientLightColor = gl.getUniformLocation(crossy.program, 'u_ambientLightColor')!;
    crossy.uniform.normalMatrix = gl.getUniformLocation(crossy.program, 'u_normalMatrix')!;
    shaders.set('crossy', crossy);

    return shaders;
}

// loads a shader from file and compiles it
async function compileShader(prefix: string): Promise<Shader> {
    const vertPath = `./shaders/${prefix}.vert`;
    const fragPath = `./shaders/${prefix}.frag`;

    // load from file using path vsSource and fsSource
    const vsSource = await importFile(vertPath);
    const fsSource = await importFile(fragPath);

    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram()!;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw `Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`;
    }

    return {
        name: prefix,
        program: shaderProgram,
        attribute: {
            position: gl.getAttribLocation(shaderProgram, 'a_position'),
            normal: gl.getAttribLocation(shaderProgram, 'a_normal'),
            color: gl.getAttribLocation(shaderProgram, 'a_color'),
        },
        uniform: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'u_projectionMatrix')!,
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'u_modelViewMatrix')!,
        }
    };
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(type: number, source: string) {
    const shader: WebGLShader = gl.createShader(type)!;

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`;
    }

    return shader!;
}