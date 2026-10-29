// ---------------------------------------------------------------------------
// THE NOISE / RISE: seen from above, a crowd stands around a figure that
// fell and is still burning. A shockwave clears the noise, then the figure
// rises as a cold, white-blue light.
// ---------------------------------------------------------------------------
uniform float uZoom;    // camera zoom (1 = wide)
uniform float uTilt;    // oblique camera
uniform float uEmber;   // the burning figure on the ground
uniform float uExplode; // shockwave 0..1
uniform float uRise;    // standing glowing figure
uniform float uPush;    // crowd pushed outwards
uniform float uDesat;   // black & white grade
uniform float uSun;     // close-up radial fire burst (EMBERFALL disc)
uniform float uExpo;    // exposure
uniform vec2 uMouse;

float emberLight(vec2 w) {
  float r = length(w);
  return 1.0 / (1.0 + pow(r / 0.15, 2.0));
}

// Standing people seen from a high oblique camera, in screen space.
// Far side of the fire: lit from the front. Near side: dark, rim-lit.
// Returns the signed distance to the closest person; writes shading + shadow.
float crowd(vec2 uv, float t, float light, out vec3 col, out float shadow) {
  shadow = 0.0;
  col = vec3(0.0);
  float best = 1e5;
  float A = 1.0 + 0.6 * uTilt;
  float den = 1.0 - uTilt * uv.y;
  vec2 g = vec2(uv.x, uv.y * A) / den / uZoom;
  const float CELL = 0.058;
  vec2 gi = floor(g / CELL);
  for (int y = -2; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 id = gi + vec2(float(x), float(y));
      vec2 rnd = hash22(id + 4.7);
      vec2 gp = (id + 0.5 + (rnd - 0.5) * 0.78) * CELL;
      float pr = length(gp);
      float clearing = 0.16 + 0.035 * sin(atan(gp.y, gp.x) * 3.0 + 1.3);
      if (pr < clearing) continue;
      if (hash21(id + 9.3) < 0.14 + 0.22 * smoothstep(0.5, 1.0, pr)) continue;
      vec2 out0 = gp / pr;
      gp += out0 * uPush * (0.09 + 0.08 * rnd.x) * smoothstep(1.2, 0.15, pr);
      gp += 0.0035 * vec2(sin(t * 0.9 + rnd.x * 31.0), cos(t * 0.7 + rnd.y * 17.0));
      // project the feet to the screen
      float Y = gp.y * uZoom;
      float persp = A / (A + uTilt * Y);
      vec2 F = vec2(gp.x * uZoom * persp, Y / (A + uTilt * Y));
      float sc = 0.85 + 0.3 * rnd.y;
      float h = 0.072 * uZoom * persp * sc;
      vec2 q = uv - F;
      // shadow thrown along the ground, away from the fire
      vec2 sdir = normalize(F + 1e-4);
      float sd = sdCap(q, vec2(0.0), sdir * h * (0.6 + 1.2 * pr), 0.12 * h, 0.2 * h);
      shadow = max(shadow, smoothstep(0.004, -0.006, sd) * 0.75);
      if (q.y < -0.15 * h || q.y > 1.3 * h || abs(q.x) > 0.5 * h) continue;
      float lean = (rnd.x - 0.5) * 0.08 * h;
      vec2 qq = q - vec2(lean * q.y / h, 0.0);
      float wide = 0.9 + 0.25 * fract(rnd.y * 5.1);
      float legs = sdCap(qq, vec2(0.0, 0.03 * h), vec2(0.0, 0.42 * h), 0.085 * h * wide, 0.12 * h * wide);
      float torso = sdCap(qq, vec2(0.0, 0.43 * h), vec2(0.0, 0.66 * h), 0.15 * h * wide, 0.2 * h * wide);
      float shoulders = sdCap(qq, vec2(-0.13 * h * wide, 0.68 * h), vec2(0.13 * h * wide, 0.68 * h), 0.07 * h, 0.07 * h);
      float headD = length(qq - vec2(0.0, 0.86 * h)) - 0.095 * h;
      float d = min(smin(smin(legs, torso, 0.06 * h), shoulders, 0.05 * h), headD);
      float raise = step(0.86, fract(rnd.x * 7.3));
      if (raise > 0.5) {
        float sgn = rnd.y > 0.5 ? 1.0 : -1.0;
        d = min(d, sdCap(q, vec2(sgn * 0.14 * h, 0.68 * h), vec2(sgn * 0.26 * h, 1.18 * h), 0.05 * h, 0.04 * h));
      }
      if (d < best) {
        best = d;
        float L = emberLight(gp) * light;
        float far = smoothstep(-0.01, 0.12, F.y);
        vec2 axis = vec2(0.0, clamp(q.y, 0.1 * h, 0.85 * h));
        vec2 n = normalize(q - axis + 1e-5);
        vec2 toFire = normalize(-F + 1e-5);
        float rim = pow(sat(dot(n, toFire)), 2.0);
        vec3 cloth = vec3(0.05, 0.045, 0.05) * (0.6 + 0.8 * rnd.y);
        float pick = fract(rnd.x * 13.7);
        if (pick < 0.12) cloth = vec3(0.42, 0.07, 0.04);
        else if (pick < 0.2) cloth = vec3(0.6, 0.2, 0.07);
        else if (pick < 0.27) cloth = vec3(0.22, 0.22, 0.24);
        float headMask = smoothstep(0.004, -0.004, headD);
        // light falls off down the body: heads and shoulders catch the fire
        float up = smoothstep(0.1 * h, 0.8 * h, q.y);
        vec3 front = mix(cloth, vec3(0.5, 0.3, 0.22), headMask * 0.55) * (0.08 + 1.5 * L * (0.45 + 0.55 * up));
        vec3 back = cloth * (0.05 + 0.22 * L);
        col = mix(back, front, far) + vec3(1.0, 0.5, 0.18) * rim * L * (0.3 + 0.8 * (1.0 - far)) * (0.5 + 0.5 * up);
      }
    }
  }
  return best;
}

float lyingFigure(vec2 p) {
  vec4 arms = vec4(2.35, 0.35, 2.15, -0.25);
  vec4 legs = vec4(0.42, 0.12, 0.32, -0.18);
  return sdHuman(p, arms, legs, 1.08);
}

float standingFigure(vec2 p) {
  vec4 arms = vec4(0.16, 0.06, 0.16, 0.06);
  vec4 legs = vec4(0.05, 0.0, 0.05, 0.0);
  return sdHuman(p, arms, legs, 1.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy - uOffset;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv /= uViewZoom;
  uv = rot(uSpin) * uv;
  vec2 suv = uv;
  uv += uMouse * 0.01;

  // oblique top-down camera
  float den = 1.0 - uTilt * uv.y;
  vec2 w = vec2(uv.x, uv.y * (1.0 + 0.6 * uTilt)) / den / uZoom;
  float r = length(w);
  float light = uEmber + uExplode * (1.0 - uExplode) * 3.0 + uRise * 0.6;

  // ---- ground: ash and dirt, warm near the fire
  float g = fbm(w * 7.0);
  vec3 col = mix(vec3(0.04, 0.026, 0.024), vec3(0.12, 0.07, 0.052), g);
  float Lg = emberLight(w) * light;
  col *= 0.2 + 2.4 * Lg;
  col += vec3(0.5, 0.14, 0.03) * smoothstep(0.62, 0.8, fbm3(w * 16.0)) * Lg * 0.5;

  // ---- crowd
  vec3 pc;
  float sh;
  float ds = crowd(uv, t, light, pc, sh);
  col *= 1.0 - sh * 0.85 * smoothstep(0.0, 0.25, Lg);
  float px = 1.5 / (uRes.y * uViewZoom);
  col = mix(col, pc, smoothstep(px, -px, ds));

  // ---- embers drifting in the heat
  vec2 ep = w * 24.0 + vec2(0.0, t * 0.55);
  vec2 eid = floor(ep);
  vec2 er = hash22(eid);
  vec2 eo = (er - 0.5) * 0.7 + 0.18 * vec2(sin(t * 1.3 + er.x * 20.0), cos(t * 1.1 + er.y * 20.0));
  float ember = smoothstep(0.075, 0.0, length(fract(ep) - 0.5 - eo)) * step(0.74, er.x)
              * (0.5 + 0.5 * sin(t * (3.0 + er.x * 6.0) + er.y * 30.0));
  col += vec3(1.0, 0.55, 0.2) * ember * (0.2 + 2.2 * emberLight(w)) * uEmber;

  // ---- the burning figure
  float fs = 0.12;
  vec2 fp = rot(0.32) * w / fs;
  vec2 warp = vec2(fbm3(fp * 2.6 + vec2(0.0, -t * 2.1)), fbm3(fp * 2.6 + vec2(5.2, -t * 2.4))) - 0.5;
  float fd = lyingFigure(fp + warp * 0.32) * fs;
  float flick = 0.86 + 0.14 * sin(t * 13.0) * sin(t * 7.3);
  float burn = uEmber * (1.0 - uRise * 0.9);
  float flame = fbm3(w * 22.0 - normalize(w + 1e-4) * t * 1.6);
  col += (vec3(1.0, 0.95, 0.78) * smoothstep(0.004, -0.006, fd) * 1.5
        + vec3(1.0, 0.52, 0.14) * exp(-max(fd, 0.0) * 50.0) * (1.0 + flame)
        + vec3(0.9, 0.22, 0.04) * exp(-max(fd, 0.0) * 11.0) * 0.7) * burn * flick;

  // ---- shockwave
  if (uExplode > 0.0) {
    float E = uExplode;
    float R = 0.03 + E * 1.15;
    float rw = 0.012 + 0.05 * E;
    float ring = exp(-pow((r - R) / rw, 2.0)) * (1.0 - E) * 2.2;
    float halo = exp(-pow((r - R * 0.78) / 0.0035, 2.0)) * (1.0 - E) * 1.1;
    vec2 dir = w / max(r, 1e-4);
    float fil = pow(vnoise(dir * 14.0), 2.0) * 0.8 + pow(vnoise(dir * 33.0), 3.0) * 0.7;
    float fire = fbm(w * 10.0 - dir * t * 0.8);
    float disc = smoothstep(R, R * 0.5, r);
    float flash = 1.0 - smoothstep(0.0, 0.55, E);
    col += mix(vec3(0.9, 0.28, 0.04), vec3(1.0, 0.86, 0.55), fire) * disc * (1.0 - E) * (0.9 + 1.4 * fil) * 1.5
         + vec3(1.0, 0.58, 0.24) * ring + vec3(1.0, 0.82, 0.62) * halo
         + vec3(1.0, 0.95, 0.86) * flash * exp(-r * r / 0.025) * 3.0;
  }

  // ---- close-up radial fire (record disc for EMBERFALL)
  if (uSun > 0.0) {
    float sr = length(suv);
    vec2 dir = suv / max(sr, 1e-4);
    float f1 = fbm3(vec2(atan(dir.y, dir.x) * 7.0 / PI, sr * 3.0 - t * 0.7));
    float f2 = vnoise(dir * 22.0 + vec2(t * 0.1));
    float fil = pow(f1, 2.0) * 1.4 + pow(f2, 4.0) * 1.2;
    vec3 sun = vec3(1.0, 0.45, 0.08) * fil * smoothstep(0.62, 0.05, sr) * 1.8
             + vec3(1.0, 0.85, 0.6) * exp(-sr * sr / 0.006) * 2.5
             + vec3(0.5, 0.08, 0.02) * smoothstep(0.7, 0.2, sr);
    col = mix(col, sun, uSun);
  }

  // ---- the riser: a standing figure of cold light
  if (uRise > 0.0) {
    float rs = 0.17 / uZoom;
    vec2 rp = (suv - vec2(0.0, 0.02)) / rs;
    float rd = standingFigure(rp) * rs;
    col += (vec3(0.88, 0.96, 1.0) * smoothstep(0.003, -0.004, rd) * 1.6
          + vec3(0.4, 0.7, 1.0) * exp(-max(rd, 0.0) * 60.0) * 1.1
          + vec3(1.0, 0.5, 0.2) * exp(-max(rd, 0.0) * 11.0) * 0.45) * uRise;
  }

  // warm out-of-focus glow at the frame edges
  col += vec3(0.24, 0.06, 0.035) * smoothstep(0.3, 0.95, abs(suv.x)) * (1.0 - smoothstep(0.1, 0.6, abs(suv.y))) * 0.35;

  // the shot is framed on the circle: sides fall into darkness
  col *= mix(1.0, 0.28, smoothstep(0.32, 0.85, abs(suv.x)));
  col = aces(col * uExpo);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(smoothstep(0.02, 0.85, lum)) * vec3(1.0, 0.985, 0.96), uDesat);
  col *= 1.0 - 0.5 * dot(suv * vec2(0.7, 1.0), suv * vec2(0.7, 1.0));
  outColor(col, frag);
}
