import gsap from 'gsap'
import { el, formatAltitude } from '../lib/util.js'

/** Fixed interface: menu, name, sound, let's talk, section label, progress, altitude. */
export class Hud {
  constructor(content, { onMenu, onSound, onTalk, onIndex }) {
    const b = content.brand
    this.burger = el('span.burger', {}, [el('i'), el('i')])
    this.menuLabel = el('span', { text: 'Menu' })
    this.menuBtn = el('button.hud-menu', { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'menu' }, [this.burger, this.menuLabel])
    this.soundLabel = el('span.label', { text: 'Sound off' })
    this.soundBtn = el('button.hud-sound', { type: 'button', 'aria-pressed': 'false', 'aria-label': 'Toggle sound' }, [
      el('span.bars', {}, [el('i'), el('i'), el('i'), el('i')]),
      this.soundLabel,
    ])
    this.talk = el('a.hud-talk.ui', { href: '#contact', text: 'LET’S TALK' })
    this.sectionName = el('span.name', { text: content.sections[0].label })
    this.progress = el('i')
    this.altValue = el('b', { text: formatAltitude(content.leap.startAltitude) })
    this.meta = el('div.hud-meta.ui', {}, [
      el('span', {}, ['ALTITUDE ', this.altValue, ' M']),
      el('a', { href: '#work', text: 'INDEX OF WORK' }),
    ])

    this.node = el('header#hud', { 'aria-label': 'Site' }, [
      el('div.hud-top', {}, [
        this.menuBtn,
        el('a.hud-brand.ui', { href: '#leap' }, [el('b', { text: b.name }), el('i.dot'), el('span.role', { text: b.role })]),
        el('div.hud-right', {}, [this.soundBtn, this.talk]),
      ]),
      el('div.hud-bottom', {}, [
        el('div.hud-section.ui', {}, [el('span.arrow', { text: '↳' }), this.sectionName]),
        el('div.hud-progress', { 'aria-hidden': 'true' }, [this.progress]),
        this.meta,
      ]),
    ])
    document.body.append(this.node)

    this.menuBtn.addEventListener('click', onMenu)
    this.soundBtn.addEventListener('click', onSound)
    this.talk.addEventListener('click', (e) => {
      e.preventDefault()
      onTalk()
    })
    this.meta.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault()
      onIndex()
    })
    this.node.querySelector('.hud-brand').addEventListener('click', (e) => {
      e.preventDefault()
      onIndex(0)
    })
    this.current = content.sections[0].label
    this.lastAlt = -1
    this.showIndex = false
  }

  setSection(label) {
    if (label === this.current) return
    this.current = label
    const n = this.sectionName
    gsap.killTweensOf(n)
    gsap
      .timeline()
      .to(n, { yPercent: -110, duration: 0.25, ease: 'power2.in' })
      .add(() => (n.textContent = label))
      .fromTo(n, { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: 'expo.out' })
  }

  setProgress(p) {
    this.progress.style.transform = `scaleX(${p.toFixed(4)})`
  }

  setAltitude(v, visible) {
    const r = Math.round(v)
    if (r !== this.lastAlt) {
      this.lastAlt = r
      this.altValue.textContent = formatAltitude(r)
    }
    if (visible === this.showIndex) {
      this.showIndex = !visible
      this.meta.classList.toggle('show-index', this.showIndex)
    }
  }

  setSound(on) {
    document.body.classList.toggle('is-sound', on)
    this.soundLabel.textContent = on ? 'Sound on' : 'Sound off'
    this.soundBtn.setAttribute('aria-pressed', String(on))
  }

  setMenu(open) {
    document.body.classList.toggle('is-menu', open)
    this.menuLabel.textContent = open ? 'Close' : 'Menu'
    this.menuBtn.setAttribute('aria-expanded', String(open))
  }
}
