import { el, clamp, lerp, range, smooth, expoOut, easeInOut } from '../lib/util.js'

/**
 * Motion graphics for the records in Selected Work, drawn on a 2D canvas: what each venture does,
 * in its colour. Each one opens when its case arrives (t counts from then) and then loops.
 *
 * - `nest` (Webnestle, a web agency): a website builds itself in a nest woven from golden threads.
 *   The outlines draw on, the text types out, the picture wipes in and the cards rise; the phone
 *   version springs in, the cursor clicks publish, it deploys and goes LIVE, then the page scrolls
 *   away for the next build.
 * - `deals` (LootDost, a deal-finding community): a radar boots up and sweeps the shops. Each deal it
 *   finds pings and its price ticks down, then a spark carries it to the % in the middle (which
 *   bounces and flips) and out to one of the friends around it (+1).
 *
 * Everything is drawn in device pixels around the centre of the circle (u = its radius).
 */

const TAU = Math.PI * 2
const DISPLAY = '"Archivo Variable", "Archivo", "Helvetica Neue", Arial, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace'

// steady pseudo-random 0..1, so the artwork is the same on every visit
const rand = (i) => {
  const s = Math.sin(i * 91.345 + 7.13) * 43758.5453
  return s - Math.floor(s)
}
const hex = (c) => {
  const n = parseInt(c.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}
const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`
// overshoots a little and settles: things that pop into place
const backOut = (t, s = 1.8) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2)
// a damped wobble after an event `age` seconds ago (0 at the moment it happens)
const bounce = (age, amount, freq = 16, decay = 5) => (age < 0 || age > 2 ? 0 : amount * Math.exp(-age * decay) * Math.sin(age * freq))
// mix of two colours (0: a, 1: b)
const mix = (a, b, k) => a.map((v, i) => Math.round(lerp(v, b[i], k)))
// a point on a quadratic curve from a to b that bows out by `bow` (fraction of its length)
const curve = (a, b, bow, e) => {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bow
  const my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bow
  const i = 1 - e
  return [i * i * a[0] + 2 * i * e * mx + e * e * b[0], i * i * a[1] + 2 * i * e * my + e * e * b[1]]
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) return ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2))
  r = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// a small tile of film grain, shared by every artwork
let grainTile = null
function grain() {
  if (grainTile) return grainTile
  const c = document.createElement('canvas')
  c.width = c.height = 96
  const g = c.getContext('2d')
  const img = g.createImageData(96, 96)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 22
  }
  g.putImageData(img, 0, 0)
  return (grainTile = c)
}

/* -------------------------------------------------------------------------------------------------
   Webnestle: a website builds itself in a nest woven from the web
   ------------------------------------------------------------------------------------------------- */
function nest(color) {
  const C = hex(color)
  const PALE = [255, 228, 168]
  const DARK = [26, 18, 6]
  const strands = Array.from({ length: 30 }, (_, i) => ({
    i,
    rx: 0.7 + rand(i) * 0.2,
    tilt: (rand(i + 40) - 0.5) * 0.42,
    a0: rand(i + 80) * TAU,
    span: 1.6 + rand(i + 120) * 2.2,
    speed: (rand(i + 160) - 0.5) * 0.36,
    alpha: 0.14 + rand(i + 200) * 0.4,
    w: 0.6 + rand(i + 240) * 1.1,
    ph: rand(i + 280) * TAU,
  }))
  const T = 9 // one build, seconds
  // when each step of a build starts (seconds into it)
  const S = { wire: 0.35, fill: 1.45, phone: 3.25, cursor: 3.8, click: 4.85, live: 5.35, out: 8.1 }

  // the page inside the window, in units of the circle's radius: x, y, w, h
  const page = {
    nav: [-0.44, -0.27, 0.13, 0.026],
    links: [0.16, -0.27, 0.28, 0.026],
    head1: [-0.44, -0.205, 0.5, 0.05],
    head2: [-0.44, -0.14, 0.36, 0.05],
    sub: [-0.44, -0.075, 0.4, 0.022],
    button: [-0.44, -0.035, 0.17, 0.045],
    image: [0.1, -0.205, 0.34, 0.215],
    cards: [-0.44, -0.145, 0.15].map((x) => [x, 0.05, 0.28, 0.19]),
  }
  const parts = [page.nav, page.links, page.head1, page.head2, page.sub, page.button, page.image, ...page.cards]
  const BUTTON = [page.button[0] + page.button[2] / 2, page.button[1] + page.button[3] / 2]
  const sparks = Array.from({ length: 12 }, (_, i) => ({ a: (i / 12) * TAU + rand(i + 300) * 0.4, d: 0.1 + rand(i + 330) * 0.12 }))

  // one thread of the nest (an ellipse arc), drawn where it is on the near or the far side
  const thread = (ctx, u, s, t, cx, cy, near, from, to) => {
    const rx = s.rx * (1 + 0.025 * Math.sin(t * 0.7 + s.ph))
    const ry = rx * 0.34
    const tilt = s.tilt + 0.05 * Math.sin(t * 0.45 + s.ph)
    const ct = Math.cos(tilt)
    const st = Math.sin(tilt)
    const steps = Math.max(4, Math.ceil((to - from) * 9))
    let drawing = false
    for (let k = 0; k <= steps; k++) {
      const th = from + ((to - from) * k) / steps
      if (Math.sin(th) > 0 !== near) {
        drawing = false
        continue
      }
      const ex = Math.cos(th) * rx
      const ey = Math.sin(th) * ry
      const x = (cx + ex * ct - ey * st) * u
      const y = (cy + ex * st + ey * ct) * u
      drawing ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      drawing = true
    }
  }
  // the nest: threads weave in one after another when it opens, and a light runs round it (brighter
  // once the site is live)
  const weave = (ctx, u, px, t, near, cx, cy, grow, flash) => {
    const P = t * 1.3
    for (const s of strands) {
      const g = smooth(clamp(grow * 1.7 - (s.i / strands.length) * 0.7))
      if (g <= 0) continue
      const a = s.a0 + t * s.speed
      const span = s.span * g
      ctx.beginPath()
      thread(ctx, u, s, t, cx, cy, near, a, a + span)
      ctx.strokeStyle = rgba(near ? PALE : C, s.alpha * (near ? 0.9 : 0.6))
      ctx.lineWidth = s.w * px
      ctx.stroke()
      const d = (((P - a) % TAU) + TAU) % TAU
      if (d < span) {
        ctx.beginPath()
        thread(ctx, u, s, t, cx, cy, near, a + Math.max(0, d - 0.4), a + Math.min(span, d + 0.4))
        ctx.strokeStyle = rgba(PALE, (0.22 + 0.6 * flash) * (near ? 1 : 0.6))
        ctx.lineWidth = s.w * 1.5 * px
        ctx.stroke()
      }
    }
  }

  // a part of the page drawn on as a dashed outline, wiping in from the left
  const wire = (ctx, u, px, [x, y, w, h], e, a) => {
    if (e <= 0 || a <= 0) return
    ctx.save()
    ctx.beginPath()
    ctx.rect((x - 0.01) * u, (y - 0.01) * u, (w + 0.02) * e * u, (h + 0.02) * u)
    ctx.clip()
    roundRect(ctx, x * u, y * u, w * u, h * u, 0.012 * u)
    ctx.setLineDash([3 * px, 3 * px])
    ctx.strokeStyle = rgba(C, 0.55 * a)
    ctx.lineWidth = px
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }
  // a bar that grows from the left like text being typed, with a caret while it grows
  const bar = (ctx, u, px, [x, y, w, h], e, color, caret, a = 1) => {
    if (e <= 0 || a <= 0) return
    const ww = Math.max(h, w * expoOut(e))
    roundRect(ctx, x * u, y * u, ww * u, h * u, Math.min(0.012, h / 2) * u)
    ctx.fillStyle = color
    ctx.globalAlpha = clamp(e * 3) * a
    ctx.fill()
    if (caret && e < 1) {
      ctx.fillStyle = rgba(PALE, 0.9)
      ctx.fillRect((x + ww + 0.008) * u, (y - 0.004) * u, 1.5 * px, (h + 0.008) * u)
    }
    ctx.globalAlpha = 1
  }
  // a line of terminal text typed out one character at a time
  const typed = (ctx, u, text, e, x, y, a) => {
    if (a <= 0 || e <= 0) return
    const n = Math.ceil(text.length * clamp(e))
    ctx.font = `500 ${(0.046 * u).toFixed(1)}px ${MONO}`
    ctx.textAlign = 'left'
    ctx.fillStyle = rgba(C, 0.75 * a)
    const shown = text.slice(0, n)
    ctx.fillText(shown, x * u, y * u)
    if (e < 1.15) {
      const w = ctx.measureText(shown).width
      ctx.fillRect(x * u + w + 0.008 * u, (y - 0.024) * u, 0.022 * u, 0.046 * u)
    }
  }

  return (ctx, t, { u, px, mx, my }) => {
    const c = t % T // seconds into this build
    const open = smooth(clamp(t / 1.1)) // the very first moments: the window and the nest appear
    const step = (at, len) => clamp((c - at) / len)
    const live = smooth(step(S.live, 0.35))
    const out = smooth(step(S.out, T - S.out))
    const flash = live * (1 - out)

    // warm dark ground, lit from inside the nest
    const bg = ctx.createRadialGradient(0, 0.08 * u, 0, 0, 0.08 * u, u * 1.05)
    bg.addColorStop(0, rgba(C, (0.24 + flash * 0.14) * open + 0.04))
    bg.addColorStop(0.5, rgba(C, 0.07))
    bg.addColorStop(1, '#050302')
    ctx.fillStyle = bg
    ctx.fillRect(-u, -u, 2 * u, 2 * u)

    const cx = mx * 0.03
    const cy = 0.2 + my * 0.02
    const grow = clamp(t / 1.6)
    weave(ctx, u, px, t, false, cx, cy, grow, flash)

    // two code marks drift round the nest
    ctx.font = `500 ${(0.05 * u).toFixed(1)}px ${MONO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ;['</>', '{ }'].forEach((tok, i) => {
      const a = i * Math.PI + t * 0.16
      ctx.fillStyle = rgba(C, (0.2 + 0.15 * Math.sin(t * 0.8 + i * 1.7) ** 2) * open)
      ctx.fillText(tok, (Math.cos(a) * 0.78 + mx * 0.05) * u, (Math.sin(a) * 0.3 + 0.32 + my * 0.04) * u)
    })

    // the terminal: building, then deployed
    const deployed = smooth(step(S.live + 0.15, 0.3))
    typed(ctx, u, '$ npm run build', step(0.1, 1.0), -0.54, -0.62, open * (1 - deployed))
    typed(ctx, u, '> deployed · 200 OK', step(S.live + 0.25, 0.8), -0.54, -0.62, deployed * (1 - out))
    ctx.textAlign = 'center'

    // the window floats a little and leans towards the cursor; it opens from slightly smaller
    ctx.save()
    ctx.translate((-0.03 + mx * 0.04) * u, (-0.05 + Math.sin(t * 0.9) * 0.012 + my * 0.03) * u)
    ctx.rotate(-0.035 + mx * 0.03)
    const sc = 1.12 * lerp(0.92, 1, expoOut(clamp(t / 0.9)))
    ctx.scale(sc, sc)

    // light behind it once the site is live
    if (flash > 0) {
      const halo = ctx.createRadialGradient(0, -0.05 * u, 0, 0, -0.05 * u, 0.78 * u)
      halo.addColorStop(0, rgba(C, 0.38 * flash))
      halo.addColorStop(1, rgba(C, 0))
      ctx.fillStyle = halo
      ctx.fillRect(-u, -u, 2 * u, 2 * u)
    }

    // the frame: its border draws itself round when the window first opens
    const W = [-0.5, -0.4, 1.0, 0.67]
    roundRect(ctx, W[0] * u, W[1] * u, W[2] * u, W[3] * u, 0.05 * u)
    ctx.globalAlpha = open
    ctx.fillStyle = 'rgba(16, 11, 5, 0.94)'
    ctx.fill()
    ctx.globalAlpha = 1
    const perim = 2 * (W[2] + W[3]) * u
    ctx.setLineDash([perim * expoOut(clamp(t / 1.0)), perim])
    ctx.strokeStyle = rgba(C, 0.5 + flash * 0.4)
    ctx.lineWidth = 1.2 * px
    ctx.stroke()
    ctx.setLineDash([])
    // its bar: the three dots pop in, the address, and the deploy running along the bottom edge
    ;[0.6, 0.4, 0.25].forEach((a, i) => {
      const p = backOut(clamp((t - 0.25 - i * 0.08) / 0.35))
      if (p <= 0) return
      ctx.beginPath()
      ctx.arc((-0.45 + i * 0.04) * u, -0.355 * u, 0.012 * u * p, 0, TAU)
      ctx.fillStyle = rgba(C, a)
      ctx.fill()
    })
    roundRect(ctx, -0.25 * u, -0.375 * u, 0.5 * u, 0.042 * u, 0.021 * u)
    ctx.fillStyle = `rgba(255, 240, 210, ${0.06 * open})`
    ctx.fill()
    ctx.font = `500 ${(0.03 * u).toFixed(1)}px ${MONO}`
    ctx.fillStyle = rgba(PALE, 0.6 * open)
    ctx.fillText('webnestle.in', 0, -0.353 * u)
    ctx.beginPath()
    ctx.moveTo(-0.5 * u, -0.315 * u)
    ctx.lineTo(0.5 * u, -0.315 * u)
    ctx.strokeStyle = rgba(C, 0.25 * open)
    ctx.lineWidth = px
    ctx.stroke()
    const deploy = step(S.click + 0.05, S.live - S.click)
    if (deploy > 0 && live < 1) {
      ctx.fillStyle = rgba(PALE, 0.9 * (1 - live))
      ctx.fillRect(-0.5 * u, -0.318 * u, deploy * u, 2 * px)
    }

    // the page; at the end of a build it scrolls up and away
    const keep = 1 - out
    ctx.save()
    roundRect(ctx, -0.5 * u, -0.314 * u, 1.0 * u, 0.582 * u, 0.04 * u)
    ctx.clip()
    ctx.translate(0, -out * 0.22 * u)
    // outlines first, one after another
    parts.forEach((p, i) => {
      const e = step(S.wire + i * 0.08, 0.45)
      const filled = step(S.fill + i * 0.17, 0.5)
      wire(ctx, u, px, p, e, (1 - filled) * keep)
    })
    // then the parts fill in, in the same order
    const f = (i) => step(S.fill + i * 0.17, 0.6)
    const gold = rgba(C, 0.85)
    const ink = rgba(PALE, 0.92)
    bar(ctx, u, px, page.nav, f(0), gold, false, keep)
    bar(ctx, u, px, page.links, f(1), rgba(C, 0.45), false, keep)
    bar(ctx, u, px, page.head1, f(2), ink, true, keep)
    bar(ctx, u, px, page.head2, f(3), ink, true, keep)
    bar(ctx, u, px, page.sub, f(4), rgba(PALE, 0.35), false, keep)
    // the button pops, and lights up while the cursor is over it
    const bp = backOut(f(5))
    if (bp > 0) {
      const [, , w, h] = page.button
      const hover = step(S.click - 0.25, 0.25) * (1 - step(S.live + 0.6, 0.4))
      const press = 1 - 0.1 * Math.max(0, 1 - Math.abs(c - S.click) / 0.12)
      ctx.save()
      ctx.translate(BUTTON[0] * u, BUTTON[1] * u)
      ctx.scale(bp * press, bp * press)
      ctx.globalAlpha = keep
      roundRect(ctx, (-w / 2) * u, (-h / 2) * u, w * u, h * u, (h / 2) * u)
      ctx.fillStyle = hover > 0 ? rgba(mix(C, PALE, hover * 0.6), 1) : gold
      if (hover > 0) {
        ctx.shadowColor = rgba(C, 0.9)
        ctx.shadowBlur = 16 * hover * (u / 200)
      }
      ctx.fill()
      ctx.restore()
    }
    // the hero picture wipes in from the left while the sun rises over the hills
    const img = f(6)
    if (img > 0) {
      const [x, y, w, h] = page.image
      const e = expoOut(img)
      ctx.save()
      ctx.globalAlpha = keep
      roundRect(ctx, x * u, y * u, w * e * u, h * u, 0.016 * u)
      ctx.clip()
      const sky = ctx.createLinearGradient(0, y * u, 0, (y + h) * u)
      sky.addColorStop(0, rgba(C, 0.78))
      sky.addColorStop(1, rgba([90, 40, 10], 0.92))
      ctx.fillStyle = sky
      ctx.fillRect(x * u, y * u, w * u, h * u)
      const sunY = lerp(y + h * 0.95, y + h * 0.42, easeInOut(clamp(img * 1.3 - 0.2)))
      ctx.beginPath()
      ctx.arc((x + w * 0.66) * u, sunY * u, 0.04 * u, 0, TAU)
      ctx.fillStyle = rgba(PALE, 1)
      ctx.shadowColor = rgba(PALE, 0.9)
      ctx.shadowBlur = 14 * (u / 200)
      ctx.fill()
      ctx.shadowBlur = 0
      const hy = (1 - e) * 0.06
      ctx.beginPath()
      ctx.moveTo(x * u, (y + h) * u)
      ctx.quadraticCurveTo((x + w * 0.3) * u, (y + h * 0.5 + hy) * u, (x + w * 0.6) * u, (y + h * 0.8 + hy) * u)
      ctx.quadraticCurveTo((x + w * 0.82) * u, (y + h * 0.62 + hy) * u, (x + w) * u, (y + h * 0.72 + hy) * u)
      ctx.lineTo((x + w) * u, (y + h) * u)
      ctx.fillStyle = rgba([40, 18, 6], 0.88)
      ctx.fill()
      ctx.restore()
    }
    // the cards rise into place, their pictures wiping in
    page.cards.forEach(([x, y, w, h], i) => {
      const e = f(7 + i)
      if (e <= 0) return
      const rise = (1 - expoOut(e)) * 0.05
      const a = clamp(e * 2.5) * keep
      ctx.save()
      ctx.translate(0, rise * u)
      ctx.globalAlpha = a
      roundRect(ctx, x * u, y * u, w * u, h * u, 0.014 * u)
      ctx.fillStyle = 'rgba(255, 240, 210, 0.07)'
      ctx.fill()
      roundRect(ctx, (x + 0.018) * u, (y + 0.018) * u, (w - 0.036) * expoOut(clamp(e * 1.4 - 0.2)) * u, h * 0.5 * u, 0.01 * u)
      ctx.fillStyle = rgba(C, 0.35 + i * 0.12)
      ctx.fill()
      bar(ctx, u, px, [x + 0.018, y + h * 0.66, w * 0.7, 0.02], clamp(e * 1.4 - 0.3), rgba(PALE, 0.7), false, a)
      bar(ctx, u, px, [x + 0.018, y + h * 0.82, w * 0.45, 0.016], clamp(e * 1.4 - 0.45), rgba(PALE, 0.3), false, a)
      ctx.restore()
    })
    // a sheen sweeps across the page as it goes live
    const sheen = step(S.live, 0.8)
    if (sheen > 0 && sheen < 1) {
      const sx = lerp(-0.8, 0.8, easeInOut(sheen)) * u
      const g = ctx.createLinearGradient(sx - 0.25 * u, 0, sx + 0.25 * u, 0)
      g.addColorStop(0, 'rgba(255,240,210,0)')
      g.addColorStop(0.5, 'rgba(255,240,210,0.22)')
      g.addColorStop(1, 'rgba(255,240,210,0)')
      ctx.globalAlpha = 1
      ctx.fillStyle = g
      ctx.fillRect(-0.5 * u, -0.32 * u, u, 0.6 * u)
    }
    ctx.restore()

    // LIVE pops in with a burst of sparks
    const badge = backOut(step(S.live, 0.45)) * (1 - out)
    if (badge > 0) {
      ctx.save()
      ctx.translate(0.36 * u, -0.25 * u)
      const sa = step(S.live, 0.9)
      if (sa < 1) {
        sparks.forEach((s) => {
          const d = (0.06 + s.d * expoOut(sa)) * u
          ctx.beginPath()
          ctx.arc(Math.cos(s.a) * d, Math.sin(s.a) * d, 0.008 * u * (1 - sa), 0, TAU)
          ctx.fillStyle = rgba(PALE, 1 - sa)
          ctx.fill()
        })
      }
      ctx.scale(badge, badge)
      roundRect(ctx, -0.09 * u, -0.03 * u, 0.18 * u, 0.06 * u, 0.03 * u)
      ctx.fillStyle = rgba(C, 0.95)
      ctx.shadowColor = rgba(C, 0.8)
      ctx.shadowBlur = 14 * (u / 200)
      ctx.fill()
      ctx.shadowBlur = 0
      const blink = 0.55 + 0.45 * Math.cos(c * 6)
      ctx.beginPath()
      ctx.arc(-0.055 * u, 0, 0.012 * u, 0, TAU)
      ctx.fillStyle = rgba(DARK, blink)
      ctx.fill()
      ctx.font = `800 ${(0.036 * u).toFixed(1)}px ${DISPLAY}`
      ctx.fillStyle = rgba(DARK, 1)
      ctx.fillText('LIVE', 0.015 * u, 0.002 * u)
      ctx.restore()
    }

    // the cursor curves in to the button, clicks (a ripple), and drifts off
    const inn = easeInOut(step(S.cursor, S.click - S.cursor))
    const away = easeInOut(step(S.live + 0.7, 1.4))
    let k = curve([0.62, 0.48], BUTTON, 0.35, inn)
    if (away > 0) k = curve(BUTTON, [0.3, 0.36], -0.25, away)
    const ca = smooth(step(S.cursor - 0.1, 0.3)) * (1 - smooth(step(S.live + 1.6, 0.5)))
    const tap = step(S.click, 0.6)
    if (tap > 0 && tap < 1) {
      ;[0, 0.18].forEach((delay) => {
        const r = clamp((tap - delay) / (1 - delay))
        if (r <= 0) return
        ctx.beginPath()
        ctx.arc(BUTTON[0] * u, BUTTON[1] * u, (0.02 + r * 0.09) * u, 0, TAU)
        ctx.strokeStyle = rgba(PALE, 0.8 * (1 - r))
        ctx.lineWidth = 1.4 * px
        ctx.stroke()
      })
    }
    if (ca > 0) {
      ctx.save()
      ctx.translate(k[0] * u, k[1] * u)
      const press = 1 - 0.18 * Math.max(0, 1 - Math.abs(c - S.click) / 0.12)
      ctx.scale(press, press)
      ctx.globalAlpha = ca
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, 0.075 * u)
      ctx.lineTo(0.02 * u, 0.056 * u)
      ctx.lineTo(0.034 * u, 0.086 * u)
      ctx.lineTo(0.046 * u, 0.08 * u)
      ctx.lineTo(0.032 * u, 0.051 * u)
      ctx.lineTo(0.058 * u, 0.05 * u)
      ctx.closePath()
      ctx.fillStyle = '#fff'
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 6 * (u / 200)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'
      ctx.lineWidth = px
      ctx.stroke()
      ctx.restore()
    }
    ctx.restore()

    // the phone version springs in beside it, builds, and leaves with the page
    const ph = backOut(step(S.phone, 0.6)) * (1 - out)
    if (ph > 0) {
      ctx.save()
      ctx.translate((0.58 + (1 - ph) * 0.3 + out * 0.2 + mx * 0.06) * u, (0.2 + my * 0.04) * u)
      ctx.rotate(lerp(0.5, 0.14, ph))
      ctx.scale(1.1, 1.1)
      ctx.globalAlpha = clamp(ph)
      roundRect(ctx, -0.11 * u, -0.2 * u, 0.22 * u, 0.4 * u, 0.04 * u)
      ctx.fillStyle = 'rgba(16, 11, 5, 0.96)'
      ctx.fill()
      ctx.strokeStyle = rgba(C, 0.6 + flash * 0.3)
      ctx.lineWidth = 1.2 * px
      ctx.stroke()
      const pf = (i) => step(S.phone + 0.25 + i * 0.12, 0.4)
      const pa = clamp(ph)
      bar(ctx, u, px, [-0.08, -0.16, 0.16, 0.02], pf(0), rgba(PALE, 0.85), false, pa)
      bar(ctx, u, px, [-0.08, -0.125, 0.11, 0.02], pf(1), rgba(PALE, 0.85), false, pa)
      bar(ctx, u, px, [-0.08, -0.08, 0.16, 0.1], pf(2), rgba(C, 0.7), false, pa)
      bar(ctx, u, px, [-0.08, 0.04, 0.16, 0.06], pf(3), 'rgba(255, 240, 210, 0.1)', false, pa)
      bar(ctx, u, px, [-0.08, 0.115, 0.16, 0.06], pf(4), 'rgba(255, 240, 210, 0.1)', false, pa)
      ctx.restore()
    }

    weave(ctx, u, px, t, true, cx, cy, grow, flash)
  }
}

/* -------------------------------------------------------------------------------------------------
   LootDost: a radar finds deals and passes each one round the friends
   ------------------------------------------------------------------------------------------------- */
function deals(color) {
  const C = hex(color)
  const HOT = [255, 196, 150]
  const TAGS = [
    ['−65%', -2.5, 0.68, -12],
    ['₹199', -1.75, 0.6, 9],
    ['−40%', -0.95, 0.72, -6],
    ['2 FOR 1', -0.2, 0.62, 10],
    ['−52%', 0.6, 0.72, -9],
    ['LOOT', 1.35, 0.6, 7],
    ['−70%', 2.1, 0.7, -10],
    ['₹499', 2.85, 0.6, 8],
  ].map(([label, a, r, rot], i) => {
    // a price ticks when found: a discount counts up from nothing, a price counts down to it
    const m = label.match(/^(\D*)(\d+)(\D*)$/)
    const num = m && { pre: m[1], n: +m[2], post: m[3], from: m[1].includes('₹') ? Math.round((+m[2] * 3) / 100) * 100 - 1 : 0 }
    return { i, label, a, r, rot: (rot * Math.PI) / 180, num, hit: -9 }
  })
  const FRIENDS = Array.from({ length: 6 }, (_, i) => ({ i, a: (i / 6) * TAU + 0.3, hit: -9 }))
  const embers = Array.from({ length: 16 }, (_, i) => ({ x: rand(i) * 1.6 - 0.8, s: 0.05 + rand(i + 30) * 0.08, o: rand(i + 60) }))
  const SPEED = 1.05 // radar, radians per second
  const START = 0.9 // the sweep starts once the radar has booted
  let shares = [] // found deals on their way: tag -> the % -> a friend
  let waves = [] // rings sent out by the % as a deal passes through
  let prev = null
  let coinHit = -9

  const pos = (a, r) => [Math.cos(a) * r, Math.sin(a) * r]

  const draw = (ctx, t, { u, px, mx, my }) => {
    const boot = (at, len) => clamp((t - at) / len)
    const running = t > START
    const sweep = -Math.PI / 2 + Math.max(0, t - START) * SPEED
    // which deals did the sweep pass since the last frame?
    if (running && prev !== null && sweep > prev && sweep - prev < 1) {
      TAGS.forEach((g) => {
        if (Math.floor((sweep - g.a) / TAU) > Math.floor((prev - g.a) / TAU)) {
          g.hit = t
          shares.push({ g, f: FRIENDS[(g.i * 5 + Math.floor(t)) % FRIENDS.length], t0: t + 0.18, stage: 0 })
        }
      })
    }
    prev = running ? sweep : null

    // ember-dark ground
    const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, u * 1.05)
    bg.addColorStop(0, rgba(C, 0.26))
    bg.addColorStop(0.55, rgba(C, 0.06))
    bg.addColorStop(1, '#060201')
    ctx.fillStyle = bg
    ctx.fillRect(-u, -u, 2 * u, 2 * u)

    ctx.save()
    ctx.translate(mx * 0.03 * u, my * 0.03 * u)

    // the dial boots: its rings draw round, the crosshair fades up, the ticks run round the rim
    ctx.lineWidth = px
    ;[0.3, 0.55, 0.8].forEach((r, i) => {
      const p = expoOut(boot(0.05 + i * 0.12, 0.8))
      if (p <= 0) return
      ctx.beginPath()
      ctx.arc(0, 0, r * u, -Math.PI / 2, -Math.PI / 2 + p * TAU)
      ctx.strokeStyle = rgba(C, 0.17)
      ctx.stroke()
    })
    const cross = boot(0.3, 0.5)
    ctx.beginPath()
    ctx.moveTo(-0.92 * u * cross, 0)
    ctx.lineTo(0.92 * u * cross, 0)
    ctx.moveTo(0, -0.92 * u * cross)
    ctx.lineTo(0, 0.92 * u * cross)
    ctx.strokeStyle = rgba(C, 0.08)
    ctx.stroke()
    const ticks = Math.floor(72 * expoOut(boot(0.2, 0.9)))
    for (let k = 0; k < ticks; k++) {
      const a = -Math.PI / 2 + (k / 72) * TAU
      const r0 = k % 6 ? 0.88 : 0.85
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * r0 * u, Math.sin(a) * r0 * u)
      ctx.lineTo(Math.cos(a) * 0.91 * u, Math.sin(a) * 0.91 * u)
      ctx.strokeStyle = rgba(C, k % 6 ? 0.18 : 0.38)
      ctx.stroke()
    }

    // the sweep: a fading wedge of light behind its leading edge
    const sv = smooth(boot(START, 0.5))
    if (sv > 0) {
      ctx.globalCompositeOperation = 'lighter'
      const SL = 30
      const len = 1.15
      for (let k = 0; k < SL; k++) {
        const a0 = sweep - len + (len * k) / SL
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, 0.9 * u, a0, a0 + len / SL + 0.004)
        ctx.closePath()
        ctx.fillStyle = rgba(C, 0.3 * sv * (k / SL) ** 2)
        ctx.fill()
      }
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(sweep) * 0.9 * u, Math.sin(sweep) * 0.9 * u)
      ctx.strokeStyle = rgba(HOT, 0.85 * sv)
      ctx.lineWidth = 1.5 * px
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
    }

    // the friends pop in round the middle, linked to it by lines that flow outwards
    FRIENDS.forEach((f) => {
      const appear = backOut(boot(0.5 + f.i * 0.08, 0.5))
      if (appear <= 0) return
      const age = t - f.hit
      const k = Math.exp(-Math.max(0, age) / 0.6)
      const bob = Math.sin(t * 1.6 + f.i) * 0.006
      const [fx, fy] = pos(f.a, 0.33)
      const x = fx * u
      const y = (fy + bob) * u
      const reach = expoOut(boot(0.45 + f.i * 0.08, 0.5))
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(x * reach, y * reach)
      ctx.setLineDash([0.014 * u, 0.018 * u])
      ctx.lineDashOffset = -t * 0.06 * u
      ctx.strokeStyle = rgba(C, 0.16 + 0.45 * k)
      ctx.lineWidth = px
      ctx.stroke()
      ctx.setLineDash([])
      const s = appear * (1 + bounce(age, 0.3, 18, 5))
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(s, s)
      ctx.beginPath()
      ctx.arc(0, 0, (0.045 + 0.01 * k) * u, 0, TAU)
      ctx.fillStyle = rgba([30, 10, 4], 0.95)
      ctx.fill()
      ctx.strokeStyle = rgba(C, 0.55 + 0.45 * k)
      ctx.lineWidth = 1.3 * px
      ctx.stroke()
      // a little person: head and shoulders
      ctx.fillStyle = rgba(HOT, 0.55 + 0.45 * k)
      ctx.beginPath()
      ctx.arc(0, -0.012 * u, 0.012 * u, 0, TAU)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, 0.026 * u, 0.022 * u, Math.PI * 1.08, Math.PI * 1.92)
      ctx.fill()
      ctx.restore()
      // +1 floats up when a deal arrives
      if (age >= 0 && age < 1) {
        ctx.font = `800 ${(0.04 * u).toFixed(1)}px ${DISPLAY}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = rgba(HOT, 1 - age)
        ctx.fillText('+1', x, y - (0.075 + age * 0.06) * u)
      }
    })

    // the deals: faint blips until the sweep finds them, then they pop, ping and tick
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 ${(0.05 * u).toFixed(1)}px ${DISPLAY}`
    TAGS.forEach((g) => {
      const appear = boot(0.8 + g.i * 0.06, 0.4)
      if (appear <= 0) return
      const age = t - g.hit
      const k = age >= 0 ? Math.exp(-age / 1.5) : 0
      const [gx, gy] = pos(g.a, g.r)
      const x = gx * u
      const y = gy * u
      ;[0, 0.22].forEach((d) => {
        const a = age - d
        if (a < 0 || a > 0.9) return
        ctx.beginPath()
        ctx.arc(x, y, (0.05 + a * 0.26) * u, 0, TAU)
        ctx.strokeStyle = rgba(HOT, 0.7 * (1 - a / 0.9))
        ctx.lineWidth = 1.2 * px
        ctx.stroke()
      })
      let label = g.label
      if (g.num && age >= 0 && age < 0.7) label = g.num.pre + Math.round(lerp(g.num.from, g.num.n, expoOut(age / 0.7))) + g.num.post
      const w = Math.max(0.17, ctx.measureText(g.label).width / u + 0.08)
      const h = 0.085
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(g.rot + bounce(age, 0.18, 14, 4))
      const s = 1 + bounce(age, 0.22, 14, 4.5) + 0.04 * k
      ctx.scale(s, s)
      ctx.globalAlpha = appear
      if (k > 0.05) {
        ctx.shadowColor = rgba(C, 0.9)
        ctx.shadowBlur = 22 * k * (u / 200)
      }
      // a price tag: a rounded body with a pointed end and a hole
      const L = -w / 2
      const R = w / 2
      ctx.beginPath()
      ctx.moveTo((L - 0.04) * u, 0)
      ctx.lineTo(L * u, (-h / 2) * u)
      ctx.lineTo((R - 0.015) * u, (-h / 2) * u)
      ctx.quadraticCurveTo(R * u, (-h / 2) * u, R * u, (-h / 2 + 0.015) * u)
      ctx.lineTo(R * u, (h / 2 - 0.015) * u)
      ctx.quadraticCurveTo(R * u, (h / 2) * u, (R - 0.015) * u, (h / 2) * u)
      ctx.lineTo(L * u, (h / 2) * u)
      ctx.closePath()
      ctx.fillStyle = k > 0.05 ? rgba(C, 0.25 + 0.7 * k) : rgba([40, 14, 6], 0.85)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = rgba(C, 0.35 + 0.65 * k)
      ctx.lineWidth = 1.1 * px
      ctx.stroke()
      ctx.beginPath()
      ctx.arc((L - 0.004) * u, 0, 0.011 * u, 0, TAU)
      ctx.fillStyle = '#0a0302'
      ctx.fill()
      ctx.fillStyle = k > 0.05 ? rgba([255, 255, 255], 0.55 + 0.45 * k) : rgba(HOT, 0.32)
      ctx.fillText(label, 0.012 * u, 0.003 * u)
      ctx.restore()
    })

    // a found deal flies to the % as a spark with a tail, then on to a friend
    const spark = (p, a) => {
      const g = ctx.createRadialGradient(p[0] * u, p[1] * u, 0, p[0] * u, p[1] * u, 0.05 * u)
      g.addColorStop(0, rgba(HOT, 0.95 * a))
      g.addColorStop(1, rgba(C, 0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(p[0] * u, p[1] * u, 0.05 * u, 0, TAU)
      ctx.fill()
    }
    const trail = (from, to, bow, e) => {
      for (let k = 6; k >= 1; k--) {
        const q = e - k * 0.035
        if (q <= 0) continue
        const p = curve(from, to, bow, q)
        ctx.beginPath()
        ctx.arc(p[0] * u, p[1] * u, (0.016 - k * 0.0018) * u, 0, TAU)
        ctx.fillStyle = rgba(HOT, 0.5 * (1 - k / 7))
        ctx.fill()
      }
      spark(curve(from, to, bow, e), 1)
    }
    ctx.globalCompositeOperation = 'lighter'
    shares = shares.filter((s) => {
      const from = pos(s.g.a, s.g.r)
      const friend = pos(s.f.a, 0.33)
      const q1 = (t - s.t0) / 0.55
      const q2 = (t - s.t0 - 0.65) / 0.5
      if (q1 >= 1 && s.stage === 0) {
        s.stage = 1
        coinHit = t
        waves.push(t)
      }
      if (q2 >= 1) {
        s.f.hit = t
        return false
      }
      if (q1 > 0 && q1 < 1) trail(from, [0, 0], 0.22, easeInOut(q1))
      if (q2 > 0) trail([0, 0], friend, -0.18, easeInOut(q2))
      return true
    })
    ctx.globalCompositeOperation = 'source-over'

    // rings sent out by the % as a deal passes through it
    waves = waves.filter((w) => {
      const a = (t - w) / 0.8
      if (a >= 1) return false
      ctx.beginPath()
      ctx.arc(0, 0, (0.17 + a * 0.22) * u, 0, TAU)
      ctx.strokeStyle = rgba(HOT, 0.6 * (1 - a))
      ctx.lineWidth = 1.3 * px
      ctx.stroke()
      return true
    })

    // in the middle: the %; it pops in, breathes, and bounces and flips as a deal passes through
    const age = t - coinHit
    const grow = backOut(boot(0.15, 0.6))
    const beat = grow * (1 + 0.035 * Math.sin(t * 2.4) + bounce(age, 0.22, 20, 6))
    const flip = age >= 0 && age < 0.5 ? Math.abs(Math.cos((age / 0.5) * Math.PI)) : 1
    if (beat > 0) {
      ctx.save()
      ctx.scale(Math.max(0.04, flip) * beat, beat)
      const core = ctx.createRadialGradient(-0.03 * u, -0.04 * u, 0, 0, 0, 0.15 * u)
      core.addColorStop(0, rgba(HOT, 1))
      core.addColorStop(0.55, rgba(C, 1))
      core.addColorStop(1, rgba([150, 40, 6], 1))
      ctx.beginPath()
      ctx.arc(0, 0, 0.14 * u, 0, TAU)
      ctx.fillStyle = core
      ctx.shadowColor = rgba(C, 0.8)
      ctx.shadowBlur = 30 * (u / 200)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.font = `800 ${(0.15 * u).toFixed(1)}px ${DISPLAY}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.fillText('%', 0, 0.008 * u)
      ctx.restore()
      ctx.beginPath()
      ctx.arc(0, 0, 0.175 * u * beat, -Math.PI / 2, -Math.PI / 2 + TAU * expoOut(boot(0.35, 0.6)))
      ctx.strokeStyle = rgba(C, 0.5)
      ctx.lineWidth = 1.2 * px
      ctx.stroke()
    }

    ctx.restore()

    // embers drifting up
    ctx.globalCompositeOperation = 'lighter'
    embers.forEach((m, i) => {
      const y = 1 - ((t * m.s + m.o) % 1) * 2
      const x = m.x + Math.sin(t * 0.8 + i) * 0.04
      const a = Math.sin(((y + 1) / 2) * Math.PI) * 0.7 * clamp(t / 1.2)
      ctx.beginPath()
      ctx.arc(x * u, y * u, (0.006 + rand(i + 90) * 0.008) * u, 0, TAU)
      ctx.fillStyle = rgba(HOT, a)
      ctx.fill()
    })
    ctx.globalCompositeOperation = 'source-over'
  }

  // when the case arrives again, the radar boots again
  draw.reset = () => {
    TAGS.forEach((g) => (g.hit = -9))
    FRIENDS.forEach((f) => (f.hit = -9))
    shares = []
    waves = []
    prev = null
    coinHit = -9
  }
  return draw
}

export const ARTS = { nest, deals }

/** A canvas that draws the artwork `kind` in `color` into a circle filling its parent. */
export function createArt(kind, color) {
  const canvas = el('canvas.case-art', { 'aria-hidden': 'true' })
  const ctx = canvas.getContext('2d')
  const paint = ARTS[kind](color)
  // the deals use the rupee sign, which lives in another subset of the display font
  document.fonts?.load?.(`800 20px ${DISPLAY}`, '₹−%')
  let size = 0
  let dpr = 1
  let noise = null
  let last = Infinity

  return {
    canvas,
    // t: seconds since the case arrived (going back restarts it); mx, my: the pointer (or the
    // phone's tilt), -1..1
    draw(t, mx = 0, my = 0) {
      const w = canvas.clientWidth
      if (!w) return
      if (t < last) paint.reset?.()
      last = t
      if (w !== size) {
        size = w
        dpr = Math.min(2, window.devicePixelRatio || 1)
        canvas.width = canvas.height = Math.round(w * dpr)
      }
      const u = canvas.width / 2
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(1, 0, 0, 1, u, u)
      ctx.save()
      ctx.beginPath()
      ctx.arc(0, 0, u, 0, TAU)
      ctx.clip()
      paint(ctx, t, { u, px: dpr, mx, my })
      // film grain and a soft edge, so it sits in the record like the films do
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = noise ??= ctx.createPattern(grain(), 'repeat')
      ctx.fillRect(-u, -u, 2 * u, 2 * u)
      const v = ctx.createRadialGradient(0, 0, u * 0.62, 0, 0, u)
      v.addColorStop(0, 'rgba(0,0,0,0)')
      v.addColorStop(1, 'rgba(0,0,0,0.72)')
      ctx.fillStyle = v
      ctx.fillRect(-u, -u, 2 * u, 2 * u)
      ctx.restore()
    },
  }
}
