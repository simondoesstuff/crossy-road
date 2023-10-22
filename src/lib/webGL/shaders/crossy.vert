attribute vec4 a_position;
attribute vec4 a_normal;
attribute vec4 a_color;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

uniform highp vec4 u_directionalLightDir;
uniform highp vec4 u_directionalLightColor;
uniform highp vec4 u_ambientLightColor;

varying highp vec4 v_color;
varying highp vec4 v_light;

const lowp float leftBoundary = -100.0;
const lowp float rightBoundary = 100.0;

void main(void) {
    gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;

    highp vec4 normal = u_normalMatrix * a_normal;
    highp vec4 dirLight = max(dot(normal, u_directionalLightDir), 0.0) * u_directionalLightColor;
    v_light = dirLight + u_ambientLightColor;

    v_color = a_color;
    if (gl_Position.x < leftBoundary || gl_Position.x > rightBoundary) {
        v_color /= 1.5;
    }
}