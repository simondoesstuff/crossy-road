varying highp vec4 v_color;
varying highp vec4 v_light;
varying highp float v_inBounds;

void main(void) {
    highp float inBounds = float(v_inBounds >= 0.0) * .5;
    gl_FragColor = (v_light - inBounds) * v_color;
}