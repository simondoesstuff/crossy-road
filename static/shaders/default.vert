attribute vec4 a_position;
attribute vec4 a_normal;
attribute vec4 a_color;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;

varying lowp vec4 v_color;

void main(void) {
    gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
    gl_PointSize = 5.0;
    v_color = a_color;
}