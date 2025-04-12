// uniform sampler2D texturePosition;
// uniform sampler2D textureVelocity;
uniform float deltaTime;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 pos = texture2D(texturePosition, uv); // (xx, yy, zz, 0.0)
    vec4 vel = texture2D(textureVelocity, uv); // (vx, vy, vz, dens)

    vec3 newPos = pos.xyz + vel.xyz * deltaTime;
    gl_FragColor = vec4(newPos, vel.w);
}
