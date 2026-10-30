import { el, lerp, range, smoothRange, window01, clamp, easeOut, keepInside, clearOfBars } from '../lib/util.js'

// Positions of the "noise" (client clichés) in vw / vh from centre.
const PHRASES = [
  { x: -23, y: 30, s: 0.95 },
  { x: 30, y: 32, s: 1.0 },
  { x: 31, y: 44, s: 1.15, r: 5 },
  { x: -30, y: -28, s: 0.8 },
  { x: -25, y: -21, s: 0.85 },
  { x: -27, y: 54, s: 1.2 },
  { x: 33, y: 62, s: 1.1 },
  { x: 35, y: -30, s: 0.9 },
  { x: -6, y: 70, s: 1.3 },
]

export function createNoise(ctx) {
  const { content, stage } = ctx
  const n = content.noise
  const section = el('section.scene#noise', { 'aria-label': 'The noise' }, [
    el('h2.sr-only', { text: 'The noise' }),
    ...n.captions.map((t) => el('p.sr-only', { text: t })),
  ])

  const word = el('div.abs.display.outline.noise-word', { text: n.word, 'aria-hidden': 'true' })
  const phrases = n.phrases.map((t, i) => ({ ...(PHRASES[i] || { x: 0, y: 40, s: 1 }), node: el('div.abs.phrase', { text: t }) }))
  const CODE_AT = [
    { x: 22, y: -12, s: 0.9 },
    { x: -14, y: 86, s: 1.25 },
  ]
  const code = (n.code || []).map((t, i) => ({ ...CODE_AT[i % CODE_AT.length], node: el('div.abs.phrase.is-code', { text: t }) }))
  const shout = { x: -33, y: 36, s: 1.05, node: el('div.abs.phrase.is-shout', { text: n.shout }) }
  const bits = [...phrases, ...code, shout]
  const bigLayer = el('div.layer', { 'aria-hidden': 'true' }, [word, ...bits.map((b) => b.node)])
  const caps = n.captions.map((t) => el('p.cap.is-glow', { text: t, 'aria-hidden': 'true' }))
  const capLayer = el('div.layer.is-diff', {}, caps)

  let vw = window.innerWidth
  let vh = window.innerHeight
  let sized = false // widths of the bits, measured on screen

  const scene = {
    id: 'noise',
    section,
    layers: [bigLayer, capLayer],
    vh: 470,
    chain: true,
    resize(w, h) {
      vw = w
      vh = h
      sized = false
    },
    update(p) {
      if (!sized) {
        for (const b of bits) {
          b.w = b.node.offsetWidth
          b.h = b.node.offsetHeight
        }
        for (const c of caps) c.h = c.offsetHeight
        sized = true
      }
      const bars = ctx.hud.bars
      const ex = smoothRange(p, 0.55, 0.64) // the shockwave scatters the noise

      // NOISE outline rising through the frame
      const wy = lerp(92, -80, range(p, 0.08, 0.6))
      const wo = window01(p, 0.08, 0.6, 0.18) * (1 - ex)
      word.style.transform = `translate(-50%, -50%) translate3d(0, ${(wy * vh) / 100}px, 0) scale(${1 + ex * 0.4})`
      word.style.opacity = wo.toFixed(3)

      for (const b of bits) {
        const y = b.y - range(p, 0, 0.62) * 70 * b.s
        const sx = 1 + ex * 0.7
        // they drift up the screen and fade before they reach the bar
        const o = window01(p, 0.03, 0.62, 0.12) * (1 - ex) * clearOfBars(vh / 2 + (y * sx * vh) / 100, b.h / 2, bars)
        // on screen until the shockwave throws them outwards
        const x = keepInside((b.x * vw) / 100, b.w, vw) * sx
        b.node.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${(y * sx * vh) / 100}px, 0) rotate(${b.r || 0}deg) scale(${1 + ex * 0.6})`
        b.node.style.opacity = o.toFixed(3)
        b.node.style.filter = ex > 0.02 ? `blur(${(ex * 8).toFixed(1)}px)` : ''
      }

      // captions
      const c0 = range(p, 0.0, 0.47)
      const y0 = (lerp(31, -30, c0) * vh) / 100
      caps[0].style.transform = `translate(-50%, -50%) translate3d(0, ${y0}px, 0)`
      caps[0].style.opacity = (window01(c0, 0, 1, 0.16) * (1 - ex) * clearOfBars(vh / 2 + y0, caps[0].h / 2, bars)).toFixed(3)
      const c1 = range(p, 0.66, 1.0)
      caps[1].style.transform = `translate(-50%, -50%) translate3d(0, ${(lerp(30, 2, easeOut(c1)) * vh) / 100}px, 0)`
      caps[1].style.opacity = smoothRange(c1, 0, 0.18).toFixed(3)
    },
  }

  /**
   * One crowd shot spans IMPACT -> NOISE -> RISE -> GALLERY, so its camera and
   * effects are driven here from all four scene progressions.
   */
  scene.render = (r, t) => {
    const imp = stage.get('impact').state
    const noi = stage.get('noise').state
    const ris = stage.get('rise').state
    const gal = stage.get('gallery').state
    let u
    let rect = { x: 0, y: 0, w: vw, h: vh }
    let alpha = 1
    const mouse = [ctx.cursor.snx, ctx.cursor.sny]
    const base = { uTilt: 0.45, uEmber: 1, uExplode: 0, uRise: 0, uPush: 0, uDesat: 0, uSun: 0, uExpo: 1, uMouse: mouse }

    if (gal.visible && gal.top <= 0.5) {
      const g = gal.p
      const k = smoothRange(g, 0.0, 0.2)
      const card = ctx.galleryCard?.()
      if (card) {
        rect = {
          x: lerp(0, card.x, k),
          y: lerp(0, card.y, k),
          w: lerp(vw, card.w, k),
          h: lerp(vh, card.h, k),
        }
      }
      alpha = 1 - smoothRange(g, 0.86, 0.98)
      u = { ...base, uZoom: 1.2 + 0.15 * g, uRise: 1, uEmber: 0.6, uPush: 0.45, uExpo: 1.05 }
    } else if (ris.visible && ris.top <= 0.5) {
      const q = ris.p
      u = {
        ...base,
        uZoom: lerp(0.98, 1.2, q),
        uRise: smoothRange(q, 0.1, 0.45),
        uEmber: lerp(1.15, 0.6, smoothRange(q, 0.1, 0.5)),
        uPush: lerp(0.36, 0.45, q),
      }
    } else if (noi.visible && noi.top <= 0.5) {
      const q = noi.p
      const E = range(q, 0.55, 0.78)
      u = {
        ...base,
        uZoom: lerp(1.55, 1.0, easeOut(range(q, 0, 0.16))) - 0.04 * range(q, 0.16, 0.55),
        uExplode: E > 0 && E < 1 ? E : 0,
        uPush: 0.36 * smoothRange(q, 0.55, 0.8),
        uEmber: lerp(1, 1.15, smoothRange(q, 0.75, 0.95)),
      }
    } else if (imp.visible && imp.p > 0.5) {
      u = { ...base, uZoom: lerp(2.3, 1.55, easeOut(range(imp.p, 0.5, 1))) }
    }
    if (!u) return false
    r.add({ scene: 'crowd', rect, uniforms: u, alpha: clamp(alpha) })
    return true
  }
  return scene
}
