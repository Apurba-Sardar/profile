import { el, lerp, range, smoothRange, window01, easeOut } from '../lib/util.js'

// Where every letter of RISE flies in from (vw, vh, deg, scale).
const FROM = [
  { x: -62, y: 14, r: -28, s: 1.35 },
  { x: -4, y: 74, r: 12, s: 0.6 },
  { x: 44, y: -66, r: 38, s: 1.6 },
  { x: 74, y: 22, r: 84, s: 1.2 },
]

// Words around the risen figure.
const SIDE = [
  { word: ['outline', 0], cls: 'display.outline', x: -27, y: -6, size: 5.2, s: 0.9 },
  { word: ['outline', 1], cls: 'display.outline', x: -29, y: -21, size: 5.4, s: 0.7 },
  { word: ['small'], cls: 'display.is-orange', x: -30, y: 30, size: 4.6, s: 1.05 },
  { word: ['big'], cls: 'display.is-yellow', x: -27, y: 40, size: 8.6, s: 1.1 },
  { phrase: 0, cls: 'phrase', x: 33, y: -26, s: 0.8 },
  { phrase: 1, cls: 'phrase', x: 12, y: 18, s: 1.0 },
  { phrase: 2, cls: 'phrase', x: 36, y: 15, s: 0.9 },
  { pill: true, x: 30, y: 7, s: 0.95 },
]

export function createRise(ctx) {
  const { content, go } = ctx
  const r = content.rise
  const section = el('section.scene#rise', { 'aria-label': 'Rise' }, [
    el('h2.sr-only', { text: r.word }),
    el('p.sr-only', { text: r.caption }),
  ])

  const letters = [...r.word].map((ch) => el('span', { text: ch }))
  const wordWrap = el('div.abs.display.rise-word', { 'aria-hidden': 'true' }, letters)
  const cap = el('p.cap.is-glow', { text: r.caption, 'aria-hidden': 'true' })
  const diffLayer = el('div.layer.is-diff', {}, [wordWrap, cap])

  const side = SIDE.map((s) => {
    let node
    if (s.pill) {
      node = el('a.pill.ui.hit', { href: '#work' }, [el('span.plus', { text: '+' }), 'SEE THE WORK'])
      node.addEventListener('click', (e) => {
        e.preventDefault()
        go('work')
      })
    } else if (s.phrase !== undefined) {
      node = el('div.' + s.cls, { text: r.phrases[s.phrase] })
    } else {
      const [k, i] = s.word
      const t = i === undefined ? r.side[k] : r.side[k][i]
      const size = Math.min(s.size, 40 / (t.length * 0.8))
      node = el('div.' + s.cls, { text: t, style: { fontSize: size + 'vw' } })
    }
    node.classList.add('w')
    return { ...s, node }
  })
  const sideLayer = el('div.layer.rise-side', {}, side.map((s) => s.node))

  let vw = window.innerWidth
  let vh = window.innerHeight

  const scene = {
    id: 'rise',
    section,
    layers: [sideLayer, diffLayer],
    vh: 360,
    chain: true,
    resize(w, h) {
      vw = w
      vh = h
    },
    update(p) {
      // assemble
      letters.forEach((l, i) => {
        const f = FROM[i % FROM.length]
        const a = easeOut(range(p, 0.02 + i * 0.03, 0.27 + i * 0.03))
        const x = ((1 - a) * f.x * vw) / 100
        const y = ((1 - a) * f.y * vh) / 100
        l.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${(1 - a) * f.r}deg) scale(${lerp(f.s, 1, a)})`
        l.style.opacity = range(p, 0.01 + i * 0.03, 0.08 + i * 0.03).toFixed(3)
      })
      // recede above the standing figure
      const k = smoothRange(p, 0.48, 0.76)
      const wy = lerp(0, -1, k)
      wordWrap.style.transform = `translate(-50%, -50%) translate3d(0, ${(wy * vh) / 100}px, 0) scale(${lerp(1, 0.5, k)})`
      wordWrap.style.opacity = (1 - smoothRange(p, 0.86, 0.98)).toFixed(3)

      const cp = range(p, 0.22, 0.95)
      cap.style.transform = `translate(-50%, -50%) translate3d(0, ${(lerp(30, -22, easeOut(cp)) * vh) / 100}px, 0)`
      cap.style.opacity = window01(cp, 0, 1, 0.14).toFixed(3)

      for (const s of side) {
        const y = s.y - p * 32 * s.s
        const o = window01(p, 0.0, 0.94, 0.12)
        s.node.style.transform = `translate(-50%, -50%) translate3d(${(s.x * vw) / 100}px, ${(y * vh) / 100}px, 0)`
        s.node.style.opacity = o.toFixed(3)
      }
    },
  }
  return scene
}
