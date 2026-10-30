import { clamp } from '../lib/util.js'

/**
 * Scroll-driven scenes.
 *
 * Every cinematic scene is an empty "spacer" section in the document (it only
 * provides scroll length) plus a few position:fixed layers that live at the
 * root of the page. The stage moves those layers exactly like position:sticky
 * would (enter from below, stick, leave upwards) but because they stay in the
 * root stacking context, `mix-blend-mode: difference` can blend them with the
 * WebGL canvas behind — which sticky/pinned containers would isolate.
 *
 * A scene marked `chain` overlaps the previous one by one viewport, so the
 * hand-off between two scenes happens in place instead of sliding.
 *
 * What moves on a scene's layers fades out before it reaches the bar's rows
 * (a CSS mask, held in place while the scene scrolls away); a scene that
 * handles its edges itself sets `clear: false`, and full-bleed layers
 * (backgrounds, scrims) are marked `.is-full`.
 */
export class Stage {
  constructor() {
    this.scenes = []
    this.byId = {}
    this.vh = window.innerHeight
    this.vw = window.innerWidth
  }

  add(scene) {
    scene.state = { p: 0, top: 0, bottom: 0, y: 0, visible: false }
    scene.on = false
    if (scene.clear !== false) for (const l of scene.layers) l.classList.toggle('is-clear', !l.classList.contains('is-full'))
    this.scenes.push(scene)
    this.byId[scene.id] = scene
    return scene
  }

  get(id) {
    return this.byId[id]
  }

  measure() {
    this.vh = window.innerHeight
    this.vw = window.innerWidth
    for (const s of this.scenes) {
      s.section.style.height = Math.round((s.vh * this.vh) / 100) + 'px'
      s.section.style.marginTop = s.chain ? -this.vh + 'px' : ''
    }
    const sy = window.scrollY
    for (const s of this.scenes) {
      const r = s.section.getBoundingClientRect()
      s.docTop = r.top + sy
      s.height = r.height
      s.resize?.(this.vw, this.vh)
    }
  }

  update(scroll) {
    const vh = this.vh
    for (const s of this.scenes) {
      const top = s.docTop - scroll
      const bottom = top + s.height
      // a chained scene takes over in place once it reaches the top
      const visible = bottom > 0.5 && (s.chain ? top <= 0.5 : top < vh - 0.5)
      const y = Math.max(top, Math.min(0, bottom - vh))
      const p = clamp(-top / Math.max(1, s.height - vh))
      const st = s.state
      st.top = top
      st.bottom = bottom
      st.visible = visible
      st.y = y
      st.p = p
      if (visible !== s.on) {
        s.on = visible
        for (const l of s.layers) l.classList.toggle('is-on', visible)
        s.toggle?.(visible)
      }
      if (visible) {
        const ty = Math.round(y * 100) / 100
        if (s.lastY !== ty) {
          s.lastY = ty
          const v = ty === 0 ? 'none' : `translate3d(0, ${ty}px, 0)`
          const m = ty === 0 ? '' : `0 ${-ty}px`
          for (const l of s.layers) {
            if (l.dataset.free) continue
            l.style.transform = v
            if (l.classList.contains('is-clear')) l.style.webkitMaskPosition = l.style.maskPosition = m
          }
        }
        s.update(p, st)
      }
    }
  }
}
