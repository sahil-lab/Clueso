export const vertexSource = /* glsl */ `#version 300 es
precision highp float;

layout(location = 0) in vec3 aLoop;
layout(location = 1) in vec3 aFrame;
layout(location = 2) in vec3 aCursor;
layout(location = 3) in vec3 aDelta;
layout(location = 4) in vec3 aCheck;
layout(location = 5) in vec3 aField;
layout(location = 6) in vec4 aSeed;

uniform mat4 uProjection;
uniform float uTime;
uniform float uMorph;
uniform float uFly;
uniform float uScale;
uniform float uPixel;
uniform float uGlitch;
uniform float uIntro;
uniform float uPulse;
uniform float uPush;
uniform float uDistance;
uniform float uAlpha;
uniform float uLite;
uniform int uFrom;
uniform int uTo;
uniform vec2 uOffset;
uniform vec2 uTilt;
uniform vec2 uPointer;
uniform vec3 uPulseColor;

out vec3 vColor;
out float vAlpha;
out float vSoft;
out float vHalo;

const float TAU = 6.28318530718;
float gSheen;
float gGloss;
float gHot;

mat2 turn(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

vec3 knot(float u) {
  float a = u * TAU * 2.0;
  float r = 0.62 + 0.3 * cos(1.5 * a);
  return vec3(r * cos(a), r * sin(a), 0.4 * sin(1.5 * a));
}

vec3 loopForm() {
  float u = fract(aLoop.x + uTime * 0.011 * (0.45 + aSeed.z));
  vec3 center = knot(u);
  vec3 tangent = normalize(knot(u + 0.002) - knot(u - 0.002));
  vec3 side = normalize(cross(tangent, vec3(0.0, 0.0, 1.0)));
  vec3 up = cross(tangent, side);
  float twist = u * TAU * 3.0 + uTime * 0.22;
  vec3 across = side * cos(twist) + up * sin(twist);
  vec3 normal = up * cos(twist) - side * sin(twist);
  vec3 p = center + across * aLoop.y * 0.19 + normal * aLoop.z * 0.012;
  p.yz = turn(-0.92) * p.yz;
  normal.yz = turn(-0.92) * normal.yz;
  float spin = uTime * 0.14;
  p.xz = turn(spin) * p.xz;
  normal.xz = turn(spin) * normal.xz;
  gSheen = 0.16 + 0.84 * pow(abs(normal.z), 1.6);
  gGloss = pow(abs(normal.z), 5.0);
  return p;
}

vec3 frameForm() {
  vec3 p = aFrame;
  float band = floor((p.y + 1.0) * 10.0);
  float beat = floor(uTime * 2.4);
  float torn = step(0.58, hash(band * 3.7 + beat * 1.31));
  float shift = (hash(band * 9.1 + beat) - 0.5) * 0.7 * torn * uGlitch;
  p.x += shift;
  gHot = smoothstep(0.02, 0.16, abs(shift));
  p.xz = turn(sin(uTime * 0.4) * 0.3) * p.xz;
  p.yz = turn(0.1) * p.yz;
  return p;
}

vec3 flatForm(vec3 p, float phase) {
  p.xz = turn(sin(uTime * 0.45 + phase) * 0.34) * p.xz;
  p.yz = turn(cos(uTime * 0.36 + phase) * 0.09) * p.yz;
  return p;
}

vec3 fieldForm() {
  vec3 p = aField;
  p.y = sin(p.x * 2.1 + uTime * 0.55) * 0.12
    + sin(p.z * 2.8 - uTime * 0.42) * 0.1
    + sin((p.x + p.z) * 1.3 + uTime * 0.28) * 0.08;
  p.yz = turn(0.36) * p.yz;
  return p;
}

vec3 form(int index) {
  if (index == 0) return loopForm();
  if (index == 1) return frameForm();
  if (index == 2) return flatForm(aCursor, 0.0);
  if (index == 3) return flatForm(aDelta, 1.7);
  if (index == 4) return flatForm(aCheck, 3.1);
  return fieldForm();
}

void main() {
  gSheen = 1.0;
  gGloss = 0.0;
  gHot = 0.0;
  vec3 from = form(uFrom);
  float sheenFrom = gSheen;
  float glossFrom = gGloss;
  float hotFrom = gHot;
  gSheen = 1.0;
  gGloss = 0.0;
  gHot = 0.0;
  vec3 to = form(uTo);
  float sheenTo = gSheen;
  float glossTo = gGloss;
  float hotTo = gHot;

  float delay = aSeed.x * 0.4;
  float t = smoothstep(delay, delay + 0.6, uMorph);
  vec3 p = mix(from, to, t);

  float flight = sin(t * 3.14159265) * uFly;
  p += flight * 0.5 * vec3(
    sin(aSeed.y * 19.0 + uTime * 0.9 + p.y * 2.0),
    cos(aSeed.z * 17.0 + uTime * 0.8 + p.x * 2.0),
    sin(aSeed.w * 23.0 + uTime * 0.7 + p.z * 2.0)
  );
  p += 0.01 * vec3(
    sin(uTime * 0.9 + aSeed.y * 90.0),
    cos(uTime * 0.8 + aSeed.z * 90.0),
    sin(uTime * 1.1 + aSeed.w * 90.0)
  );

  float formed = smoothstep(aSeed.w * 0.5, aSeed.w * 0.5 + 0.5, uIntro);
  vec3 scattered = (vec3(aSeed.y, aSeed.z, aSeed.x) - 0.5) * vec3(7.0, 4.6, 6.0);
  p = mix(scattered, p, formed);

  float ring = exp(-pow((length(p.xy) - uPulse * 3.4) * 2.6, 2.0))
    * step(0.0001, uPulse) * (1.0 - uPulse);
  p += normalize(p + 0.0001) * ring * 0.2;

  p.xz = turn(uTilt.y) * p.xz;
  p.yz = turn(uTilt.x) * p.yz;

  vec3 world = p * uScale + vec3(uOffset, 0.0);
  vec2 away = world.xy - uPointer;
  float reach = length(away);
  float push = uPush * smoothstep(1.3, 0.0, reach);
  world.xy += (away / (reach + 0.001)) * push * 0.55;
  world.z += push * 0.6;

  vec4 view = vec4(world.xy, world.z - uDistance, 1.0);
  gl_Position = uProjection * view;

  float depth = -view.z;
  float blur = clamp(abs(depth - uDistance) * 0.36, 0.0, 1.0);
  blur *= blur;
  float halo = step(0.985, aSeed.x) * (1.0 - uLite);
  float size = mix(1.25, mix(13.0, 5.0, uLite), blur) * (0.55 + aSeed.z * 0.9);
  size = mix(size, size * 4.0 + 12.0, halo);
  gl_PointSize = max(1.0, uPixel * size * (uDistance / depth));

  vec3 lime = vec3(0.74, 1.0, 0.22);
  vec3 ice = vec3(0.84, 0.95, 1.0);
  vec3 violet = vec3(0.46, 0.34, 1.0);
  vec3 coral = vec3(1.0, 0.36, 0.22);
  vec3 color = mix(lime, ice, smoothstep(0.6, 0.92, aSeed.y));
  color = mix(color, violet, smoothstep(0.2, 0.0, aSeed.y) * 0.85);
  color = mix(color, vec3(0.96, 1.0, 0.86), mix(glossFrom, glossTo, t) * 0.6);
  color = mix(color, coral, mix(hotFrom, hotTo, t));
  color = mix(color, uPulseColor, clamp(ring * 1.8, 0.0, 1.0));

  float twinkle = 0.7 + 0.3 * sin(uTime * 1.7 + aSeed.w * 120.0);
  vAlpha = uAlpha * mix(sheenFrom, sheenTo, t) * twinkle
    * mix(1.0, 0.1, blur) * mix(0.35, 1.0, formed) * (1.0 + ring * 2.5)
    * mix(1.0, 0.16, halo);
  vColor = color;
  vSoft = blur;
  vHalo = halo;
}
`;

export const fragmentSource = /* glsl */ `#version 300 es
precision highp float;

in vec3 vColor;
in float vAlpha;
in float vSoft;
in float vHalo;
out vec4 outColor;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float core = pow(1.0 - d, 1.7);
  float disc = smoothstep(1.0, 0.7, d) * 0.55;
  float glow = pow(1.0 - d, 2.6);
  outColor = vec4(vColor * mix(mix(core, disc, vSoft), glow, vHalo) * vAlpha, 1.0);
}
`;

export const postVertexSource = /* glsl */ `#version 300 es
out vec2 vUv;

void main() {
  vUv = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(vUv * 2.0 - 1.0, 0.0, 1.0);
}
`;

// A zero step turns the five taps into one box sample, which is how the scene is downsampled.
export const blurSource = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uSource;
uniform vec2 uStep;
uniform float uCeiling;
out vec4 outColor;

void main() {
  vec3 sum = texture(uSource, vUv).rgb * 0.227027;
  sum += (texture(uSource, vUv + uStep * 1.384615).rgb
    + texture(uSource, vUv - uStep * 1.384615).rgb) * 0.316216;
  sum += (texture(uSource, vUv + uStep * 3.230769).rgb
    + texture(uSource, vUv - uStep * 3.230769).rgb) * 0.070270;
  outColor = vec4(min(sum, vec3(uCeiling)), 1.0);
}
`;

export const compositeSource = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uTight;
uniform sampler2D uMid;
uniform sampler2D uWide;
uniform vec3 uBackground;
uniform vec3 uGlow;
out vec4 outColor;

void main() {
  vec3 scene = min(texture(uScene, vUv).rgb, vec3(1.0));
  vec3 glow = texture(uTight, vUv).rgb * uGlow.x
    + texture(uMid, vUv).rgb * uGlow.y
    + texture(uWide, vUv).rgb * uGlow.z;
  // Screen blending keeps the particle texture readable inside the densest strokes.
  vec3 lit = 1.0 - (1.0 - scene) * (1.0 - min(glow, vec3(1.0)));
  float grain = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  outColor = vec4(uBackground + lit + (grain - 0.5) / 255.0, 1.0);
}
`;
