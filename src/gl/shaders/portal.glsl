// ---------------------------------------------------------------------------
// THE PORTAL: storm clouds part above dark mountains, a slit of red light
// opens into a doorway, lightning crawls out of its edges and a figure in a
// suit walks through it towards the camera.
// ---------------------------------------------------------------------------
uniform float uOpen;    // 0..1 slit grows then widens into a door
uniform float uHalo;    // thin arch outline around the door
uniform float uFlare;   // anamorphic lens flare
uniform float uBolt;    // lightning
uniform float uWalk;    // 0..1 figure walking towards camera
uniform float uFigure;  // figure visibility
uniform float uZoom;    // camera push-in
uniform float uGlow;    // how much the door lights the world
uniform vec2 uMouse;

const vec2 DOOR = vec2(0.0, -0.33);
const float DOOR_H = 0.5;

float sdArch(vec2 p, float w, float h) {
  float hb = max(h - w, 0.0);
  float b = sdBox(p - vec2(0.0, hb * 0.5), vec2(w, hb * 0.5));
  float c = length(p - vec2(0.0, hb)) - w;
  return min(b, c);
}

float gapHalf(float y) { return mix(0.035, 0.5, smoothstep(-0.46, 0.32, y)); }

// > 0 inside a cloud bank. Billowed noise gives rounded cumulus lobes.
float cloudField(vec2 w, float t) {
  vec2 q = w + vec2(t * 0.005, 0.0);
  float b1 = billow(q * 2.4 + 1.7);
  float b2 = billow(q * 6.0 + 7.3);
  float lobes = (0.42 - b1) * 0.3 + (0.42 - b2) * 0.08;
  float sideL = -w.x - gapHalf(w.y) + lobes;
  float sideR = (w.x - 0.04) - gapHalf(w.y + 0.08) + lobes;
  float side = max(sideL, sideR);
  float top = min(-0.09 + 0.36 * abs(w.x), 0.17) - w.y + lobes * 1.4;
  return min(side, top);
}

// One jagged bolt from a towards b; flickers in discrete steps.
float bolt(vec2 p, vec2 a, vec2 b, float seed, float t) {
  vec2 ab = b - a;
  float L = length(ab);
  vec2 dir = ab / L;
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 ap = p - a;
  float s = dot(ap, dir) / L;
  float h = dot(ap, nrm);
  if (s < -0.02 || s > 1.02 || abs(h) > 0.22 * L + 0.02) return 0.0;
  float st = floor(t * 9.0);
  float off = (fbm3(vec2(s * 5.0, seed + st * 0.23)) - 0.5) * 0.42 * L
            + (vnoise(vec2(s * 34.0, seed * 3.1 + st)) - 0.5) * 0.018;
  float d = abs(h - off);
  float taper = smoothstep(1.02, 0.15, s) * smoothstep(-0.02, 0.04, s);
  return (exp(-d * 420.0) * 1.2 + exp(-d * 55.0) * 0.18) * taper;
}

float lightning(vec2 w, float t, float amount, float doorW) {
  float acc = 0.0;
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float side = mod(fi, 2.0) < 0.5 ? -1.0 : 1.0;
    float hgt = hash11(fi * 3.7) * 0.42;
    vec2 a = DOOR + vec2(side * doorW, 0.04 + hgt);
    float ang = side * (0.35 + hash11(fi * 5.3) * 1.35) + (hash11(fi * 1.9) - 0.5) * 0.6;
    float len = (0.12 + hash11(fi * 9.1) * 0.5) * amount;
    vec2 b = a + vec2(sin(ang), cos(ang)) * len;
    acc += bolt(w, a, b, fi * 11.0, t + fi * 0.37);
    // a branch from the middle of every bolt
    vec2 m = mix(a, b, 0.45);
    vec2 c = m + vec2(sin(ang + side * 0.7), cos(ang + side * 0.7)) * len * 0.45;
    acc += bolt(w, m, c, fi * 17.0 + 3.0, t + fi) * 0.7;
  }
  return acc;
}

// A developer in a hoodie, hood up. strings = distance to the drawstrings.
float sdHoodie(vec2 p, float phase, out float strings) {
  float sw = sin(phase);
  vec4 arms = vec4(0.075 + 0.05 * sw, 0.09, 0.075 - 0.05 * sw, 0.09);
  vec4 legs = vec4(0.045 + 0.035 * sw, -0.07 * max(0.0, sw), 0.045 - 0.035 * sw, -0.07 * max(0.0, -sw));
  float d = sdHuman(p, arms, legs, 1.1);
  // boxy, slightly baggy body with a ribbed hem
  float body = sdBox(p - vec2(0.0, 0.125), vec2(0.102, 0.168)) - 0.026;
  d = smin(d, body, 0.04);
  // the hood: a rounded cowl over the head, flowing into the shoulders
  vec2 hp = p - vec2(0.0, 0.448);
  hp.y *= hp.y > 0.0 ? 0.9 : 1.0;
  float hood = length(hp * vec2(0.92, 0.86)) - 0.076;
  hood = smin(hood, sdBox(p - vec2(0.0, 0.37), vec2(0.064, 0.05)) - 0.02, 0.045);
  d = smin(d, hood, 0.03);
  vec2 sp = vec2(abs(p.x) - 0.024, p.y);
  strings = sdSeg(sp, vec2(0.0, 0.372), vec2(0.004, 0.262));
  return d;
}

void main() {
  vec2 frag = gl_FragCoord.xy - uOffset;
  vec2 suv = (frag - 0.5 * uRes) / uRes.y;
  float t = uTime;
  vec2 uv = rot(uSpin) * (suv / uViewZoom) + uMouse * 0.01;

  // ---- figure placement (also drives the camera)
  float walk = uWalk;
  float figH = mix(0.21, 1.05, walk * walk);
  float footY = mix(DOOR.y + 0.004, -0.92, smoothstep(0.08, 1.0, walk));
  vec2 pelvis = vec2(0.0, footY + 0.49 * figH);
  vec2 headW = pelvis + vec2(0.0, 0.44 * figH);

  float Z = max(uZoom, 1.0);
  float k = sat((Z - 1.0) / 1.6);
  vec2 anchor = mix(headW, vec2(0.0, 0.1), k);
  vec2 w = headW + (uv - anchor) / Z;

  // ---- sky: near black, a red glow pooling behind the gap
  vec2 lightPos = DOOR + vec2(0.0, 0.22);
  vec3 col = mix(vec3(0.05, 0.035, 0.04), vec3(0.016, 0.015, 0.02), smoothstep(-0.15, 0.45, w.y));
  float lp = exp(-length((w - lightPos) * vec2(1.6, 0.95)) * 3.2);
  col += vec3(0.6, 0.12, 0.09) * lp * (0.15 + 0.85 * uGlow);
  col += vec3(0.07, 0.03, 0.03) * fbm3(w * 3.0 + vec2(t * 0.01, 0.0)) * smoothstep(0.0, 0.5, w.y);

  // ---- cumulus banks
  float f0 = cloudField(w, t);
  float dens = smoothstep(-0.006, 0.03, f0);
  if (dens > 0.0) {
    vec2 Ld = normalize(lightPos - w + vec2(0.0, 0.05));
    float fl = cloudField(w + Ld * 0.03, t);
    float fu = cloudField(w + vec2(0.0, 0.03), t);
    float litDoor = sat((f0 - fl) * 9.0 + 0.2);
    float litSky = sat((f0 - fu) * 9.0 + 0.25);
    float depth = sat(f0 * 6.0);
    float prox = exp(-length((w - lightPos) * vec2(0.9, 0.8)) * 2.4);
    vec3 cloud = vec3(0.045, 0.048, 0.07) * (1.0 - depth * 0.4);
    cloud += vec3(0.36, 0.38, 0.5) * litSky * (0.35 + 0.65 * smoothstep(-0.2, 0.2, w.y)) * (1.0 - prox * 0.5);
    cloud += vec3(1.0, 0.4, 0.4) * litDoor * prox * (0.35 + 1.9 * uGlow);
    cloud += vec3(1.0, 0.75, 0.72) * pow(litDoor, 4.0) * prox * prox * 1.2 * uGlow;
    col = mix(col, cloud, dens);
  }

  // ---- jagged mountains, lower in the middle
  float x = w.x;
  float ridge = -0.44 + 0.13 * smoothstep(0.08, 0.6, abs(x))
              + 0.085 * (1.0 - abs(vnoise(vec2(x * 4.0, 3.3)) * 2.0 - 1.0))
              + 0.04 * (1.0 - abs(vnoise(vec2(x * 11.0, 8.1)) * 2.0 - 1.0))
              + 0.012 * vnoise(vec2(x * 40.0, 1.0));
  float mtn = smoothstep(0.002, -0.002, w.y - ridge);
  vec3 mcol = vec3(0.01, 0.01, 0.015) + vec3(0.4, 0.1, 0.08) * exp(-abs(x) * 6.0) * smoothstep(-0.05, 0.0, w.y - ridge) * uGlow * 0.4;
  col = mix(col, mcol, mtn);

  // ---- the door of light
  float open = uOpen;
  float on = step(0.001, open);
  float grow = smoothstep(0.0, 0.35, open);
  float width = mix(0.0016, 0.08, smoothstep(0.3, 1.0, open));
  float hNow = max(DOOR_H * grow, width * 2.0);
  vec2 dp = w - DOOR - vec2(0.0, (DOOR_H - hNow) * 0.55);
  float jag = (fbm3(vec2(atan(dp.y - 0.25, dp.x) * 7.0, floor(t * 9.0) * 0.4)) - 0.5) * 0.05 * uBolt;
  float dd = sdArch(dp, width, hNow) + jag;
  float inside = smoothstep(0.0025, -0.0025, dd) * on;
  vec3 core = mix(vec3(1.0, 0.45, 0.24), vec3(0.88, 0.94, 1.0), smoothstep(-0.002, -0.025 - width * 0.4, dd));
  col = mix(col, core * 1.55, inside);
  col += vec3(1.0, 0.33, 0.16) * exp(-max(dd, 0.0) * 32.0) * on * (0.5 + 0.7 * grow);
  col += vec3(1.0, 0.24, 0.18) * exp(-max(dd, 0.0) * 5.5) * 0.28 * uGlow;
  col += vec3(1.0, 0.86, 0.9) * (exp(-abs(dd) * 170.0) * 1.6 + exp(-abs(dd) * 40.0) * 0.25) * uBolt;

  // ---- arch halo
  float hd = sdArch(w - DOOR - vec2(0.0, -0.03), 0.165, DOOR_H * 1.12 + 0.07);
  col += vec3(1.0, 0.62, 0.55) * (exp(-abs(hd) * 420.0) * 0.55 + exp(-abs(hd) * 60.0) * 0.08) * uHalo;

  // ---- lightning
  if (uBolt > 0.0) {
    float lt = lightning(w, t, uBolt, width);
    col += vec3(1.0, 0.68, 0.74) * lt * uBolt * (1.0 - inside) * 1.4;
  }

  // ---- the figure
  if (uFigure > 0.0) {
    float phase = walk * 19.0;
    vec2 fp = (w - pelvis) / figH;
    fp.y -= 0.012 * abs(sin(phase));
    float strings;
    float fd = sdHoodie(fp, phase, strings) * figH;
    float px = 1.6 / (uRes.y * Z * uViewZoom);
    float body = smoothstep(px, -px, fd) * uFigure;
    float rim = exp(-max(fd, 0.0) * mix(260.0, 120.0, walk)) * (1.0 - body) * uFigure;
    float front = smoothstep(0.25, 0.9, walk);
    // the face sits in the shadow of the hood; its opening catches a little light
    float face = length((fp - vec2(0.0, 0.43)) * vec2(1.0, 0.78)) - 0.046;
    float opening = exp(-abs(face) * 90.0) * front * 0.05;
    vec3 cloth = vec3(0.022, 0.022, 0.028) + vec3(0.9, 0.62, 0.6) * opening
               + vec3(0.32, 0.3, 0.3) * smoothstep(0.0065, 0.002, strings) * front * 0.6;
    cloth = mix(cloth, vec3(0.012, 0.011, 0.014), smoothstep(0.004, -0.004, face) * 0.8);
    col = mix(col, cloth, body);
    col += vec3(1.0, 0.84, 0.84) * rim * (0.5 + 0.6 * uGlow);
  }

  // ---- lens flare
  vec2 fc = DOOR + vec2(0.0, DOOR_H * 0.46);
  vec2 fq = w - fc;
  float streak = exp(-abs(fq.y) * 140.0) * exp(-abs(fq.x) * 2.2);
  float star = exp(-abs(fq.x) * 90.0) * exp(-abs(fq.y) * 4.5) + exp(-abs(fq.y) * 90.0) * exp(-abs(fq.x) * 4.5);
  vec2 rq = rot(0.785) * fq;
  star += (exp(-abs(rq.x) * 160.0) * exp(-abs(rq.y) * 9.0) + exp(-abs(rq.y) * 160.0) * exp(-abs(rq.x) * 9.0)) * 0.5;
  float bloom = exp(-dot(fq, fq) * 24.0);
  float gh = 0.0;
  for (int i = 1; i <= 3; i++) {
    float fi = float(i);
    vec2 gp = fc + vec2(0.17 * fi + 0.05, -0.025 * fi);
    gh += smoothstep(0.014, 0.0, length(w - gp) - 0.012 * fi) * (0.28 / fi);
  }
  col += (vec3(1.0, 0.7, 0.62) * streak + vec3(1.0, 0.9, 0.86) * star * 0.8
        + vec3(1.0, 0.48, 0.4) * bloom * 0.9 + vec3(0.62, 0.42, 1.0) * gh) * uFlare;

  col = aces(col * 1.05);
  col *= 1.0 - 0.45 * dot(suv * vec2(0.7, 1.0), suv * vec2(0.7, 1.0));
  outColor(col, frag);
}
