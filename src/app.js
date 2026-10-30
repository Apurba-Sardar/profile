import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Renderer } from './gl/renderer.js'
import { Stage } from './core/stage.js'
import { Cursor } from './core/cursor.js'
import { Hud } from './core/hud.js'
import { Menu } from './core/menu.js'
import { Sound } from './core/sound.js'
import { VideoScrubber } from './core/video.js'
import { createLeap } from './scenes/leap.js'
import { createImpact } from './scenes/impact.js'
import { createNoise } from './scenes/noise.js'
import { createRise } from './scenes/rise.js'
import { createGallery } from './scenes/gallery.js'
import { createPortal } from './scenes/portal.js'
import { createWork } from './sections/work.js'
import { createAbout } from './sections/about.js'
import { createClients } from './sections/clients.js'
import { createServices } from './sections/services.js'
import { createContact } from './sections/contact.js'
import { el, prefersReducedMotion, formatAltitude, isTouch } from './lib/util.js'

gsap.registerPlugin(ScrollTrigger)

const titleCase = (s) => s.toLowerCase().replace(/(^|\s|-)\S/g, (m) => m.toUpperCase())

// the sections that are plain pages (their text scrolls under the bar)
const PAGE = new Set(['about', 'stack', 'services', 'contact'])

export class App {
  constructor(content) {
    this.content = content
    this.reduced = prefersReducedMotion()
    this.chapter = -1
  }

  async start() {
    const c = this.content
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    document.title = `${titleCase(c.brand.name)} — ${titleCase(c.brand.role)}`
    const ldBrand = document.querySelector('#loader .ld-brand')
    if (ldBrand) ldBrand.textContent = c.brand.name

    this.canvas = document.getElementById('gl')
    this.main = document.getElementById('main')
    const layersRoot = document.getElementById('layers')
    this.toastNode = document.querySelector('.toast')
    this.curtain = el('div', { style: { position: 'fixed', inset: '0', background: '#000', zIndex: 90, opacity: 0, pointerEvents: 'none' } })
    // on the page sections text scrolls up under the bar: it fades into the page's black first
    document.body.append(this.curtain, el('div.page-scrim', { 'aria-hidden': 'true' }))

    this.sound = new Sound(c.music)
    this.cursor = new Cursor()
    this.stage = new Stage()
    const ctx = (this.ctx = {
      content: c,
      stage: this.stage,
      cursor: this.cursor,
      sound: this.sound,
      go: (id) => this.go(id),
      copyEmail: () => this.copyEmail(),
      toggleSound: () => this.toggleSound(),
      reduced: this.reduced,
    })
    this.hud = ctx.hud = new Hud(c, {
      onMenu: () => this.menu.toggle(),
      onSound: () => this.toggleSound(),
      onTalk: () => this.go('contact'),
      onIndex: (i) => this.go(i === 0 ? 'leap' : 'work'),
    })
    this.menu = new Menu(c, {
      sound: this.sound,
      onGo: (id) => this.go(id),
      onToggle: (open) => {
        this.hud.setMenu(open)
        if (open) this.lenis?.stop()
        else this.lenis?.start()
      },
    })

    // document order = story order
    this.leap = createLeap(ctx)
    this.impact = createImpact(ctx)
    this.noise = createNoise(ctx)
    this.rise = createRise(ctx)
    this.gallery = createGallery(ctx)
    this.work = createWork(ctx)
    this.about = createAbout(ctx)
    this.clients = createClients(ctx)
    this.services = createServices(ctx)
    this.portal = createPortal(ctx)
    this.contact = createContact(ctx)
    const flow = [this.leap, this.impact, this.noise, this.rise, this.gallery, this.work, this.about, this.clients, this.services, this.portal, this.contact]
    flow.forEach((s) => this.main.append(s.section))
    for (const s of [this.leap, this.impact, this.noise, this.rise, this.gallery, this.portal]) {
      this.stage.add(s)
      s.layers.forEach((l) => layersRoot.append(l))
    }

    this.renderer = new Renderer(this.canvas, { maxDpr: isTouch() ? 1 : 1.25 })
    if (!this.renderer.ok) document.documentElement.classList.add('no-gl')

    this.videos = {}
    for (const k in c.videos) if (c.videos[k]) this.videos[k] = new VideoScrubber(c.videos[k])

    await this.load()
    this.initScroll()
    this.bindResize()
    // fonts that arrive after the loader stopped waiting (slow networks) change text sizes
    document.fonts?.addEventListener?.('loadingdone', () => {
      this.hud.measure()
      this.stage.measure()
      ScrollTrigger.refresh()
      this.measureChapters()
    })
    gsap.ticker.add(this.frame)
    this.reveal()
  }

  // ------------------------------------------------------------------ loading
  async load() {
    const loader = document.getElementById('loader')
    const bar = loader.querySelector('.ld-line i')
    const pct = loader.querySelector('.ld-pct')
    const alt = loader.querySelector('.ld-alt')
    const shown = { v: 0 }
    let target = 0
    const total = 7
    let done = 0
    const step = () => {
      done++
      target = done / total
    }
    const show = gsap.ticker.add(() => {
      shown.v += (target - shown.v) * 0.12
      bar.style.transform = `scaleX(${shown.v})`
      pct.textContent = Math.round(shown.v * 100) + '%'
      alt.textContent = formatAltitude(12000 + (1 - shown.v) * 800)
    })
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const minTime = wait(1400)

    await Promise.race([document.fonts.ready, wait(2500)])
    step()
    // compile one shader per frame so the loader keeps moving
    for (const name of ['leap', 'crowd', 'portal']) {
      await new Promise((r) => requestAnimationFrame(r))
      try {
        if (this.renderer.ok) this.renderer.program(name)
      } catch (e) {
        console.error(e)
        this.renderer.ok = false
        document.documentElement.classList.add('no-gl')
      }
      step()
    }
    const pre = [...new Set(this.content.sections.map((s) => s.preview))].slice(0, 6)
    await Promise.race([Promise.all(pre.map((src) => new Promise((r) => {
      const im = new Image()
      im.onload = im.onerror = r
      im.src = src
    }))), wait(3000)])
    step()
    step()
    await minTime
    step()
    target = 1
    await wait(350)
    gsap.ticker.remove(show)
  }

  reveal() {
    const loader = document.getElementById('loader')
    document.body.classList.remove('is-loading')
    const intro = { v: 0 }
    this.leap.dropIn(0.85)
    gsap
      .timeline()
      .to(loader.querySelector('.ld-inner'), { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' })
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, 0.3)
      .set(loader, { display: 'none' })
      .to(intro, { v: 1, duration: 2.2, ease: 'expo.out', onUpdate: () => this.leap.setIntro(intro.v) }, 0.75)
      .fromTo(this.hud.node, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.1)
  }

  // ------------------------------------------------------------------ scroll
  initScroll() {
    this.lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !this.reduced,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })
    this.lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => this.lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    this.hud.measure()
    this.stage.measure()
    for (const s of [this.work, this.about, this.services, this.contact]) s.setup()
    ScrollTrigger.refresh()
    this.measureChapters()
  }

  measureChapters() {
    const top = (node) => node.getBoundingClientRect().top + window.scrollY
    // where every section sits, kept for a resize: by the time it is handled the layout may
    // already have changed (turning a phone moves the work, see the CSS)
    this.flowTops = [...this.main.children].map((node) => ({ node, top: top(node), height: node.offsetHeight }))
    const S = this.stage
    // chapter index per section, in scroll order
    this.chapters = [
      { at: 0, i: 0, mood: 'leap' },
      { at: S.get('impact').docTop, i: 0, mood: 'impact' },
      { at: S.get('noise').docTop, i: 1, mood: 'noise' },
      { at: S.get('rise').docTop, i: 2, mood: 'rise' },
      { at: top(this.work.section), i: 3, mood: 'work' },
      { at: top(this.about.section), i: 4, mood: 'about' },
      { at: top(this.services.section), i: 5, mood: 'services' },
      { at: S.get('portal').docTop, i: 6, mood: 'portal' },
      { at: top(this.contact.section), i: 7, mood: 'contact' },
    ]
    this.targets = {
      leap: 0,
      noise: S.get('noise').docTop + window.innerHeight * 0.25,
      rise: S.get('rise').docTop + window.innerHeight * 0.3,
      work: top(this.work.section) + this.work.landing(),
      about: top(this.about.section),
      services: top(this.services.section),
      portal: S.get('portal').docTop,
      contact: top(this.contact.section),
    }
  }

  bindResize() {
    let w = window.innerWidth
    let h = window.innerHeight
    let timer
    // where the visitor was before the screen changed: by the resize event a browser may already
    // have moved the page (phones keep what was on screen in view as they turn)
    let from
    window.addEventListener('resize', () => {
      from ??= this.anchor(this.lastScroll)
      clearTimeout(timer)
      timer = setTimeout(() => {
        const anchor = from
        from = undefined
        // ignore the mobile URL bar showing / hiding
        if (window.innerWidth === w && Math.abs(window.innerHeight - h) < 140 && isTouch()) return
        w = window.innerWidth
        h = window.innerHeight
        // keep the visitor at the same moment of the film: chapter heights scale with the viewport
        this.renderer.resize()
        this.hud.measure()
        this.stage.measure()
        this.clients.resize()
        ScrollTrigger.refresh()
        this.measureChapters()
        if (anchor) {
          const r = anchor.node.getBoundingClientRect()
          const top = r.top + window.scrollY
          this.lenis.scrollTo(top + anchor.f * r.height, { immediate: true, force: true })
        }
      }, 160)
    })
  }

  setScrim(edge, on) {
    if (this.scrim?.[edge] === on) return
    this.scrim = { ...this.scrim, [edge]: on }
    document.body.classList.toggle('scrim-' + edge, on)
  }

  /** The section under scroll position y and how far into it that is (as last measured). */
  anchor(y = window.scrollY) {
    let best = null
    for (const { node, top, height } of this.flowTops || []) {
      if (y >= top && y < top + height) best = { node, f: (y - top) / Math.max(1, height) }
    }
    return best
  }

  go(id) {
    const y = this.targets?.[id]
    if (y === undefined || !this.lenis) return
    const dist = Math.abs(y - this.lenis.scroll)
    if (dist < window.innerHeight * 3) {
      this.lenis.scrollTo(y, { duration: 1.6 })
      return
    }
    // long jumps cut through black instead of fast-forwarding the film
    this.sound.whoosh()
    gsap
      .timeline()
      .to(this.curtain, { opacity: 1, duration: 0.45, ease: 'power2.in' })
      .add(() => this.lenis.scrollTo(y, { immediate: true, force: true }))
      .to(this.curtain, { opacity: 0, duration: 0.8, ease: 'power2.out' }, '+=0.15')
  }

  toggleSound() {
    const on = this.sound.toggle()
    this.hud.setSound(on)
    // credit the track the first time it plays
    const m = this.content.music
    if (on && m?.title && !this.credited) {
      this.credited = true
      this.toast(`♪ ${m.title}${m.artist ? ' — ' + m.artist : ''}`.toUpperCase())
    }
  }

  copyEmail() {
    const email = this.content.contact.email
    const done = () => this.toast('EMAIL COPIED — ' + email)
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(email).then(done, () => this.toast(email))
    else this.toast(email)
  }

  toast(msg) {
    const t = this.toastNode
    t.textContent = msg
    t.classList.add('is-on')
    clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200)
  }

  // ------------------------------------------------------------------ frame
  frame = (time, dt) => {
    const scroll = this.lenis ? this.lenis.animatedScroll : window.scrollY
    this.lastScroll = scroll
    const vh = window.innerHeight
    this.cursor.tick()
    this.stage.update(scroll)

    const max = Math.max(1, document.documentElement.scrollHeight - vh)
    this.hud.setProgress(Math.min(1, scroll / max))
    if (this.chapters) {
      let cur = this.chapters[0]
      for (const ch of this.chapters) if (scroll + vh * 0.5 >= ch.at) cur = ch
      if (cur.i !== this.chapter) {
        this.chapter = cur.i
        this.hud.setSection(this.content.sections[cur.i].label)
        this.menu.setCurrent(cur.i)
      }
      this.sound.setScene(cur.mood)
    }
    // text on the page sections fades into the black before it runs under either row of the bar
    if (this.flowTops) {
      const page = (y) => PAGE.has(this.anchor(y)?.node.id)
      this.setScrim('top', page(scroll + this.hud.bars.top))
      this.setScrim('bottom', page(scroll + this.hud.bars.bottom))
    }
    const ls = this.leap.state
    this.hud.setAltitude(this.content.leap.startAltitude * (1 - Math.min(1, ls.p / 0.94)), ls.visible && ls.p < 0.999)
    // the bar's name: the hero's letters land on it one by one
    this.hud.setDock(ls.visible ? this.leap.dock() : null)
    const v = this.lenis?.velocity || 0
    this.clients.tick(dt, v)
    this.sound.wind(v)
    // the music's beat: the meter in the bar shows it, the hero and the beam pulse with it
    this.sound.analyse()
    this.hud.setMeter(this.sound.bands)

    // optional real footage replaces a procedural scene
    const vids = this.videos
    if (vids.leap) vids.leap.scrub(this.leap.state.p, this.leap.state.visible)
    if (vids.portal) vids.portal.scrub(this.portal.state.p, this.portal.state.visible)
    if (vids.noise) {
      const n = this.noise.state
      const r = this.rise.state
      const vis = n.visible || r.visible
      vids.noise.scrub(r.top <= 0 ? 0.5 + r.p * 0.5 : n.p * 0.5, vis)
    }

    const r = this.renderer
    if (!r.ok) return
    const t = time
    r.begin()
    if (!vids.leap) this.leap.render(r, t)
    if (!vids.noise) this.noise.render(r, t)
    if (!vids.portal) this.portal.render(r, t)
    this.work.render(r, t)
    r.render(t)
    r.adapt(performance.now())
  }
}
