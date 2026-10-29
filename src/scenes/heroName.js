import gsap from 'gsap'
import { el, clamp, lerp, smoothRange, expoOut } from '../lib/util.js'

// steady pseudo-random 0..1 per letter, so the burst looks the same every visit
const rand = (i) => {
  const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453
  return s - Math.floor(s)
}

// the surname's variable-font axes: at rest, and at the top of the swell
const REST = { wght: 760, wdth: 92 }
const PEAK = { wght: 900, wdth: 122 }

/**
 * The name in the hero: a serif italic first name and a heavy grotesk surname, one span per
 * letter. The letters rise into place, the surname swells like a wave (towards the mouse, with
 * the phone's tilt, or drifting on its own) and the whole name bursts apart in 3D as the visitor
 * scrolls, falling past it.
 */
export function createHeroName(ctx, fullName) {
  const [head, ...tail] = fullName.split(' ')
  const parts = [head.charAt(0) + head.slice(1).toLowerCase(), tail.join(' ')].filter(Boolean)
  const letters = []
  const words = parts.map((text, w) =>
    el(
      `span.t-word.${w ? 'is-last' : 'is-first'}`,
      {},
      [...text].map((ch, k) => {
        const node = el('span.t-ch', { text: ch })
        const i = letters.length
        letters.push({ node, w, k, a: rand(i), b: rand(i + 17), cx: 0, wght: 0, wdth: 0 })
        return node
      }),
    ),
  )
  const node = el('div.abs.leap-title', { 'aria-hidden': 'true' }, words)
  const swells = letters.filter((l) => l.w === 1)
  const clock = { t: 0 } // seconds since the name began to appear

  let width = 1 // fitted name, px
  let lastCx = 0 // surname centre and width, px from the name's centre
  let lastW = 1

  return {
    node,

    // fit the name to the screen (in its resting shape) and note where every letter sits
    measure(vw, vh) {
      for (const l of swells) {
        l.node.style.fontWeight = ''
        l.node.style.fontStretch = ''
        l.wght = l.wdth = 0
      }
      node.style.fontSize = '100px'
      const portrait = vh > vw
      // room is left for the surname's swell
      const fs = Math.min(((portrait ? 0.8 : 0.78) * vw * 100) / node.offsetWidth, ((portrait ? 0.3 : 0.34) * vh * 100) / node.offsetHeight)
      node.style.fontSize = fs.toFixed(1) + 'px'
      width = node.offsetWidth
      for (const l of letters) l.cx = l.node.offsetLeft + l.node.offsetWidth / 2 - width / 2
      if (swells.length) {
        const first = swells[0].node
        const end = swells[swells.length - 1].node
        lastW = end.offsetLeft + end.offsetWidth - first.offsetLeft
        lastCx = first.offsetLeft + lastW / 2 - width / 2
      }
    },

    // the name starts to rise (the clock runs the intro; with reduced motion it is simply there)
    start(delay = 0) {
      if (ctx.reduced) clock.t = 10
      else gsap.to(clock, { t: 10, duration: 10, ease: 'none', delay })
    },

    // beat: the music's kick envelope (0..1), which makes the whole surname thump
    update(p, vw, vh, beat = 0) {
      const t = clock.t
      const now = performance.now() / 1000
      const burst = ctx.reduced ? 0 : smoothRange(p, 0.004, 0.07)
      const settled = smoothRange(t, 1.5, 2.6)
      node.classList.toggle('is-revealing', t < 2.4)

      // where the surname swells: under the mouse, or drifting by itself (tilting a phone steers it)
      const cur = ctx.cursor
      const fx = cur.enabled && now - cur.movedAt < 2.5 ? cur.x - vw / 2 : lastCx + (Math.sin(now * 0.55) * 0.85 + cur.snx * 0.8) * lastW * 0.5

      for (const l of letters) {
        // rise from behind the mask: first name first, a beat later the surname
        const li = expoOut(clamp((t - l.w * 0.28 - l.k * 0.065) / 1.25))
        const rise = (1 - li) * 160
        const lean = l.w ? 0 : (1 - li) * 14
        // burst: out from the centre, up, towards the viewer, tumbling
        const dir = l.cx / (width / 2)
        const x = (dir * 0.42 + (l.a - 0.5) * 0.12) * burst * vw
        const y = -(0.16 + l.b * 0.42) * burst * vh
        const z = (160 + l.a * 520) * burst
        const rx = (l.a - 0.5) * 80 * burst
        const rz = (l.b - 0.5) * 100 * burst + lean
        l.node.style.transform = `translateY(${rise.toFixed(1)}%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rx.toFixed(1)}deg) rotate(${rz.toFixed(2)}deg)`
        l.node.style.opacity = (1 - smoothRange(p, 0.03 + l.a * 0.025, 0.075)).toFixed(3)

        if (l.w === 1 && !ctx.reduced) {
          // grows from thin and narrow while it rises, then swells near the focus
          const d = (l.cx - fx) / (lastW * 0.24)
          const k = Math.min(1, Math.exp(-d * d) + beat * 0.5) * settled * (1 - burst)
          const wght = lerp(lerp(250, REST.wght, li), PEAK.wght, k)
          const wdth = lerp(lerp(62, REST.wdth, li), PEAK.wdth, k)
          if (Math.abs(wght - l.wght) > 2 || Math.abs(wdth - l.wdth) > 0.3) {
            l.wght = wght
            l.wdth = wdth
            l.node.style.fontWeight = wght.toFixed(0)
            l.node.style.fontStretch = wdth.toFixed(1) + '%'
          }
        }
      }
    },
  }
}
