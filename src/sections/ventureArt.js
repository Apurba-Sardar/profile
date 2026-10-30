import { el, clamp, lerp, range, smooth } from '../lib/util.js'

/**
 * Motion graphics for the records in Selected Work, drawn on a 2D canvas: what each venture does,
 * in its colour.
 *
 * - `nest` (Webnestle, a web agency): a website builds itself in a nest woven from golden threads,
 *   from wireframe to finished page to live, with the phone version beside it.
 * - `deals` (LootDost, a deal-finding community): a radar sweeps the shops, finds deals that light
 *   up as it passes, and each find travels to the circle of friends in the middle.
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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) return ctx.roundRect(x, y, w, h, r)
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
  const strands = Array.from({ length: 30 }, (_, i) => ({
    rx: 0.7 + rand(i) * 0.2,
    tilt: (rand(i + 40) - 0.5) * 0.42,
    a0: rand(i + 80) * TAU,
    span: 1.6 + rand(i + 120) * 2.2,
    speed: (rand(i + 160) - 0.5) * 0.36,
    alpha: 0.14 + rand(i + 200) * 0.4,
    w: 0.6 + rand(i + 240) * 1.1,
  }))
  const tokens = ['</>', '{ }', 'npm run build', '200 OK']
  const T = 7.5 // one build, seconds

  // the page inside the window, in units of the circle's radius (x, y, w, h); the order is the
  // order things fill in
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

  // the threads of the nest: the far half is drawn behind the window, the near half in front
  const weave = (ctx, u, px, t, near, cx, cy) => {
    for (const s of strands) {
      const ry = s.rx * 0.34
      const ct = Math.cos(s.tilt)
      const st = Math.sin(s.tilt)
      const a = s.a0 + t * s.speed
      ctx.beginPath()
      let drawing = false
      for (let k = 0; k <= 28; k++) {
        const th = a + (s.span * k) / 28
        const ex = Math.cos(th) * s.rx
        const ey = Math.sin(th) * ry
        const front = Math.sin(th) > 0
        const x = (cx + ex * ct - ey * st) * u
        const y = (cy + ex * st + ey * ct) * u
        if (front === near) {
          drawing ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
          drawing = true
        } else drawing = false
      }
      ctx.strokeStyle = rgba(near ? PALE : C, s.alpha * (near ? 0.9 : 0.6))
      ctx.lineWidth = s.w * px
      ctx.stroke()
    }
  }

  const block = (ctx, u, [x, y, w, h], r, a, color) => {
    if (a <= 0) return
    roundRect(ctx, x * u, y * u, w * u, h * u, r * u)
    ctx.fillStyle = color
    ctx.globalAlpha = a
    ctx.fill()
    ctx.globalAlpha = 1
  }
  const wire = (ctx, u, px, [x, y, w, h], r, a) => {
    if (a <= 0) return
    roundRect(ctx, x * u, y * u, w * u, h * u, r * u)
    ctx.setLineDash([3 * px, 3 * px])
    ctx.strokeStyle = rgba(C, 0.5 * a)
    ctx.lineWidth = px
    ctx.stroke()
    ctx.setLineDash([])
  }

  return (ctx, t, { u, px, mx, my }) => {
    const c = (t % T) / T
    const built = smooth(range(c, 0.0, 0.14)) // wireframe draws in
    const fill = (i) => smooth(range(c, 0.14 + i * 0.045, 0.26 + i * 0.045))
    const live = smooth(range(c, 0.64, 0.7))
    const clear = smooth(range(c, 0.9, 1)) // the page wipes for the next build
    const glow = live * (1 - clear)

    // warm dark ground, lit from inside the nest
    const bg = ctx.createRadialGradient(0, 0.08 * u, 0, 0, 0.08 * u, u * 1.05)
    bg.addColorStop(0, rgba(C, 0.3 + glow * 0.1))
    bg.addColorStop(0.5, rgba(C, 0.07))
    bg.addColorStop(1, '#050302')
    ctx.fillStyle = bg
    ctx.fillRect(-u, -u, 2 * u, 2 * u)

    const cx = mx * 0.03
    const cy = 0.2 + my * 0.02
    weave(ctx, u, px, t, false, cx, cy)

    // floating code, drifting round the window
    ctx.font = `500 ${(0.052 * u).toFixed(1)}px ${MONO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    tokens.forEach((tok, i) => {
      const a = (i / tokens.length) * TAU + t * 0.12
      const x = Math.cos(a) * 0.72 + mx * 0.05
      const y = Math.sin(a) * 0.62 - 0.08 + my * 0.04
      ctx.fillStyle = rgba(C, 0.22 + 0.18 * Math.sin(t * 0.8 + i * 1.7) ** 2)
      ctx.fillText(tok, x * u, y * u)
    })

    // the window floats a little and leans towards the cursor
    ctx.save()
    ctx.translate((-0.03 + mx * 0.04) * u, (-0.05 + Math.sin(t * 0.9) * 0.012 + my * 0.03) * u)
    ctx.rotate(-0.035 + mx * 0.03)
    ctx.scale(1.12, 1.12)

    // light behind it once the site is live
    if (glow > 0) {
      const halo = ctx.createRadialGradient(0, -0.05 * u, 0, 0, -0.05 * u, 0.75 * u)
      halo.addColorStop(0, rgba(C, 0.35 * glow))
      halo.addColorStop(1, rgba(C, 0))
      ctx.fillStyle = halo
      ctx.fillRect(-u, -u, 2 * u, 2 * u)
    }

    // window frame and its bar
    roundRect(ctx, -0.5 * u, -0.4 * u, 1.0 * u, 0.67 * u, 0.05 * u)
    ctx.fillStyle = 'rgba(16, 11, 5, 0.94)'
    ctx.fill()
    ctx.strokeStyle = rgba(C, 0.5 + glow * 0.35)
    ctx.lineWidth = 1.2 * px
    ctx.stroke()
    ;[0.6, 0.4, 0.25].forEach((a, i) => {
      ctx.beginPath()
      ctx.arc((-0.45 + i * 0.04) * u, -0.355 * u, 0.012 * u, 0, TAU)
      ctx.fillStyle = rgba(C, a)
      ctx.fill()
    })
    roundRect(ctx, -0.25 * u, -0.375 * u, 0.5 * u, 0.042 * u, 0.021 * u)
    ctx.fillStyle = 'rgba(255, 240, 210, 0.06)'
    ctx.fill()
    ctx.font = `500 ${(0.03 * u).toFixed(1)}px ${MONO}`
    ctx.fillStyle = rgba(PALE, 0.6)
    ctx.fillText('webnestle.in', 0, -0.353 * u)
    ctx.beginPath()
    ctx.moveTo(-0.5 * u, -0.315 * u)
    ctx.lineTo(0.5 * u, -0.315 * u)
    ctx.strokeStyle = rgba(C, 0.25)
    ctx.lineWidth = px
    ctx.stroke()

    // the page: wireframe first, then each part fills in (when: the order it fills in)
    const fade = 1 - clear
    const parts = [
      [page.nav, 0],
      [page.links, 0],
      [page.head1, 1],
      [page.head2, 1.4],
      [page.sub, 2],
      [page.button, 2.5],
      [page.image, 3],
      ...page.cards.map((card, i) => [card, 4 + i * 0.7]),
    ]
    parts.forEach(([p, when]) => wire(ctx, u, px, p, 0.012, built * (1 - fill(when)) * fade))
    const gold = rgba(C, 0.85)
    block(ctx, u, page.nav, 0.013, fill(0) * fade, gold)
    block(ctx, u, page.links, 0.013, fill(0) * fade * 0.5, gold)
    block(ctx, u, page.head1, 0.012, fill(1) * fade, rgba(PALE, 0.92))
    block(ctx, u, page.head2, 0.012, fill(1.4) * fade, rgba(PALE, 0.92))
    block(ctx, u, page.sub, 0.01, fill(2) * fade, rgba(PALE, 0.35))
    block(ctx, u, page.button, 0.022, fill(2.5) * fade, gold)
    // hero picture: a sun over hills
    const img = fill(3) * fade
    if (img > 0) {
      const [x, y, w, h] = page.image
      ctx.save()
      roundRect(ctx, x * u, y * u, w * u, h * u, 0.016 * u)
      ctx.clip()
      const sky = ctx.createLinearGradient(0, y * u, 0, (y + h) * u)
      sky.addColorStop(0, rgba(C, 0.75 * img))
      sky.addColorStop(1, rgba([90, 40, 10], 0.9 * img))
      ctx.fillStyle = sky
      ctx.fillRect(x * u, y * u, w * u, h * u)
      ctx.beginPath()
      ctx.arc((x + w * 0.66) * u, (y + h * 0.42) * u, 0.04 * u, 0, TAU)
      ctx.fillStyle = rgba(PALE, img)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(x * u, (y + h) * u)
      ctx.quadraticCurveTo((x + w * 0.3) * u, (y + h * 0.5) * u, (x + w * 0.6) * u, (y + h * 0.8) * u)
      ctx.quadraticCurveTo((x + w * 0.82) * u, (y + h * 0.62) * u, (x + w) * u, (y + h * 0.72) * u)
      ctx.lineTo((x + w) * u, (y + h) * u)
      ctx.fillStyle = rgba([40, 18, 6], 0.85 * img)
      ctx.fill()
      ctx.restore()
    }
    // cards: a picture and two lines each
    page.cards.forEach((p, i) => {
      const a = fill(4 + i * 0.7) * fade
      if (a <= 0) return
      const [x, y, w, h] = p
      block(ctx, u, p, 0.014, a, 'rgba(255, 240, 210, 0.07)')
      block(ctx, u, [x + 0.018, y + 0.018, w - 0.036, h * 0.5], 0.01, a, rgba(C, 0.35 + i * 0.12))
      block(ctx, u, [x + 0.018, y + h * 0.66, w * 0.7, 0.02], 0.01, a, rgba(PALE, 0.7))
      block(ctx, u, [x + 0.018, y + h * 0.82, w * 0.45, 0.016], 0.008, a, rgba(PALE, 0.3))
    })

    // the cursor publishes it: it travels to the button, clicks, and the page goes live
    const go = smooth(range(c, 0.5, 0.63))
    const leave = smooth(range(c, 0.74, 0.88))
    const kx = lerp(lerp(0.36, -0.36, go), 0.3, leave)
    const ky = lerp(lerp(0.2, -0.015, go), 0.14, leave)
    const tap = range(c, 0.63, 0.7)
    if (tap > 0 && tap < 1) {
      ctx.beginPath()
      ctx.arc(-0.355 * u, -0.012 * u, (0.02 + tap * 0.07) * u, 0, TAU)
      ctx.strokeStyle = rgba(PALE, 0.8 * (1 - tap))
      ctx.lineWidth = 1.4 * px
      ctx.stroke()
    }
    const ca = smooth(range(c, 0.44, 0.5)) * (1 - smooth(range(c, 0.86, 0.9)))
    if (ca > 0) {
      ctx.save()
      ctx.translate(kx * u, ky * u)
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
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'
      ctx.lineWidth = px
      ctx.stroke()
      ctx.restore()
    }
    // LIVE
    const badge = live * fade
    if (badge > 0) {
      const s = 0.7 + 0.3 * smooth(clamp(badge * 1.4))
      ctx.save()
      ctx.translate(0.36 * u, -0.25 * u)
      ctx.scale(s, s)
      ctx.globalAlpha = badge
      roundRect(ctx, -0.09 * u, -0.03 * u, 0.18 * u, 0.06 * u, 0.03 * u)
      ctx.fillStyle = rgba(C, 0.95)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(-0.055 * u, 0, 0.012 * u, 0, TAU)
      ctx.fillStyle = '#1a1206'
      ctx.fill()
      ctx.font = `800 ${(0.036 * u).toFixed(1)}px ${DISPLAY}`
      ctx.fillStyle = '#1a1206'
      ctx.fillText('LIVE', 0.015 * u, 0.002 * u)
      ctx.restore()
    }
    ctx.restore()

    // the phone version, beside it
    const ph = smooth(range(c, 0.4, 0.52)) * fade
    if (ph > 0) {
      ctx.save()
      ctx.translate((0.58 + mx * 0.06) * u, (0.2 + (1 - ph) * 0.08 + my * 0.04) * u)
      ctx.rotate(0.14)
      ctx.scale(1.1, 1.1)
      ctx.globalAlpha = ph
      roundRect(ctx, -0.11 * u, -0.2 * u, 0.22 * u, 0.4 * u, 0.04 * u)
      ctx.fillStyle = 'rgba(16, 11, 5, 0.96)'
      ctx.fill()
      ctx.strokeStyle = rgba(C, 0.6)
      ctx.lineWidth = 1.2 * px
      ctx.stroke()
      block(ctx, u, [-0.08, -0.16, 0.16, 0.02], 0.01, ph, rgba(PALE, 0.85))
      block(ctx, u, [-0.08, -0.125, 0.11, 0.02], 0.01, ph, rgba(PALE, 0.85))
      block(ctx, u, [-0.08, -0.08, 0.16, 0.1], 0.012, ph, rgba(C, 0.7))
      block(ctx, u, [-0.08, 0.04, 0.16, 0.06], 0.01, ph, 'rgba(255, 240, 210, 0.1)')
      block(ctx, u, [-0.08, 0.115, 0.16, 0.06], 0.01, ph, 'rgba(255, 240, 210, 0.1)')
      ctx.restore()
    }

    weave(ctx, u, px, t, true, cx, cy)
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
  ].map(([label, a, r, rot]) => ({ label, a, r, rot: (rot * Math.PI) / 180, hit: -9 }))
  const FRIENDS = Array.from({ length: 6 }, (_, i) => ({ a: (i / 6) * TAU + 0.3, hit: -9 }))
  const embers = Array.from({ length: 16 }, (_, i) => ({ x: rand(i) * 1.6 - 0.8, s: 0.05 + rand(i + 30) * 0.08, o: rand(i + 60) }))
  const shares = [] // a found deal on its way: tag -> centre -> a friend
  let prev = null
  const SPEED = 1.05 // radar, radians per second

  return (ctx, t, { u, px, mx, my }) => {
    const sweep = t * SPEED
    // which deals did the sweep pass since the last frame?
    if (prev !== null && sweep > prev && sweep - prev < 1) {
      TAGS.forEach((g, i) => {
        if (Math.floor((sweep - g.a) / TAU) > Math.floor((prev - g.a) / TAU)) {
          g.hit = t
          shares.push({ g, f: FRIENDS[(i * 5 + Math.floor(t)) % FRIENDS.length], t0: t + 0.25 })
        }
      })
    }
    prev = sweep
    const ox = mx * 0.03 * u
    const oy = my * 0.03 * u

    // ember-dark ground
    const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, u * 1.05)
    bg.addColorStop(0, rgba(C, 0.26))
    bg.addColorStop(0.55, rgba(C, 0.06))
    bg.addColorStop(1, '#060201')
    ctx.fillStyle = bg
    ctx.fillRect(-u, -u, 2 * u, 2 * u)

    ctx.save()
    ctx.translate(ox, oy)

    // the dial: rings, crosshair, ticks round the rim
    ctx.lineWidth = px
    ;[0.3, 0.55, 0.8].forEach((r) => {
      ctx.beginPath()
      ctx.arc(0, 0, r * u, 0, TAU)
      ctx.strokeStyle = rgba(C, 0.17)
      ctx.stroke()
    })
    ctx.beginPath()
    ctx.moveTo(-0.92 * u, 0)
    ctx.lineTo(0.92 * u, 0)
    ctx.moveTo(0, -0.92 * u)
    ctx.lineTo(0, 0.92 * u)
    ctx.strokeStyle = rgba(C, 0.08)
    ctx.stroke()
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * TAU
      const r0 = k % 6 ? 0.88 : 0.85
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * r0 * u, Math.sin(a) * r0 * u)
      ctx.lineTo(Math.cos(a) * 0.91 * u, Math.sin(a) * 0.91 * u)
      ctx.strokeStyle = rgba(C, k % 6 ? 0.18 : 0.38)
      ctx.stroke()
    }

    // the sweep: a fading wedge of light behind its leading edge
    ctx.globalCompositeOperation = 'lighter'
    const SL = 30
    const len = 1.15
    for (let k = 0; k < SL; k++) {
      const a0 = sweep - len + (len * k) / SL
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, 0.9 * u, a0, a0 + len / SL + 0.004)
      ctx.closePath()
      ctx.fillStyle = rgba(C, 0.3 * (k / SL) ** 2)
      ctx.fill()
    }
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(sweep) * 0.9 * u, Math.sin(sweep) * 0.9 * u)
    ctx.strokeStyle = rgba(HOT, 0.85)
    ctx.lineWidth = 1.5 * px
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'

    // the friends, linked to the centre
    FRIENDS.forEach((f) => {
      const x = Math.cos(f.a) * 0.33 * u
      const y = Math.sin(f.a) * 0.33 * u
      const k = Math.exp(-(t - f.hit) / 0.6)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(x, y)
      ctx.strokeStyle = rgba(C, 0.14 + 0.4 * k)
      ctx.lineWidth = px
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x, y, (0.045 + 0.012 * k) * u, 0, TAU)
      ctx.fillStyle = rgba([30, 10, 4], 0.95)
      ctx.fill()
      ctx.strokeStyle = rgba(C, 0.55 + 0.45 * k)
      ctx.lineWidth = 1.3 * px
      ctx.stroke()
      // a little person: head and shoulders
      ctx.fillStyle = rgba(HOT, 0.55 + 0.45 * k)
      ctx.beginPath()
      ctx.arc(x, y - 0.012 * u, 0.012 * u, 0, TAU)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y + 0.026 * u, 0.022 * u, Math.PI * 1.08, Math.PI * 1.92)
      ctx.fill()
    })

    // the deals: faint until the sweep finds them, then they light up and ping
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 ${(0.05 * u).toFixed(1)}px ${DISPLAY}`
    TAGS.forEach((g) => {
      const age = t - g.hit
      const k = Math.exp(-Math.max(0, age) / 1.5)
      const x = Math.cos(g.a) * g.r * u
      const y = Math.sin(g.a) * g.r * u
      if (age >= 0 && age < 0.9) {
        ctx.beginPath()
        ctx.arc(x, y, (0.05 + age * 0.26) * u, 0, TAU)
        ctx.strokeStyle = rgba(HOT, 0.75 * (1 - age / 0.9))
        ctx.lineWidth = 1.2 * px
        ctx.stroke()
      }
      const pop = 1 + 0.16 * k * Math.max(0, Math.cos(Math.min(age, 0.6) * 5))
      const w = Math.max(0.17, ctx.measureText(g.label).width / u + 0.08)
      const h = 0.085
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(g.rot)
      ctx.scale(pop, pop)
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
      ctx.fillText(g.label, 0.012 * u, 0.003 * u)
      ctx.restore()
    })

    // a found deal travels to the centre, then out to a friend
    for (let i = shares.length - 1; i >= 0; i--) {
      const s = shares[i]
      const q = (t - s.t0) / 1.2
      if (q >= 1) {
        s.f.hit = t
        shares.splice(i, 1)
        continue
      }
      if (q < 0) continue
      const from = q < 0.5 ? [Math.cos(s.g.a) * s.g.r, Math.sin(s.g.a) * s.g.r] : [0, 0]
      const to = q < 0.5 ? [0, 0] : [Math.cos(s.f.a) * 0.33, Math.sin(s.f.a) * 0.33]
      const e = smooth(q < 0.5 ? q * 2 : q * 2 - 1)
      const x = lerp(from[0], to[0], e) * u
      const y = lerp(from[1], to[1], e) * u
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 0.05 * u)
      glow.addColorStop(0, rgba(HOT, 0.95))
      glow.addColorStop(1, rgba(C, 0))
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(x, y, 0.05 * u, 0, TAU)
      ctx.fill()
    }

    // in the middle: the deal, %
    const beat = 1 + 0.035 * Math.sin(t * 2.4)
    const core = ctx.createRadialGradient(-0.03 * u, -0.04 * u, 0, 0, 0, 0.15 * u * beat)
    core.addColorStop(0, rgba(HOT, 1))
    core.addColorStop(0.55, rgba(C, 1))
    core.addColorStop(1, rgba([150, 40, 6], 1))
    ctx.beginPath()
    ctx.arc(0, 0, 0.14 * u * beat, 0, TAU)
    ctx.fillStyle = core
    ctx.shadowColor = rgba(C, 0.8)
    ctx.shadowBlur = 30 * (u / 200)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(0, 0, 0.175 * u * beat, 0, TAU)
    ctx.strokeStyle = rgba(C, 0.5)
    ctx.lineWidth = 1.2 * px
    ctx.stroke()
    ctx.font = `800 ${(0.15 * u).toFixed(1)}px ${DISPLAY}`
    ctx.fillStyle = '#fff'
    ctx.fillText('%', 0, 0.008 * u)

    ctx.restore()

    // embers drifting up
    ctx.globalCompositeOperation = 'lighter'
    embers.forEach((m, i) => {
      const y = 1 - ((t * m.s + m.o) % 1) * 2
      const x = m.x + Math.sin(t * 0.8 + i) * 0.04
      const a = Math.sin(((y + 1) / 2) * Math.PI) * 0.7
      ctx.beginPath()
      ctx.arc(x * u, y * u, (0.006 + rand(i + 90) * 0.008) * u, 0, TAU)
      ctx.fillStyle = rgba(HOT, a)
      ctx.fill()
    })
    ctx.globalCompositeOperation = 'source-over'
  }
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

  return {
    canvas,
    // t: seconds; mx, my: the pointer (or the phone's tilt), -1..1
    draw(t, mx = 0, my = 0) {
      const w = canvas.clientWidth
      if (!w) return
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
