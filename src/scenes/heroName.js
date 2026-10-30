import gsap from 'gsap'
import { el, clamp, lerp, range, smooth, smoothRange, expoOut } from '../lib/util.js'

// steady pseudo-random 0..1 per letter, so every visit looks the same
const rand = (i) => {
  const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453
  return s - Math.floor(s)
}

// the surname's variable-font axes: at rest, and at the top of the swell
const REST = { wght: 760, wdth: 92 }
const PEAK = { wght: 900, wdth: 122 }

// the part of the fall (leap progress) over which the letters fly up into the bar, and the delay
// between two letters taking off (in that part's progress)
const DOCK = [0.003, 0.085]
const STAGGER = 0.042

/**
 * The name in the hero: a serif italic first name and a heavy grotesk surname, one span per
 * letter. The letters rise into place and the surname swells like a wave (towards the mouse, with
 * the phone's tilt, or drifting on its own). As the visitor scrolls, falling past it, the letters
 * take off one after another, fly up into the bar and land on the small name there.
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
        // at: which character of the full name this is (the space between the names is skipped)
        letters.push({ node, w, k, i, at: w ? head.length + 1 + k : k, a: rand(i), cx: 0, cy: 0, wght: 0, wdth: 0, tx: 0, ty: 0, ts: 1 })
        return node
      }),
    ),
  )
  const node = el('div.abs.leap-title', { 'aria-hidden': 'true' }, words)
  const swells = letters.filter((l) => l.w === 1)
  const clock = { t: 0 } // seconds since the name began to appear

  let lastCx = 0 // surname centre and width, px from the name's centre
  let lastW = 1
  const landed = [...fullName].map(() => 1) // per character of the name in the bar: how far its letter has landed
  const size = { w: 0, h: 0 } // the fitted name, px

  return {
    node,
    size,

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
      const width = (size.w = node.offsetWidth)
      const height = (size.h = node.offsetHeight)
      for (const l of letters) {
        l.cx = l.node.offsetLeft + l.node.offsetWidth / 2 - width / 2
        l.cy = l.node.offsetTop + l.node.offsetHeight / 2 - height / 2
      }
      if (swells.length) {
        const first = swells[0].node
        const end = swells[swells.length - 1].node
        lastW = end.offsetLeft + end.offsetWidth - first.offsetLeft
        lastCx = first.offsetLeft + lastW / 2 - width / 2
      }

      // every letter lands on its own character of the name in the bar, at that size
      const chars = ctx.hud.nameChars
      const small = parseFloat(getComputedStyle(chars[0]).fontSize)
      for (const l of letters) {
        const r = chars[l.at].getBoundingClientRect()
        l.tx = r.left + r.width / 2
        l.ty = r.top + r.height / 2
        l.ts = small / parseFloat(getComputedStyle(l.node).fontSize)
      }
    },

    // the name starts to rise (the clock runs the intro; with reduced motion it is simply there)
    start(delay = 0) {
      if (ctx.reduced) clock.t = 10
      else gsap.to(clock, { t: 10, duration: 10, ease: 'none', delay })
    },

    // how far each character of the bar's name has been landed on (0..1)
    dock() {
      return landed
    },

    // beat: the music's kick envelope (0..1), which makes the whole surname thump
    // at: where the name's centre is on screen (px), so the letters can find the bar from there
    update(p, vw, vh, beat = 0, at = { x: vw / 2, y: vh / 2 }) {
      const t = clock.t
      const now = performance.now() / 1000
      const settled = smoothRange(t, 1.5, 2.6)
      // the line the letters rise from goes as soon as they start to leave
      node.classList.toggle('is-revealing', t < 2.4 && p < 0.003)
      // the swell gives way as the name leaves
      const calm = 1 - smoothRange(p, 0.002, 0.02)
      const e = range(p, DOCK[0], DOCK[1])
      const flight = 1 - (letters.length - 1) * STAGGER
      landed.fill(1)

      // where the surname swells: under the mouse, or drifting by itself (tilting a phone steers it)
      const cur = ctx.cursor
      const fx = cur.enabled && now - cur.movedAt < 2.5 ? cur.x - vw / 2 : lastCx + (Math.sin(now * 0.55) * 0.85 + cur.snx * 0.8) * lastW * 0.5

      for (const l of letters) {
        // rise from behind the mask: first name first, a beat later the surname
        const li = expoOut(clamp((t - l.w * 0.28 - l.k * 0.065) / 1.25))
        const rise = (1 - li) * 160
        const lean = l.w ? 0 : (1 - li) * 14
        // take off in reading order and fly up into the bar (up first, then across), shrinking to
        // the small name's size with a little spin on the way, and land on its character
        const q = ctx.reduced ? 0 : clamp((e - l.i * STAGGER) / flight)
        const k = smooth(q)
        const x = (l.tx - at.x - l.cx) * Math.pow(k, 1.7)
        const y = (l.ty - at.y - l.cy) * k
        const s = Math.pow(l.ts, k)
        const rz = Math.sin(q * Math.PI) * (l.a - 0.5) * 60 + lean
        l.node.style.transform = `translateY(${rise.toFixed(1)}%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rz.toFixed(2)}deg) scale(${s.toFixed(4)})`
        const land = ctx.reduced ? smoothRange(p, 0.02, 0.05) : smoothRange(q, 0.8, 1)
        l.node.style.opacity = (1 - land).toFixed(3)
        landed[l.at] = land

        if (l.w === 1 && !ctx.reduced) {
          // grows from thin and narrow while it rises, then swells near the focus
          const d = (l.cx - fx) / (lastW * 0.24)
          const k = Math.min(1, Math.exp(-d * d) + beat * 0.5) * settled * calm
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
