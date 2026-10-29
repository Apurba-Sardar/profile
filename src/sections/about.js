import gsap from 'gsap'
import { el } from '../lib/util.js'

/** The statement reveals word by word as you scroll, like a thought forming. */
export function createAbout(ctx) {
  const a = ctx.content.about
  const words = a.statement.split(' ').map((w, i, arr) => el('span.wd', { text: w + (i < arr.length - 1 ? ' ' : '') }))
  const statement = el('p.about-statement.serif', {}, words)
  const notes = el(
    'div.about-notes',
    {},
    a.notes.map((t) => el('p.serif', { text: t })),
  )
  const section = el('section.about#about', { 'aria-label': 'About' }, [el('div.about-pin', {}, [statement, notes])])

  return {
    section,
    setup() {
      gsap.fromTo(
        words,
        { opacity: 0.13 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: section, start: 'top 55%', end: 'bottom 85%', scrub: true },
        },
      )
      gsap.fromTo(
        notes.children,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'center 40%', end: 'bottom 90%', scrub: true },
        },
      )
      gsap.to(statement, {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
      })
    },
  }
}
