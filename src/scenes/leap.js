import { el, lerp, range, smoothRange, window01, wrap, expoOut, clamp } from '../lib/util.js'

// font-size (vw) so a word of this length fits inside maxW (vw)
const fit = (t, max, maxW) => Math.min(max, maxW / (t.length * 0.8))

// Words you fall past. x: vw from centre, y: vh from centre at the top of the
// fall, s: speed (parallax), size: font-size in vw, z: depth in px.
function fieldFrom(w) {
  const [o1, o2, o3, o4] = w.outline
  return [
    { k: 'outline', t: o1, x: 1, y: 96, s: 0.82, size: fit(o1, 30, 98), z: -220, op: 0.5 },
    { k: 'outline', t: o2, x: -15, y: 172, s: 0.98, size: fit(o2, 23, 84), skew: -13, z: -120, op: 0.46 },
    { k: 'outline', t: o3, x: -31, y: 64, s: 1.14, size: fit(o3, 8.4, 40), z: 0, op: 0.6 },
    { k: 'outline', t: o4, x: -31, y: 104, s: 1.3, size: fit(o4, 5.1, 26), z: 60, op: 0.55 },
    { k: 'outline gold', t: w.gold, x: 27, y: 40, s: 0.94, size: fit(w.gold, 5.8, 36), rot: -3, z: -40, op: 0.7 },
    { k: 'solid', t: w.solid, x: 30, y: 24, s: 1.2, size: fit(w.solid, 7, 36), z: 80, op: 1, ghost: true },
    { k: 'solid gold', t: w.solidGold, x: 27, y: -28, s: 0.74, size: fit(w.solidGold, 6.1, 40), rot: -8, z: 20, op: 1, ghost: true },
    { k: 'serif', t: w.serif[0], x: 14, y: 48, s: 1.04, size: 1.55, z: 40, op: 0.85 },
    { k: 'serif', t: w.serif[1], x: -26, y: 128, s: 1.24, size: 1.45, z: 10, op: 0.55 },
    { k: 'code', t: w.code[0], x: 24, y: 150, s: 1.1, z: 30, op: 0.75 },
    { k: 'code', t: w.code[1], x: -14, y: 214, s: 1.18, z: 10, op: 0.6 },
    { k: 'code', t: w.code[2], x: 31, y: 86, s: 1.32, z: 40, op: 0.65 },
    { k: 'pill', t: 'SEE THE WORK', x: -26, y: 58, s: 1.36, z: 30, op: 1, go: 'work' },
    { k: 'pill', t: 'START A PROJECT', x: 33, y: -36, s: 0.9, rot: -12, z: 60, op: 1, go: 'contact' },
  ]
}
const TRAVEL = 430 // vh travelled by a speed-1 word over the whole fall
const WRAP = 135 // words recycle between -WRAP and +WRAP vh

export function createLeap(ctx) {
  const { content, go } = ctx
  const c = content

  const section = el('section.scene#leap', { 'aria-label': 'The leap' }, [
    el('h1.sr-only', { text: `${c.brand.name}, ${c.brand.role.toLowerCase()}` }),
    el('p.sr-only', { html: c.brand.intro }),
    ...c.leap.captions.map((t) => el('p.sr-only', { text: t })),
  ])

  // --- hero title + intro
  const titleInner = el('span.t-inner.extrude', { text: c.brand.name })
  const title = el('div.abs.display.leap-title', { style: { fontSize: `clamp(22px, ${fit(c.brand.name, 11.4, 74).toFixed(2)}vw, 220px)` } }, [titleInner])
  const intro = el('p.leap-intro.serif', { html: c.brand.intro })
  const heroLayer = el('div.layer', {}, [intro, title])

  // --- word field
  const field = el('div.leap-field')
  const words = fieldFrom(c.leap.words).map((f) => {
    let node
    if (f.k === 'pill') {
      node = el('a.w.is-pill.pill.ui.hit', { href: '#' + f.go }, [el('span.plus', { text: '+' }), f.t])
      node.addEventListener('click', (e) => {
        e.preventDefault()
        go(f.go)
      })
    } else if (f.k === 'serif') {
      node = el('div.w.is-serif', { text: f.t, style: { fontSize: f.size + 'vw' } })
    } else if (f.k === 'code') {
      node = el('div.w.is-code', { text: f.t })
    } else if (f.k.startsWith('outline')) {
      node = el('div.w.is-outline' + (f.k.includes('gold') ? '.is-gold' : ''), { text: f.t, style: { fontSize: f.size + 'vw' } })
    } else {
      node = el('div.w.display.extrude' + (f.k.includes('gold') ? '.is-gold' : ''), { text: f.t, style: { fontSize: f.size + 'vw' } })
    }
    field.append(node)
    return { ...f, node }
  })
  const fieldLayer = el('div.layer', {}, [field])

  // --- captions (difference blend: blue over gold, white over shadow)
  const caps = c.leap.captions.map((t) => el('p.cap', { text: t, 'aria-hidden': 'true' }))
  const capLayer = el('div.layer.is-diff', {}, caps)
  const CAPW = [
    [0.05, 0.3],
    [0.27, 0.52],
    [0.49, 0.73],
    [0.7, 1.02],
  ]

  let vw = window.innerWidth
  let vh = window.innerHeight
  let introT = 0 // 0..1 hero intro animation (set by app after loading)

  const scene = {
    id: 'leap',
    section,
    layers: [heroLayer, fieldLayer, capLayer],
    vh: 640,
    chain: false,
    p: 0,
    resize(w, h) {
      vw = w
      vh = h
    },
    setIntro(v) {
      introT = v
      if (scene.on) scene.update(scene.p, scene.state)
    },
    update(p) {
      scene.p = p
      const mx = ctx.cursor.snx
      const my = ctx.cursor.sny

      // hero title: we fall past it
      const tp = smoothRange(p, 0, 0.075)
      const ti = expoOut(introT)
      const tScale = lerp(0.72, 1, ti) * (1 + tp * 0.9)
      const ty = lerp(10, 6, ti) * vh * 0.01 - tp * vh * 0.95
      title.style.transform = `translate(-50%, -50%) translate3d(${mx * -8}px, ${ty + my * 6}px, 0) scale(${tScale})`
      title.style.opacity = clamp(ti * 1.4) * (1 - smoothRange(p, 0.035, 0.08))
      title.style.filter = tp > 0.01 ? `blur(${(tp * 10).toFixed(2)}px)` : 'none'
      intro.style.opacity = clamp(ti * 1.2 - 0.2) * (1 - smoothRange(p, 0.0, 0.035))
      intro.style.transform = `translate3d(0, ${-p * vh * 1.6}px, 0)`

      // word field
      const fin = smoothRange(p, 0.012, 0.055)
      const fout = 1 - smoothRange(p, 0.8, 0.9)
      const sway = ctx.reduced ? 0 : Math.sin(p * 9) * 1.6
      field.style.transform = `rotate(${sway}deg)`
      for (const w of words) {
        const yv = wrap(w.y - p * TRAVEL * w.s, -WRAP, WRAP)
        const x = (w.x * vw) / 100 + mx * w.z * 0.05
        const y = (yv * vh) / 100 - my * w.z * 0.04
        const ghost = w.ghost ? 0.32 * ti : 0
        const o = w.op * Math.max(ghost, fin) * fout
        let tr = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${w.z}px)`
        if (w.rot) tr += ` rotate(${w.rot}deg)`
        if (w.skew) tr += ` skewX(${w.skew}deg)`
        w.node.style.transform = tr
        w.node.style.opacity = o.toFixed(3)
        if (w.ghost) w.node.style.filter = fin < 0.95 ? `blur(${((1 - fin) * 5).toFixed(2)}px)` : 'none'
        w.node.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      }

      // captions
      caps.forEach((cap, i) => {
        const [a, b] = CAPW[i]
        const lp = range(p, a, b)
        const last = i === CAPW.length - 1
        const yv = last ? lerp(38, -40, Math.pow(lp, 0.85)) : lerp(36, -36, lp)
        const o = last ? smoothRange(lp, 0, 0.12) * (1 - smoothRange(p, 0.985, 1)) : window01(lp, 0, 1, 0.2)
        cap.style.transform = `translate(-50%, -50%) translate3d(0, ${(yv * vh) / 100}px, 0)`
        cap.style.opacity = o.toFixed(3)
      })

    },
    render(r, t) {
      const st = scene.state
      if (!st.visible || st.p >= 0.999) return false
      const p = st.p
      r.add({
        scene: 'leap',
        rect: { x: 0, y: 0, w: vw, h: vh },
        uniforms: {
          uFall: p * 9 + t * 0.22,
          uTilt: lerp(0.3, 0.03, smoothRange(p, 0, 0.12)),
          uBeam: 1,
          uWidth: lerp(1.3, 0.9, smoothRange(p, 0, 0.15)),
          uSpill: lerp(1, 0.3, smoothRange(p, 0.02, 0.18)),
          uShaft: smoothRange(p, 0.08, 0.2) * (1 - 0.5 * smoothRange(p, 0.8, 0.95)),
          uSpark: 0.25 + 0.75 * smoothRange(p, 0.05, 0.2),
          uRib: smoothRange(p, 0.24, 0.38) * (1 - 0.7 * smoothRange(p, 0.78, 0.9)),
          uBurst: smoothRange(p, 0.74, 0.93),
          uWhite: smoothRange(p, 0.9, 0.995),
          uFig: 1 - smoothRange(p, 0.93, 0.99),
          uSpinFig: p * 2.4,
          uMouse: [ctx.cursor.snx, ctx.cursor.sny],
        },
      })
      return true
    },
  }
  return scene
}
