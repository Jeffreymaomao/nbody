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

    float selfIndex = gl_FragCoord.y * textureSize.x + gl_FragCoord.x;
    float selfX     = gl_FragCoord.x - 0.5;
    float selfY     = gl_FragCoord.y - 0.5;
    float density   = 0.0; // accumulate density

    for (float y = 0.0; y < textureSize.y; y++) {
        for (float x = 0.0; x < textureSize.x; x++) {
            
            // skip self
            float index = y * textureSize.x + x;
            if (index == selfIndex) continue;
            
            // get other position
            vec2 uvOther  = (vec2(x, y) + 0.5) / textureSize;
            vec3 otherPos = texture2D(texturePosition, uvOther).xyz;
            
            // calculate distance
            vec3 delta     = selfPos.xyz - otherPos;      //  r1 - r2
            float dist2    = dot(delta, delta) + 1e-8;    // |r1 - r2|^2
            float invDist  = inversesqrt(dist2);          // 1/|r1 - r2|^1
            float invDist2 = invDist * invDist;           // 1/|r1 - r2|^2
            float invDist3 = invDist * invDist * invDist; // 1/|r1 - r2|^3
            
            // approximate density
            density += invDist2;

            // calculate force
            force -= delta * invDist3 * G; // F = -G * (r1 - r2) / |r1 - r2|^3
        }
    }

    vec3 newVel = selfVel.xyz + force * deltaTime * G;
    gl_FragColor = vec4(newVel, density);
}