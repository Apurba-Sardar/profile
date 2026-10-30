import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { el } from '../lib/util.js'
import { ARTS, createArt } from './ventureArt.js'

const svgNS = 'http://www.w3.org/2000/svg'

function ring(text, id) {
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('viewBox', '0 0 200 200')
  svg.setAttribute('class', 'ring')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(svgNS, 'path')
  path.setAttribute('id', id)
  path.setAttribute('d', 'M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0')
  path.setAttribute('fill', 'none')
  const t = document.createElementNS(svgNS, 'text')
  const tp = document.createElementNS(svgNS, 'textPath')
  tp.setAttribute('href', '#' + id)
  tp.setAttribute('textLength', '538')
  tp.setAttribute('lengthAdjust', 'spacing')
  tp.textContent = text
  t.append(tp)
  svg.append(path, t)
  return svg
}

// Which WebGL film plays inside a record (for projects without an artwork of their own), and how.
function discUniforms(kind, t, mouse) {
  switch (kind) {
    case 'ember':
      return { scene: 'crowd', zoom: 1, u: { uZoom: 1, uTilt: 0.45, uEmber: 1, uExplode: 0, uRise: 0, uPush: 0, uDesat: 0, uSun: 1, uExpo: 1.05, uMouse: mouse } }
    case 'crowd':
      return { scene: 'crowd', zoom: 1, u: { uZoom: 2.1, uTilt: 0.3, uEmber: 1.25, uExplode: 0, uRise: 0, uPush: 0, uDesat: 1, uSun: 0, uExpo: 1.1, uMouse: mouse } }
    case 'portal':
      return { scene: 'portal', zoom: 1.9, u: { uOpen: 1, uHalo: 0, uFlare: 1, uBolt: 0.25, uWalk: 0, uFigure: 0, uZoom: 1, uGlow: 1, uMouse: mouse } }
    default:
      return {
        scene: 'leap',
        zoom: 0.95,
        u: { uFall: t * 0.35, uTilt: 0.06, uBeam: 1, uWidth: 1.5, uSpill: 0.5, uShaft: 0.7, uSpark: 1, uRib: 0.9, uBurst: 0, uWhite: 0, uFig: 1, uSpinFig: t * 0.3, uMouse: mouse },
      }
  }
}

export function createWork(ctx) {
  const { content, go } = ctx
  const w = content.work
  const n = w.projects.length
  const cases = w.projects.map((p, i) => {
    // the name four times for the marquee; portrait screens show it once (the repeats are .rep)
    const repeated = Array.from({ length: 4 }, () => p.name).join('  ')
    const track = el(
      'div.case-track.display',
      { 'aria-hidden': 'true' },
      [...repeated].map((ch, k) => el(k < p.name.length ? 'span.ch' : 'span.ch.rep', { text: ch })),
    )
    const glHole = el('div.gl-hole')
    // the record shows what the venture does (an artwork drawn on a canvas), or one of the films
    const art = ARTS[p.scene] ? createArt(p.scene, p.color) : null
    if (art) glHole.append(art.canvas)
    const discParts = [ring(p.ring, `ring-${i}`), glHole, el('span.hole')]
    let disc, cta
    if (p.url) {
      // a live product: the record and the button open it
      const host = new URL(p.url).host.toUpperCase()
      const out = { href: p.url, target: '_blank', rel: 'noopener' }
      disc = el('a.case-disc', { ...out, 'data-cursor': 'VISIT', 'aria-label': `Visit ${host}` }, discParts)
      cta = el('a.pill.ui.case-cta', { ...out, text: `VISIT ${host} ↗` })
    } else {
      disc = el('div.case-disc', { 'data-hover': '' }, discParts)
      cta = el('a.pill.ui.case-cta', { href: '#contact', text: w.cta })
      cta.addEventListener('click', (e) => {
        e.preventDefault()
        go('contact')
      })
    }
    const node = el('article.case', { style: { '--c': p.color }, 'aria-label': p.name }, [
      el('div.case-pin', {}, [
        el('div.case-top', {}, [
          el('span.kicker.ui', { text: w.heading }),
          el('span.ui', { text: p.client }),
          el('span.count.ui', { text: `CASE ${i + 1} OF ${n}` }),
        ]),
        el('div.case-title', {}, [track]),
        el('h3.sr-only', { text: p.name }),
        disc,
        p.year ? el('div.case-year', { text: `©® ${p.year}` }) : null,
        el('div.case-info', {}, [
          el('span.cat.ui', { text: p.category }),
          el('p.desc.serif', { text: p.description }),
          el('div.meta.ui', {}, p.meta.map((m) => el('span', { text: m }))),
        ]),
        cta,
      ]),
    ])
    if (art) disc.classList.add('has-art')
    return { p, node, track, disc, glHole, art, chars: [...track.children] }
  })
  const section = el('section.work#work', { 'aria-label': w.heading }, cases.map((c) => c.node))

  const portrait = window.matchMedia('(orientation: portrait)')

  // The work takes over in place from the index of work, and every case from the one before it
  // (see the CSS). One timeline runs over the scroll a case is pinned for: it arrives once pinned
  // (bars grow into its name, the record spins in, the rest fades up) and has left before it moves
  // on, so nothing slides past the bars. Landscape screens run the title as a marquee around the
  // record; portrait screens show the name once, fitted above it.
  const IN = 0.18 // of that scroll, while a case arrives (and again while it leaves)
  const BAR = 0.03 // the bars appear before they grow, and go once they have collapsed
  const inPlace = (c) => {
    const tall = portrait.matches
    const title = tall ? c.chars.slice(0, c.p.name.length) : c.chars
    const box = c.track.parentNode
    const parts = c.node.querySelectorAll('.case-top, .case-year, .case-info, .case-cta')
    const morph = (from) => ({ duration: (IN - BAR) * 0.6, stagger: { amount: (IN - BAR) * 0.4, from } })
    const out = 1 - IN
    const tl = gsap
      .timeline({ scrollTrigger: { trigger: c.node, start: 'top top', end: 'bottom bottom', scrub: true } })
      .fromTo(box, { autoAlpha: 0 }, { autoAlpha: 1, duration: BAR, ease: 'none' }, 0)
      .fromTo(title, { scaleY: 0.04 }, { scaleY: 1, ease: 'power3.out', ...morph('center') }, BAR)
      .fromTo(c.disc, { scale: 0.55, rotate: -40, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: IN, ease: 'power3.out' }, 0)
      .fromTo(parts, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: IN * 0.7, stagger: { amount: IN * 0.3 } }, 0)
      // (the leaving half starts from explicit values, so it never records a hidden state)
      .fromTo(title, { scaleY: 1 }, { scaleY: 0.04, ease: 'power3.in', immediateRender: false, ...morph('edges') }, out)
      .fromTo(c.disc, { scale: 1, autoAlpha: 1 }, { scale: 0.7, autoAlpha: 0, duration: IN, ease: 'power2.in', immediateRender: false }, out)
      .fromTo(parts, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: IN * 0.7, immediateRender: false }, out)
      .fromTo(box, { autoAlpha: 1 }, { autoAlpha: 0, duration: BAR, ease: 'none', immediateRender: false }, 1 - BAR)
    // the marquee drifts the whole time the case is on screen
    if (!tall) tl.fromTo(c.track, { xPercent: 2 }, { xPercent: -12, duration: 1, ease: 'none' }, 0)
  }

  // portrait: the title is as wide as the screen allows (and no taller than the room above the record)
  const fit = () => {
    for (const c of cases) {
      c.track.style.fontSize = ''
      if (!portrait.matches) continue
      c.track.style.fontSize = '100px'
      const fs = Math.min((100 * window.innerWidth * 0.88) / c.track.offsetWidth, window.innerWidth * 0.24, window.innerHeight * 0.15)
      c.track.style.fontSize = fs.toFixed(1) + 'px'
    }
  }

  // the motion for the current orientation, rebuilt when the screen turns (the app then
  // re-measures and refreshes everything; gsap.matchMedia() would lose the scroll position here)
  let motion = null
  const build = () => {
    motion?.revert()
    fit()
    motion = gsap.context(() => cases.forEach(inPlace))
  }
  const setup = () => {
    build()
    portrait.addEventListener('change', build)
    // sizes change with the screen and once the fonts arrive, and both end in a refresh
    ScrollTrigger.addEventListener('refreshInit', fit)
  }

  // only discs on screen get painted
  const vis = new Set()
  const io2 = new IntersectionObserver(
    (entries) => entries.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target))),
    { rootMargin: '5% 0px' },
  )
  cases.forEach((c) => io2.observe(c.glHole))

  return {
    section,
    setup,
    // how far past the top of the section the first case is complete (where the menu lands)
    landing: () => (cases[0].node.offsetHeight - window.innerHeight) * (IN + 0.02),
    render(r, t) {
      if (!vis.size) return false
      const mouse = [ctx.cursor.snx, ctx.cursor.sny]
      let any = false
      for (const c of cases) {
        if (!vis.has(c.glHole)) continue
        const op = Number(gsap.getProperty(c.disc, 'opacity'))
        if (c.art) {
          // (with reduced motion it drifts slowly instead)
          if (op >= 0.01) c.art.draw(ctx.reduced ? t * 0.25 : t, mouse[0], mouse[1])
          continue
        }
        const sc = Number(gsap.getProperty(c.disc, 'scale'))
        const rot = Number(gsap.getProperty(c.disc, 'rotate')) || 0
        const size = c.glHole.offsetWidth * sc
        if (op < 0.01 || size < 4) continue
        // centre from the live rect (rotation does not move the centre)
        const rect = c.glHole.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const d = discUniforms(c.p.scene, t, mouse)
        r.add({
          scene: d.scene,
          shape: 'circle',
          rect: { x: cx - size / 2, y: cy - size / 2, w: size, h: size },
          uniforms: d.u,
          zoom: d.zoom,
          spin: t * 0.22 - (rot * Math.PI) / 180,
          alpha: op,
        })
        any = true
      }
      return any
    },
  }
}
