import { el, lerp, range, smoothRange, expoOut } from '../lib/util.js'

/** White flash, then IMPACT slams into the frame and shakes it. */
export function createImpact(ctx) {
  const { content } = ctx
  const section = el('section.scene#impact', { 'aria-label': 'Impact' }, [el('h2.sr-only', { text: content.impact })])
  const bg = el('div.impact-bg')
  const bgLayer = el('div.layer', {}, [bg])
  const word = el('div.abs.display.impact-word', { text: content.impact, 'aria-hidden': 'true' })
  const wordLayer = el('div.layer', {}, [word])
  let hit = false

  const scene = {
    id: 'impact',
    section,
    layers: [bgLayer, wordLayer],
    vh: 210,
    chain: true,
    update(p) {
      // slam
      const a = expoOut(range(p, 0.0, 0.11))
      let s = lerp(2.5, 1, a)
      let blur = lerp(26, 0, a)
      let o = range(p, 0, 0.05)
      // shake right after the hit
      const sk = 1 - range(p, 0.06, 0.22)
      const amp = p > 0.06 && p < 0.22 ? sk * sk * 16 : 0
      const x = Math.sin(p * 913) * amp
      const y = Math.cos(p * 1187) * amp * 0.6
      // hold, then fall through it
      s *= 1 + 0.06 * range(p, 0.11, 0.6)
      const e = smoothRange(p, 0.6, 0.8)
      s *= 1 + 0.55 * e
      o *= 1 - e
      blur += 14 * e
      word.style.transform = `translate(-50%, -52%) translate3d(${x}px, ${y}px, 0) scale(${s})`
      word.style.opacity = o.toFixed(3)
      word.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none'
      bg.style.opacity = (1 - smoothRange(p, 0.7, 0.97)).toFixed(3)

      if (p > 0.05 && !hit) {
        hit = true
        ctx.sound.boom()
      } else if (p < 0.02) hit = false
    },
  }
  return scene
}
