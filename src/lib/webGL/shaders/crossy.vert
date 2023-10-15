attribute vec4 a_position;
attribute vec4 a_normal;
attribute vec4 a_color;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

varying highp vec4 v_color;
varying highp vec4 v_normal;

void main(void) {
    gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
    v_color = a_color;
    v_normal = 30.0 * normalize(u_normalMatrix * a_normal);
}