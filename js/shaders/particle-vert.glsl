uniform sampler2D texturePosition;
uniform vec2 textureSize;
uniform float pointSize;
varying vec2 vUv;

void main() {
    float index = float(gl_VertexID);
    vec2 uv = (vec2(mod(index, textureSize.x), floor(index / textureSize.x)) + 0.5) / textureSize;
    vec3 pos = texture2D(texturePosition, uv).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float scale = 500.0 / -mvPosition.z;
    vUv = uv; // this will be used in the fragment shader
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = pointSize * scale;
}