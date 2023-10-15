uniform highp mat4 u_modelViewMatrix;

uniform highp vec4 u_directionalLightDir;
uniform highp vec4 u_directionalLightColor;
uniform highp vec4 u_ambientLightColor;

varying highp vec4 v_color;
varying highp vec4 v_normal;

void main(void) {
    highp float directional = max(dot(v_normal, u_directionalLightDir), 0.0);
    highp vec4 lighting = u_ambientLightColor + (u_directionalLightColor * directional);
    gl_FragColor = v_color * lighting;
}