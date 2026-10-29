import gsap from 'gsap'
import { el } from '../lib/util.js'

/** The landing: availability, a huge gold email, a live local clock and a way back up. */
export function createContact(ctx) {
  const c = ctx.content.contact
  const time = el('time', { text: '--:--' })
  const again = el('button.pill.is-ghost.is-big.ui.contact-again', { type: 'button' }, [c.again + ' ', el('span', { text: '↑' })])
  again.addEventListener('click', () => ctx.go('leap'))
  const email = el('a.contact-email', { href: `mailto:${c.email}`, text: c.email })
  const section = el('section.contact#contact', { 'aria-label': 'Contact' }, [
    el('h2.sr-only', { text: 'Contact' }),
    el('p.contact-avail.serif', { text: c.availability }),
    email,
    el('div.contact-row', {}, [
      el(
        'ul.socials',
        {},
        c.socials.map((s) => el('li', {}, [el('a', { href: s.href, text: s.label, target: '_blank', rel: 'noopener' })])),
      ),
      el('p.contact-time.serif', {}, [`${c.city}, `, time, c.timezoneLabel ? ` ${c.timezoneLabel}` : '', el('br'), c.response]),
      again,
    ]),
    el('p.copyright.ui', { text: `© ${ctx.content.brand.year} ${ctx.content.brand.name}. ALL RIGHTS RESERVED` }),
  ])

  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: c.timezone })
  const tickClock = () => (time.textContent = fmt.format(new Date()))
  tickClock()
  setInterval(tickClock, 15000)

  return {
    section,
    setup() {
      gsap.fromTo(
        email,
        { yPercent: 40, opacity: 0, filter: 'blur(10px)' },
        {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 20%', scrub: true },
        },
      )
      gsap.fromTo(
        section.querySelectorAll('.contact-avail, .contact-row, .copyright'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.1, scrollTrigger: { trigger: section, start: 'top 70%', end: 'top 10%', scrub: true } },
      )
    },
  }
}
