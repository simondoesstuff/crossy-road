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

const highp float boundaryRadius = 200000.0;
const highp float boundaryCenter = 0.0;
varying highp float v_inBounds;

void main(void) {
    highp vec4 worldPosition = u_modelViewMatrix * a_position;
    gl_Position = u_projectionMatrix * worldPosition;
    v_inBounds = -1.0; // todo add dark color to out of bounds

    highp vec4 normal = u_normalMatrix * a_normal;
    highp vec4 lightDir = u_directionalLightDir;
    v_light = max(dot(normal, lightDir), 0.0) * u_directionalLightColor + u_ambientLightColor;

    v_color = a_color;
}