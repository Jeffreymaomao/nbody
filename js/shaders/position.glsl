// uniform sampler2D texturePosition;
// uniform sampler2D textureVelocity;
uniform float deltaTime;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 pos = texture2D(texturePosition, uv);
    vec4 vel = texture2D(textureVelocity, uv);

    vec3 newPos = pos.xyz + vel.xyz * deltaTime;
    gl_FragColor = vec4(newPos, 1.0);
}
