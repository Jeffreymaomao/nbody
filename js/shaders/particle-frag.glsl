uniform sampler2D textureVelocity;
uniform vec2 textureSize;
uniform vec3 color;
varying vec2 vUv;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}


void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord) * 2.0;
    if (dist > 1.0) discard;
    float alpha = 1.0 - dist;
    alpha = pow(alpha, 2.0);

    vec4 vel_dens = texture2D(textureVelocity, vUv);
    float density = tanh(vel_dens.w);
    vec3 rgb = hsv2rgb(vec3(density, 1.0, 1.0));
    gl_FragColor = vec4(rgb, alpha);
}