import { el, lerp, range, smoothRange, window01, easeOut, easeInOut } from '../lib/util.js'

/** Every fall needs a way out: a door opens in the storm and someone walks out. */
export function createPortal(ctx) {
  const { content, copyEmail, go } = ctx
  const c = content.portal
  const section = el('section.scene#portal', { 'aria-label': 'The portal' }, [
    el('h2.sr-only', { text: 'The portal' }),
    ...c.captions.map((t) => el('p.sr-only', { text: t })),
    el('p.sr-only', { text: c.cta.replace(/\n/g, ' ') }),
  ])

  const caps = c.captions.map((t) => el('p.cap.is-glow.portal-cap', { text: t, 'aria-hidden': 'true' }))
  // CTA headline, one line per \n, each rising into place
  const lines = c.cta.split('\n')
  const lineNodes = lines.map((t) => el('span', { text: t }))
  const head = el('h2.abs.display.cta-head', { 'aria-hidden': 'true' }, lineNodes.map((s) => el('span.ln', {}, [s])))
  const diffLayer = el('div.layer.is-diff', {}, [...caps, head])

  const write = el('a.pill.is-light.is-big.ui.hit', { href: `mailto:${content.contact.email}`, text: c.primary })
  const copy = el('button.pill.is-ghost.is-big.ui.hit', { type: 'button', text: c.secondary })
  copy.addEventListener('click', copyEmail)
  const btns = el('div.cta-btns', {}, [write, copy])
  const btnLayer = el('div.layer', {}, [btns])

  let vw = window.innerWidth
  let vh = window.innerHeight
  const W = [
    [0.02, 0.3],
    [0.3, 0.56],
    [0.56, 0.8],
  ]

  const scene = {
    id: 'portal',
    section,
    layers: [diffLayer, btnLayer],
    vh: 800,
    chain: false,
    resize(w, h) {
      vw = w
      vh = h
    },
    update(p) {
      caps.forEach((cap, i) => {
        const [a, b] = W[i]
        const lp = range(p, a, b)
        cap.style.transform = `translate(-50%, -50%) translate3d(0, ${(lerp(2.5, -2.5, lp) * vh) / 100}px, 0)`
        cap.style.opacity = window01(lp, 0, 1, 0.2).toFixed(3)
      })
      const h = range(p, 0.83, 0.92)
      lineNodes.forEach((n, i) => {
        const a = easeOut(range(h, i * 0.12, 0.55 + i * 0.12))
        n.style.transform = `translate3d(0, ${(1 - a) * 105}%, 0)`
      })
      head.style.transform = `translate(-50%, -58%) scale(${lerp(1.06, 1, easeOut(h))})`
      head.style.opacity = h > 0 ? '1' : '0'
      const b = easeOut(range(p, 0.89, 0.95))
      btns.style.transform = `translate(-50%, 0) translate3d(0, ${(1 - b) * 30 + vh * 0.2}px, 0)`
      btns.style.opacity = b.toFixed(3)
      btns.style.visibility = b < 0.01 ? 'hidden' : 'visible'
    },
    render(r, t) {
      const st = scene.state
      if (!st.visible) return false
      const p = st.p
      const walk = lerp(0, 0.6, easeInOut(range(p, 0.4, 0.8))) + lerp(0, 0.27, easeOut(range(p, 0.8, 0.97)))
      r.add({
        scene: 'portal',
        rect: { x: 0, y: 0, w: vw, h: vh },
        uniforms: {
          uOpen: lerp(0, 0.3, smoothRange(p, 0.05, 0.18)) + lerp(0, 0.7, smoothRange(p, 0.18, 0.34)),
          uHalo: smoothRange(p, 0.22, 0.32) * (1 - smoothRange(p, 0.46, 0.58)),
          uFlare: smoothRange(p, 0.25, 0.38) * (1 - 0.8 * smoothRange(p, 0.46, 0.62)),
          uBolt: smoothRange(p, 0.4, 0.76),
          uWalk: walk,
          uFigure: smoothRange(p, 0.38, 0.43),
          uZoom: lerp(1, 2.55, easeInOut(range(p, 0.6, 0.96))),
          uGlow: lerp(0.08, 1, smoothRange(p, 0.05, 0.45)),
          uMouse: [ctx.cursor.snx, ctx.cursor.sny],
        },
      })
      return true
    },
  }
  return scene
}
