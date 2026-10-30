import gsap from 'gsap'
import { el, lerp, range, smoothRange, window01, wrap, expoOut, clamp, keepInside, clearOf, clearOfBars, textSize } from '../lib/util.js'
import { createHeroName } from './heroName.js'

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
const PERSPECTIVE = 1400 // px, as on .leap-field

export function createLeap(ctx) {
  const { content, go } = ctx
  const c = content

  const section = el('section.scene#leap', { 'aria-label': 'The leap' }, [
    el('h1.sr-only', { text: `${c.brand.name}, ${c.brand.role.toLowerCase()}` }),
    el('p.sr-only', { html: c.brand.intro }),
    ...c.leap.captions.map((t) => el('p.sr-only', { text: t })),
  ])

  // --- hero name + intro (portrait screens stack the two names)
  const hero = createHeroName(ctx, c.brand.name)
  const title = hero.node
  // the intro line, and a way into the soundtrack (it hides once the sound is on)
  let soundBtn = null
  if (c.music) {
    soundBtn = el('button.pill.ui.hit.leap-sound', { type: 'button' }, [el('span.plus', { text: '♪' }), 'PLAY SOUNDTRACK'])
    soundBtn.addEventListener('click', () => ctx.toggleSound())
  }
  const intro = el('div.leap-intro', {}, [el('p.serif', { html: c.brand.intro }), soundBtn])
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
      node = el('div.w.is-serif', { text: f.t, style: { fontSize: `max(13px, ${f.size}vw)` } })
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

  // --- captions (difference blend: blue over gold, white over shadow), and the scroll cue,
  // which needs the same blend to read on the bright beam
  const caps = c.leap.captions.map((t) => el('p.cap', { text: t, 'aria-hidden': 'true' }))
  const cue = el('div.leap-cue.ui', { 'aria-hidden': 'true' }, [el('span', { text: 'SCROLL TO FALL' }), el('i')])
  const capLayer = el('div.layer.is-diff', {}, [...caps, cue])
  const CAPW = [
    [0.05, 0.3],
    [0.27, 0.52],
    [0.49, 0.73],
    [0.7, 1.02],
  ]

  let vw = window.innerWidth
  let vh = window.innerHeight
  let introT = 0 // 0..1 hero intro animation (set by app after loading)
  const cueIn = { v: 0 } // the scroll cue arrives once the letters have landed
  // where the name rests, in vh below the centre: under the falling figure
  const restY = (w, h) => (h > w ? 17 : 15)
  let titleY = restY(vw, vh)

  // sizes of the words (their rotated bounds) and of the caption text, measured on screen
  const capBox = caps.map(() => ({ x: 0, y: 0, w: 0, h: 0, o: 0 }))
  let sized = false
  const measure = () => {
    for (const w of words) {
      const a = ((w.rot || 0) * Math.PI) / 180
      const ow = w.node.offsetWidth
      const oh = w.node.offsetHeight
      w.w = Math.abs(ow * Math.cos(a)) + Math.abs(oh * Math.sin(a))
      w.h = Math.abs(ow * Math.sin(a)) + Math.abs(oh * Math.cos(a))
    }
    caps.forEach((cap, i) => Object.assign(capBox[i], textSize(cap)))
    hero.measure(vw, vh)
    sized = true
  }

  const scene = {
    id: 'leap',
    section,
    layers: [heroLayer, fieldLayer, capLayer],
    vh: 640,
    chain: false,
    // the name lands in the bar and the words and captions keep clear of it themselves
    clear: false,
    p: 0,
    resize(w, h) {
      vw = w
      vh = h
      titleY = restY(w, h)
      sized = false
    },
    setIntro(v) {
      introT = v
      if (scene.on) scene.update(scene.p, scene.state)
    },
    // the name rises into place while the loader lifts; the scroll cue follows once it has landed
    dropIn(delay = 0) {
      hero.start(delay)
      gsap.to(cueIn, { v: 1, duration: 0.9, delay: delay + 2, ease: 'power2.out' })
    },
    // how far the hero's letters have landed on the bar's name, one by one
    dock: () => hero.dock(),
    update(p) {
      scene.p = p
      if (!sized) measure()
      const mx = ctx.cursor.snx
      const my = ctx.cursor.sny

      // hero name: rises in, then flies up into the bar as we fall past it (the letters move in heroName)
      const tp = smoothRange(p, 0, 0.075)
      const ti = expoOut(introT)
      const ty = (titleY * vh) / 100 - tp * vh * 0.22
      // it turns slightly towards the mouse (or the way the phone tilts); letters on their way to
      // the bar need a steady name to leave from, so it settles as the scroll starts
      const lean = 1 - smoothRange(p, 0, 0.02)
      const ox = mx * -8 * lean
      const oy = ty + my * 6 * lean
      const turn = `perspective(1000px) rotateX(${(my * 5 * lean).toFixed(2)}deg) rotateY(${(mx * 7 * lean).toFixed(2)}deg)`
      title.style.transform = `translate(-50%, -50%) translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0) ${turn}`
      title.style.opacity = introT > 0 ? '1' : '0'
      hero.update(p, vw, vh, ctx.reduced ? 0 : ctx.sound.kick, { x: vw / 2 + ox, y: vh / 2 + oy })
      intro.style.opacity = clamp(ti * 1.2 - 0.2) * (1 - smoothRange(p, 0.0, 0.035))
      intro.style.transform = `translate3d(0, ${-p * vh * 1.6}px, 0)`
      // the scroll cue comes in once the name has landed and leaves with the first scroll
      cue.style.opacity = (cueIn.v * (1 - smoothRange(p, 0.003, 0.025))).toFixed(3)

      // captions (first, so the pills can keep clear of them)
      caps.forEach((cap, i) => {
        const [a, b] = CAPW[i]
        const lp = range(p, a, b)
        const last = i === CAPW.length - 1
        const yv = last ? lerp(38, -40, Math.pow(lp, 0.85)) : lerp(36, -36, lp)
        capBox[i].y = (yv * vh) / 100
        const o =
          (last ? smoothRange(lp, 0, 0.12) * (1 - smoothRange(p, 0.985, 1)) : window01(lp, 0, 1, 0.2)) *
          clearOfBars(vh / 2 + capBox[i].y, capBox[i].h / 2, ctx.hud.bars)
        capBox[i].o = o
        cap.style.transform = `translate(-50%, -50%) translate3d(0, ${capBox[i].y}px, 0)`
        cap.style.opacity = o.toFixed(3)
      })

      // word field: it comes in once the name has flown up into the bar, and until then the blurred
      // words in the distance keep clear of the name
      const fin = smoothRange(p, 0.045, 0.09)
      const nameBox = { x: ox, y: oy, w: hero.size.w, h: hero.size.h, o: 1 - smoothRange(p, 0.02, 0.045) }
      const fout = 1 - smoothRange(p, 0.8, 0.9)
      const sway = ctx.reduced ? 0 : Math.sin(p * 9) * 1.6
      field.style.transform = `rotate(${sway}deg)`
      for (const w of words) {
        const yv = wrap(w.y - p * TRAVEL * w.s, -WRAP, WRAP)
        let x = (w.x * vw) / 100 + mx * w.z * 0.05
        const y = (yv * vh) / 100 - my * w.z * 0.04
        const ghost = w.ghost ? 0.32 * ti * (1 - smoothRange(p, 0, 0.025)) : 0
        let o = w.op * Math.max(ghost, fin) * fout
        // the hollow giants may run off the edges; everything else stays on screen, and the
        // pills fade while they cross a caption (f: the field's perspective scale at this depth)
        if (!w.k.startsWith('outline')) {
          const f = PERSPECTIVE / (PERSPECTIVE - w.z)
          x = keepInside(x * f, w.w * f, vw) / f
          if (w.k === 'pill') o *= clearOf(x * f, y * f, w.w * f, w.h * f, capBox)
          if (w.ghost) o *= clearOf(x * f, y * f, w.w * f, w.h * f, [nameBox])
          // they fade out before they reach the bar's rows instead of running under them
          o *= clearOfBars(vh / 2 + y * f, (w.h * f) / 2, ctx.hud.bars)
        }
        let tr = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${w.z}px)`
        if (w.rot) tr += ` rotate(${w.rot}deg)`
        if (w.skew) tr += ` skewX(${w.skew}deg)`
        w.node.style.transform = tr
        w.node.style.opacity = o.toFixed(3)
        if (w.ghost) w.node.style.filter = fin < 0.95 ? `blur(${((1 - fin) * 5).toFixed(2)}px)` : 'none'
        w.node.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      }
    },
    render(r, t) {
      const st = scene.state
      if (!st.visible || st.p >= 0.999) return false
      const p = st.p
      const beat = ctx.reduced ? 0 : ctx.sound.kick // the light breathes with the music's kick
      r.add({
        scene: 'leap',
        rect: { x: 0, y: 0, w: vw, h: vh },
        uniforms: {
          uFall: p * 9 + t * 0.22,
          uTilt: lerp(0.3, 0.03, smoothRange(p, 0, 0.12)),
          uBeam: 1,
          uWidth: lerp(1.3, 0.9, smoothRange(p, 0, 0.15)) * (1 + beat * 0.05),
          uSpill: lerp(1, 0.3, smoothRange(p, 0.02, 0.18)) * (1 + beat * 0.35),
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
