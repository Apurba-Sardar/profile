import { lerp, clamp, isTouch, prefersReducedMotion } from '../lib/util.js'

/**
 * Ring + dot cursor rendered with mix-blend-mode: difference. It inverts
 * whatever is under it (blue over gold, black over white) and swells into a
 * solid disc over anything interactive.
 */
export class Cursor {
  constructor() {
    this.enabled = !isTouch()
    this.x = window.innerWidth / 2
    this.y = window.innerHeight / 2
    this.tx = this.x
    this.ty = this.y
    // normalised mouse for scene parallax (-1..1), smoothed
    this.nx = 0
    this.ny = 0
    this.snx = 0
    this.sny = 0
    this.movedAt = -Infinity // seconds (performance.now) of the last mouse move
    if (!this.enabled) {
      this.tilt()
      return
    }

    document.body.classList.add('has-cursor')
    this.node = document.getElementById('cursor')
    this.label = this.node.querySelector('.c-label')

    window.addEventListener('pointermove', (e) => {
      this.movedAt = performance.now() / 1000
      this.tx = e.clientX
      this.ty = e.clientY
      this.nx = (e.clientX / window.innerWidth) * 2 - 1
      this.ny = -((e.clientY / window.innerHeight) * 2 - 1)
      if (!this.seen) {
        this.seen = true
        this.x = this.tx
        this.y = this.ty
      }
    })
    window.addEventListener('pointerdown', () => this.node.classList.add('is-down'))
    window.addEventListener('pointerup', () => this.node.classList.remove('is-down'))
    document.addEventListener('mouseleave', () => (this.node.style.opacity = 0))
    document.addEventListener('mouseenter', () => (this.node.style.opacity = 1))

    document.addEventListener('pointerover', (e) => {
      const view = e.target.closest('[data-cursor]')
      const hot = e.target.closest('a, button, .hit, [data-hover]')
      this.node.classList.toggle('is-view', !!view)
      this.node.classList.toggle('is-hover', !!hot && !view)
      this.label.textContent = view ? view.dataset.cursor : ''
    })
  }

  /**
   * Phones: tilting the device moves the scenes the way the mouse does on desktop.
   * It never asks for permission: browsers that allow motion sensors by default (Android) send
   * the events, and the ones that would need a prompt (iOS) simply don't.
   */
  tilt() {
    if (prefersReducedMotion() || typeof DeviceOrientationEvent === 'undefined') return
    let base = null
    window.addEventListener('deviceorientation', (e) => {
      if (e.beta == null || e.gamma == null) return
      // the resting pose drifts towards however the phone is being held, so only movement counts
      base ??= { b: e.beta, g: e.gamma }
      base.b += (e.beta - base.b) * 0.01
      base.g += (e.gamma - base.g) * 0.01
      let x = e.gamma - base.g
      let y = e.beta - base.b
      const turn = screen.orientation?.angle ?? 0
      if (turn === 90) [x, y] = [y, -x]
      else if (turn === 270) [x, y] = [-y, x]
      this.nx = clamp(x / 18, -1, 1)
      this.ny = clamp(y / 18, -1, 1)
    })
  }

  tick() {
    this.snx = lerp(this.snx, this.nx, 0.05)
    this.sny = lerp(this.sny, this.ny, 0.05)
    if (!this.enabled) return
    this.x = lerp(this.x, this.tx, 0.22)
    this.y = lerp(this.y, this.ty, 0.22)
    this.node.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`
  }
}
