// uniform sampler2D texturePosition;
// uniform sampler2D textureVelocity;
uniform float deltaTime;
uniform float G;
uniform vec2 textureSize;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 selfPos = texture2D(texturePosition, uv);
    vec4 selfVel = texture2D(textureVelocity, uv);

    vec3 force = vec3(0.0);
    float selfX = gl_FragCoord.x - 0.5;
    float selfY = gl_FragCoord.y - 0.5;

    for (float y = 0.0; y < textureSize.y; y++) {
        for (float x = 0.0; x < textureSize.x; x++) {
            if (x == selfX && y == selfY) continue;
            vec2 uvOther = (vec2(x, y) + 0.5) / textureSize;
            vec3 otherPos = texture2D(texturePosition, uvOther).xyz;
            vec3 delta = otherPos - selfPos.xyz;
            float dist = length(delta) + 1e-4;
            force += normalize(delta) / (dist * dist);
        }
    }

    vec3 newVel = selfVel.xyz + force * deltaTime * G;
    gl_FragColor = vec4(newVel, 1.0);
}