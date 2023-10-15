varying highp vec4 v_color;
varying highp vec4 v_light;

void main(void) {
    gl_FragColor = v_light * v_color;
}