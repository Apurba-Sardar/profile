import { el, lerp, range, smoothRange, clamp } from '../lib/util.js'

// Floating tiles around the centre card. x/y: vw/vh at depth 0, w: vw.
const TILES = [
  { src: 'media/leap-beam.webp', x: -27, y: -23, w: 8.6, ar: 1.08, d: 0.0 },
  { src: 'media/leap-burst.webp', x: 25, y: -17, w: 9.6, ar: 0.8, d: 0.08 },
  { src: 'media/portal-walk.webp', x: -30, y: 11, w: 6.2, ar: 0.82, d: 0.2 },
  { src: 'media/ember-burst.webp', x: 25, y: 17, w: 9.2, ar: 0.95, d: 0.04 },
  { src: 'media/fr-tile.webp', x: -21, y: 32, w: 5.4, ar: 0.84, d: 0.12 },
  { src: 'media/solace-mark.webp', x: -4, y: -38, w: 4.4, ar: 1, d: 0.3 },
  { src: 'media/portal-blue.webp', x: 10, y: -39, w: 4.2, ar: 1.12, d: 0.24 },
  { src: 'media/crowd-top.webp', x: 37, y: 3, w: 5.4, ar: 1.15, d: 0.16 },
  { src: 'media/ember-small.webp', x: 2, y: 41, w: 4.4, ar: 1, d: 0.34 },
  { src: 'media/portal-door.webp', x: 39, y: 31, w: 4.8, ar: 0.82, d: 0.4 },
  { src: 'media/solace-mark.webp', x: -40, y: -6, w: 3.6, ar: 1, d: 0.46 },
  { src: 'media/rise-figure.webp', x: 15, y: 37, w: 4.8, ar: 0.82, d: 0.52 },
  { src: 'media/crowd-bw.webp', x: -12, y: -33, w: 4.8, ar: 0.8, d: 0.58 },
  { src: 'media/leap-shaft.webp', x: -36, y: 26, w: 4.6, ar: 1.2, d: 0.64 },
]

export function createGallery(ctx) {
  const { content } = ctx
  const section = el('section.scene#gallery', { 'aria-label': 'Index of work' })

  const back = el('div.abs.display.gallery-back', { text: content.brand.wordmark, 'aria-hidden': 'true' })
  const backLayer = el('div.layer.is-back', {}, [back])

  const card = el('div.gallery-card', { 'data-cursor': 'VIEW', 'aria-hidden': 'true' })
  const label = el('div.gallery-label.ui', {}, [el('span.sub', { text: 'INDEX OF WORK' }), el('span', { text: content.work.heading })])
  const stageEl = el('div.gallery-stage')
  const tiles = TILES.map((t) => {
    const node = el('div.tile', {
      'data-cursor': 'VIEW',
      style: { '--w': t.w + 'vw', '--ar': String(t.ar), backgroundImage: `url(${t.src})` },
    })
    stageEl.append(node)
    return { ...t, node }
  })
  const frontLayer = el('div.layer', { 'aria-hidden': 'true' }, [stageEl, card, label])

  let vw = window.innerWidth
  let vh = window.innerHeight
  let cardRect = null

  // clicking anything here drops you into the work
  ;[card, ...tiles.map((t) => t.node)].forEach((n) => {
    n.classList.add('hit')
    n.addEventListener('click', () => ctx.go('work'))
  })

  const scene = {
    id: 'gallery',
    section,
    layers: [backLayer, frontLayer],
    vh: 270,
    chain: true,
    resize(w, h) {
      vw = w
      vh = h
    },
    update(p) {
      const enter = smoothRange(p, 0.08, 0.26)
      const exit = smoothRange(p, 0.84, 0.98)
      back.style.opacity = (enter * (1 - exit) * 0.92).toFixed(3)
      back.style.transform = `translate(-50%, -50%) scale(${lerp(1.08, 1, enter) + exit * 0.2})`

      for (const t of tiles) {
        const q = clamp(p * 1.15 - t.d * 0.5)
        const z = lerp(-1300, 520, q)
        const o = smoothRange(z, -1300, -850) * (1 - smoothRange(z, 260, 520)) * (1 - exit)
        t.node.style.transform = `translate(-50%, -50%) translate3d(${(t.x * vw) / 100}px, ${(t.y * vh) / 100}px, ${z.toFixed(1)}px)`
        t.node.style.opacity = o.toFixed(3)
        t.node.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      }
      label.style.opacity = (smoothRange(p, 0.2, 0.3) * (1 - exit)).toFixed(3)
      cardRect = null
    },
  }

  // live rect of the centre card, used to frame the crowd shot
  ctx.galleryCard = () => {
    if (!cardRect) {
      const r = card.getBoundingClientRect()
      cardRect = { x: r.left, y: r.top, w: r.width, h: r.height }
    }
    return cardRect
  }
  return scene
}
