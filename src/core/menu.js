import gsap from 'gsap'
import { el } from '../lib/util.js'

/** Full-screen index: every chapter of the fall, with a preview on hover. */
export class Menu {
  constructor(content, { onGo, onToggle, sound }) {
    this.open = false
    this.sound = sound
    this.onToggle = onToggle
    this.items = content.sections.map((s, i) =>
      el('a.display', { href: '#' + s.id, 'data-i': i }, [el('span.dash', { text: '–' }), el('span', { text: s.label })]),
    )
    this.images = content.sections.map((s) => el('img', { src: s.preview, alt: '', loading: 'lazy', decoding: 'async' }))
    this.preview = el('div.menu-preview', { 'aria-hidden': 'true' }, this.images)
    this.list = el('ul.menu-list', {}, this.items.map((a) => el('li', {}, [a])))
    this.node = el('nav#menu', { 'aria-label': 'Chapters', 'aria-hidden': 'true' }, [
      el('div.menu-inner', {}, [this.list, this.preview]),
      el('div.menu-foot.ui', { text: `© ${content.brand.year} ${content.brand.name}` }),
    ])
    document.body.append(this.node)
    this.current = 0
    this.show(0)

    this.items.forEach((a, i) => {
      a.addEventListener('mouseenter', () => {
        this.show(i)
        this.sound?.tick(1800 + i * 160, 0.035)
      })
      a.addEventListener('focus', () => this.show(i))
      a.addEventListener('click', (e) => {
        e.preventDefault()
        this.toggle(false)
        onGo(content.sections[i].id)
      })
    })
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.open) this.toggle(false)
    })
  }

  setCurrent(i) {
    if (i === this.current) return
    this.items[this.current]?.classList.remove('is-current')
    this.current = i
    this.items[i]?.classList.add('is-current')
    if (!this.open) this.show(i)
  }

  show(i) {
    this.images.forEach((img, j) => img.classList.toggle('is-active', j === i))
  }

  toggle(force) {
    const open = force ?? !this.open
    if (open === this.open) return
    this.open = open
    this.onToggle(open)
    this.node.setAttribute('aria-hidden', String(!open))
    gsap.killTweensOf([this.node, this.items, this.preview])
    if (open) {
      this.sound?.whoosh()
      this.node.classList.add('is-open')
      this.show(this.current)
      gsap.to(this.node, { opacity: 1, duration: 0.45, ease: 'power2.out' })
      gsap.fromTo(
        this.items,
        { yPercent: 110, rotateX: -70, opacity: 0 },
        { yPercent: 0, rotateX: 0, opacity: 1, duration: 0.9, stagger: 0.045, ease: 'expo.out', delay: 0.08 },
      )
      gsap.fromTo(
        this.preview,
        { clipPath: 'inset(100% 0 0 0)' },
        { clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'expo.out', delay: 0.15 },
      )
    } else {
      gsap.to(this.items, { yPercent: -60, opacity: 0, duration: 0.35, stagger: 0.02, ease: 'power2.in' })
      gsap.to(this.node, {
        opacity: 0,
        duration: 0.4,
        delay: 0.15,
        ease: 'power2.in',
        onComplete: () => this.node.classList.remove('is-open'),
      })
    }
  }
}
