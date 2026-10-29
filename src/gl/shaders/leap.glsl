// ---------------------------------------------------------------------------
// THE LEAP: a figure tumbling down a shaft of golden light. Sparks and
// streaks rush upward, ribbons of light spiral around the beam, then the
// light "gets louder" into a god-ray burst and finally whites out (IMPACT).
// ---------------------------------------------------------------------------
uniform float uFall;    // accumulated fall distance (scroll + time)
uniform float uTilt;    // beam tilt (diagonal in the hero, vertical later)
uniform float uBeam;    // beam intensity
uniform float uWidth;   // beam width multiplier
uniform float uShaft;   // streaking shaft walls
uniform float uSpark;   // sparks
uniform float uRib;     // spiral ribbons
uniform float uBurst;   // god-ray burst
uniform float uWhite;   // white-out
uniform float uFig;     // figure visibility
uniform float uSpinFig; // extra tumble
uniform float uSpill;   // light spilling over the right half (hero)
uniform vec2 uMouse;

float sparkLayer(vec2 uv, float scale, float speed, float density, float seed) {
  vec2 p = vec2(uv.x, uv.y - uFall * speed) * scale;
  vec2 id = floor(p);
  vec2 f = fract(p) - 0.5;
  vec2 r = hash22(id + seed);
  if (r.x > density) return 0.0;
  vec2 o = (hash22(id * 1.73 + seed * 3.1) - 0.5) * 0.6;
  vec2 q = f - o;
  q.y *= 0.2 + 0.25 * r.y; // motion streak
  return smoothstep(0.075, 0.0, length(q)) * (0.35 + 0.65 * r.y);
}

float fallingFigure(vec2 p, float t) {
  vec4 arms = vec4(2.45 + 0.35 * sin(t * 1.9), 0.45 + 0.4 * sin(t * 2.7 + 1.0),
                   2.05 + 0.45 * sin(t * 1.6 + 2.0), 0.65 + 0.5 * sin(t * 2.2));
  vec4 legs = vec4(0.5 + 0.3 * sin(t * 1.4 + 0.5), -0.95 + 0.35 * sin(t * 1.8),
                   0.1 + 0.35 * sin(t * 1.2 + 2.4), -0.55 + 0.4 * sin(t * 2.0 + 1.3));
  return sdHuman(p, arms, legs, 1.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy - uOffset;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv /= uViewZoom;
  uv = rot(uSpin) * uv;
  uv /= 1.0 + uBurst * 0.18;
  uv += uMouse * 0.012;

  // beam axis drifts gently and tilts
  float bx = 0.015 + uTilt * uv.y + 0.012 * sin(uv.y * 2.0 + t * 0.4);
  float d = uv.x - bx;
  float W = max(uWidth, 0.2);

  // ---- background: dark umber left, hazy mustard right
  float side = smoothstep(-0.7, 0.95, uv.x + 0.25 * uv.y);
  vec3 col = mix(vec3(0.045, 0.024, 0.01), vec3(0.2, 0.13, 0.035), side * side);
  col += vec3(0.42, 0.27, 0.06) * smoothstep(-0.05, 0.8, d) * smoothstep(1.4, 0.2, d) * uSpill;
  col *= 0.8 + 0.35 * fbm3(vec2(uv.x * 2.0, uv.y * 1.2 + uFall * 0.15));
  col += vec3(0.5, 0.27, 0.05) * exp(-d * d / (0.16 * W * W)) * 0.5 * uBeam;

  // ---- the beam
  float streakA = fbm3(vec2(d * 36.0 / W, uv.y * 1.1 + uFall * 2.4));
  float streakB = vnoise(vec2(d * 95.0 / W, uv.y * 0.55 + uFall * 3.8));
  float core = exp(-d * d / pow(0.03 * W, 2.0));
  float mid = exp(-d * d / pow(0.1 * W, 2.0));
  float outer = exp(-d * d / pow(0.22 * W, 2.0));
  vec3 beam = vec3(1.0, 0.42, 0.06) * outer * 0.7
            + vec3(1.0, 0.66, 0.2) * mid * (0.55 + 0.75 * streakA)
            + vec3(1.0, 0.94, 0.8) * core * (1.0 + 1.7 * streakB);
  col += beam * uBeam * 1.15;

  // ---- shaft walls: dashed light streaks racing upward on both sides
  float lanes = 0.0;
  for (int k = 0; k < 2; k++) {
    float sgn = k == 0 ? -1.0 : 1.0;
    float lx = d * sgn - 0.13 * W;
    float cw = 0.011;
    float cx = floor(lx / cw);
    float fx = fract(lx / cw) - 0.5;
    float rnd = hash11(cx * 7.13 + sgn * 3.1);
    float yy = uv.y * (1.4 + rnd * 2.2) - uFall * (2.6 + rnd * 3.4) + rnd * 13.0;
    float dash = smoothstep(0.55, 0.92, vnoise(vec2(cx * 3.7, yy)));
    lanes += dash * exp(-fx * fx * 30.0) * smoothstep(0.0, 0.02, lx) * exp(-lx * 16.0) * (0.3 + rnd) * step(0.45, rnd);
  }
  col += vec3(1.0, 0.66, 0.24) * lanes * uShaft * 1.3;

  // ---- sparks (dense near the beam, a few everywhere)
  float sp = sparkLayer(uv, 30.0, 1.9, 0.33, 1.0)
           + sparkLayer(uv, 15.0, 1.3, 0.22, 7.0) * 0.9
           + sparkLayer(uv, 55.0, 2.6, 0.3, 13.0) * 0.6;
  sp *= 0.25 + 0.75 * exp(-d * d / 0.03);
  col += vec3(1.0, 0.78, 0.42) * sp * uSpark * 1.8;

  // ---- spiral ribbons of light wrapping the beam
  float rib = 0.0;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float freq = 1.25 + fk * 0.35;
    float amp = (0.085 + 0.03 * fk) * W;
    float arg = (uv.y - uFall * 0.32) * freq * TAU + t * 1.1 + fk * 2.1;
    float slope = amp * cos(arg) * freq * TAU;
    float norm = inversesqrt(1.0 + slope * slope);
    float depth = cos(arg);
    float w = 0.003 + 0.006 * (0.5 + 0.5 * depth);
    for (int s = 0; s < 3; s++) {
      float off = float(s) * 0.009;
      float dd = abs(uv.x - (bx + (amp + off) * sin(arg + off * 9.0))) * norm;
      rib += (exp(-dd * dd / (w * w)) * 1.2 + exp(-dd / (w * 6.0)) * 0.35)
           * mix(0.12, 1.0, smoothstep(-0.6, 0.8, depth)) * (s == 0 ? 1.0 : 0.55);
    }
  }
  col += vec3(1.0, 0.78, 0.42) * rib * uRib * 1.15;

  // ---- the falling figure
  vec2 fc = vec2(bx, 0.0) + vec2(0.012 * sin(t * 0.6), 0.014 * sin(t * 0.83));
  float fs = 0.13;
  float ang = 2.75 + 0.35 * sin(t * 0.45) + uSpinFig;
  vec2 fp = rot(-ang) * (uv - fc) / fs;
  float fd = fallingFigure(fp, t) * fs;
  float px = 1.6 / (uRes.y * uViewZoom);
  float fig = smoothstep(px, -px, fd) * uFig;
  float rim = exp(-max(fd, 0.0) / 0.0035) * (1.0 - fig) * uFig;
  col = mix(col, vec3(0.06, 0.03, 0.012), fig);
  col += vec3(1.0, 0.72, 0.32) * rim * 0.35 * uBeam;

  // ---- god-ray burst from the figure
  vec2 bd = uv - fc;
  float br = length(bd);
  vec2 dir = bd / max(br, 1e-4);
  float n1 = vnoise(dir * 5.0 + vec2(t * 0.05, 0.0));
  float n2 = vnoise(dir * 13.0 - vec2(0.0, t * 0.07));
  float rays = pow(n1, 5.0) * 2.8 + pow(n2, 8.0) * 2.8;
  float reach = 0.1 + uBurst * 1.1;
  float burst = rays * exp(-br / reach) * smoothstep(0.0, 0.04, br)
              + exp(-br * br / (0.008 + 0.05 * uBurst)) * 1.3;
  col *= 1.0 - 0.6 * uBurst * (1.0 - exp(-br * 2.5));
  col += vec3(1.0, 0.68, 0.3) * burst * uBurst * 2.1;

  col = aces(col);

  // vignette (fades away with the white-out)
  float vig = 1.0 - 0.5 * dot(uv * vec2(0.75, 1.0), uv * vec2(0.75, 1.0));
  col *= mix(vig, 1.0, uWhite);

  // ---- white-out: cream paper with faint bluish rays (IMPACT background)
  vec3 paper = mix(vec3(0.965, 0.958, 0.93), vec3(0.86, 0.82, 0.66), smoothstep(0.25, 1.0, length(uv * vec2(0.8, 1.0))));
  paper += vec3(-0.07, -0.02, 0.05) * rays * exp(-br / 0.9) * 0.6;
  col = mix(col, paper, uWhite);

  outColor(col, frag);
}
