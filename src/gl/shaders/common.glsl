// ---------------------------------------------------------------------------
// Shared toolkit for every scene: view uniforms, noise, SDF helpers and a
// procedural human silhouette that can fall, burn, stand or walk.
// ---------------------------------------------------------------------------
#define PI 3.14159265359
#define TAU 6.28318530718

uniform vec2 uRes;       // view size in device pixels
uniform vec2 uOffset;    // view origin in device pixels
uniform float uTime;
uniform float uShape;    // 0 = rect view, 1 = circle view
uniform float uAlpha;    // view opacity
uniform float uSpin;     // rotation of the content (record-style discs)
uniform float uViewZoom; // extra zoom for small views

out vec4 fragColor;

float sat(float x) { return clamp(x, 0.0, 1.0); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

const mat2 OCT = mat2(1.6, 1.2, -1.2, 1.6);
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = OCT * p; a *= 0.5; }
  return s;
}
float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = OCT * p; a *= 0.5; }
  return s;
}
// Rounded lobes with creases: cumulus / cauliflower edges.
float billow(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * abs(vnoise(p) * 2.0 - 1.0); p = OCT * p; a *= 0.5; }
  return s;
}

// Filmic tone curve (ACES fit) keeps the hot cores from clipping flat.
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
float sdCap(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - mix(ra, rb, h);
}
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// Direction for a limb angle: 0 = straight down, +PI/2 = towards +x.
vec2 limb(float a) { return vec2(sin(a), -cos(a)); }

// Human silhouette in figure space: pelvis at origin, +y up, ~1 unit tall.
// arms = (left upper, left fore, right upper, right fore)
// legs = (left thigh, left shin, right thigh, right shin)
// Angles are measured from hanging straight down, positive = away from body.
float sdHuman(vec2 p, vec4 arms, vec4 legs, float bulk) {
  float k = 0.028;
  // torso + sloped shoulders (trapezius)
  float d = sdCap(p, vec2(0.0, 0.02), vec2(0.0, 0.245), 0.068 * bulk, 0.08 * bulk);
  d = smin(d, sdCap(p, vec2(-0.012, 0.335), vec2(-0.09, 0.296), 0.03 * bulk, 0.04 * bulk), 0.05);
  d = smin(d, sdCap(p, vec2(0.012, 0.335), vec2(0.09, 0.296), 0.03 * bulk, 0.04 * bulk), 0.05);
  // neck, egg-shaped head with chin, ears
  d = smin(d, sdCap(p, vec2(0.0, 0.31), vec2(0.0, 0.392), 0.026, 0.023), 0.022);
  vec2 hp = p - vec2(0.0, 0.442);
  float head = length(hp * vec2(1.0, 0.87)) - 0.056;
  head = smin(head, length((hp - vec2(0.0, -0.034)) * vec2(1.32, 1.05)) - 0.043, 0.02);
  d = smin(d, head, 0.012);
  d = min(d, length((hp - vec2(-0.055, -0.008)) * vec2(1.7, 1.0)) - 0.0125);
  d = min(d, length((hp - vec2(0.055, -0.008)) * vec2(1.7, 1.0)) - 0.0125);

  // arms
  vec2 sL = vec2(-0.1, 0.29), sR = vec2(0.1, 0.29);
  vec2 eL = sL + limb(-arms.x) * 0.155;
  vec2 hL = eL + limb(-(arms.x + arms.y)) * 0.145;
  vec2 eR = sR + limb(arms.z) * 0.155;
  vec2 hR = eR + limb(arms.z + arms.w) * 0.145;
  d = smin(d, sdCap(p, sL, eL, 0.036 * bulk, 0.029 * bulk), k);
  d = smin(d, sdCap(p, eL, hL, 0.028 * bulk, 0.021), k);
  d = smin(d, length(p - hL) - 0.023, 0.015);
  d = smin(d, sdCap(p, sR, eR, 0.036 * bulk, 0.029 * bulk), k);
  d = smin(d, sdCap(p, eR, hR, 0.028 * bulk, 0.021), k);
  d = smin(d, length(p - hR) - 0.023, 0.015);

  // legs
  vec2 pL = vec2(-0.052, -0.005), pR = vec2(0.052, -0.005);
  vec2 kL = pL + limb(-legs.x) * 0.235;
  vec2 fL = kL + limb(-(legs.x + legs.y)) * 0.235;
  vec2 kR = pR + limb(legs.z) * 0.235;
  vec2 fR = kR + limb(legs.z + legs.w) * 0.235;
  d = smin(d, sdCap(p, pL, kL, 0.056 * bulk, 0.042 * bulk), k);
  d = smin(d, sdCap(p, kL, fL, 0.041 * bulk, 0.03 * bulk), k);
  d = smin(d, sdCap(p, fL, fL + limb(-(legs.x + legs.y) - 1.35) * 0.055, 0.024, 0.02), 0.02);
  d = smin(d, sdCap(p, pR, kR, 0.056 * bulk, 0.042 * bulk), k);
  d = smin(d, sdCap(p, kR, fR, 0.041 * bulk, 0.03 * bulk), k);
  d = smin(d, sdCap(p, fR, fR + limb(legs.z + legs.w + 1.35) * 0.055, 0.024, 0.02), 0.02);
  return d;
}

// Mask + premultiplied output shared by every scene.
void outColor(vec3 col, vec2 frag) {
  float a = uAlpha;
  if (uShape > 0.5) {
    float R = 0.5 * min(uRes.x, uRes.y);
    float r = length(frag - 0.5 * uRes);
    a *= smoothstep(R, R - 1.5, r);
  }
  col += (hash21(frag + fract(uTime * 7.31) * 113.0) - 0.5) * 0.03; // film grain
  fragColor = vec4(max(col, 0.0) * a, a);
}
