import gsap from 'gsap'
import { el, isTouch } from '../lib/util.js'

/** Services list: rows flood white on hover and a preview card trails the cursor. */
export function createServices(ctx) {
  const s = ctx.content.services
  const rows = s.items.map((it) =>
    el('li.service', { 'data-hover': '' }, [el('span.fill'), el('h3.display', { text: it.title }), el('p.serif', { text: it.text })]),
  )
  const imgs = s.items.map((it) => el('img', { src: it.preview, alt: '', loading: 'lazy', decoding: 'async' }))
  const preview = el('div.service-preview', { 'aria-hidden': 'true' }, imgs)
  const section = el('section.services#services', { 'aria-label': 'Services' }, [
    el('p.services-head.serif', { text: s.heading }),
    el('ul.services-list', {}, rows),
  ])
  document.body.append(preview)

  return {
    section,
    setup() {
      // rows tear in with a quick scan-line glitch
      rows.forEach((row) => {
        const h = row.querySelector('h3')
        const p = row.querySelector('p')
        gsap
          .timeline({ scrollTrigger: { trigger: row, start: 'top 92%', end: 'top 55%', scrub: true } })
          .fromTo(
            h,
            { clipPath: 'inset(0 0 100% 0)', yPercent: 60, skewX: -12, filter: 'blur(6px)' },
            { clipPath: 'inset(0 0 0% 0)', yPercent: 0, skewX: 0, filter: 'blur(0px)', ease: 'power3.out' },
          )
          .fromTo(p, { opacity: 0, x: 30 }, { opacity: 1, x: 0, ease: 'power2.out' }, 0.2)
      })

      if (isTouch()) return
      const xTo = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' })
      const yTo = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' })
      let active = -1
      section.addEventListener('pointermove', (e) => {
        xTo(e.clientX)
        yTo(e.clientY)
      })
      rows.forEach((row, i) => {
        row.addEventListener('pointerenter', (e) => {
          if (active === -1) {
            gsap.set(preview, { x: e.clientX, y: e.clientY })
            gsap.to(preview, { opacity: 1, scale: 1, rotate: -4, duration: 0.5, ease: 'expo.out' })
          }
          active = i
          imgs.forEach((im, j) => (im.style.opacity = j === i ? 1 : 0))
          gsap.fromTo(imgs[i], { scale: 1.25 }, { scale: 1, duration: 0.9, ease: 'expo.out' })
          ctx.sound.tick(1500 + i * 220, 0.03)
        })
      })
      section.querySelector('.services-list').addEventListener('pointerleave', () => {
        active = -1
        gsap.to(preview, { opacity: 0, scale: 0.6, rotate: 0, duration: 0.4, ease: 'power3.in' })
      })
      gsap.set(preview, { xPercent: -50, yPercent: -50 })
    },
  }
}
