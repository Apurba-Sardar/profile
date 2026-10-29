export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
/** 0..1 progress of v inside [a, b] */
export const range = (v, a, b) => clamp((v - a) / (b - a))
export const smooth = (t) => t * t * (3 - 2 * t)
export const smoothRange = (v, a, b) => smooth(range(v, a, b))
export const easeOut = (t) => 1 - Math.pow(1 - t, 3)
export const easeIn = (t) => t * t * t
export const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
/** Fade in over [a, a+f], hold, fade out over [b-f, b]. */
export const window01 = (v, a, b, f = 0.15) => {
  const w = (b - a) * f
  return smoothRange(v, a, a + w) * (1 - smoothRange(v, b - w, b))
}
export const wrap = (v, min, max) => {
  const r = max - min
  return ((((v - min) % r) + r) % r) + min
}
/** x (px from the screen centre) moved so a box w px wide stays on a vw px wide screen. */
export const keepInside = (x, w, vw, margin = 12) => {
  const m = Math.max(0, vw / 2 - w / 2 - margin)
  return clamp(x, -m, m)
}
/**
 * Opacity factor that fades a box (centre x, y and size w, h, in px) while it
 * overlaps any of `boxes` ({ x, y, w, h, o }, o = how visible that box is).
 */
export function clearOf(x, y, w, h, boxes, soft = 40) {
  let k = 1
  for (const b of boxes) {
    if (b.o < 0.02) continue
    const gap = Math.max(Math.abs(x - b.x) - (b.w + w) / 2, Math.abs(y - b.y) - (b.h + h) / 2)
    k = Math.min(k, 1 - b.o * (1 - clamp(gap / soft)))
  }
  return k
}
/** Size of the text inside a block (its widest line by all its lines). */
export function textSize(node) {
  const r = document.createRange()
  r.selectNodeContents(node)
  const b = r.getBoundingClientRect()
  return { w: b.width, h: b.height }
}

/** Tiny hyperscript helper. el('section#id.a.b', {attrs}, children) */
export function el(tag, attrs = {}, children = []) {
  const name = tag.match(/^[a-z0-9-]*/i)[0] || 'div'
  const node = document.createElement(name)
  const classes = []
  for (const part of tag.slice(name.length).match(/[#.][\w-]+/g) || []) {
    if (part[0] === '#') node.id = part.slice(1)
    else classes.push(part.slice(1))
  }
  if (classes.length) node.className = classes.join(' ')
  for (const k in attrs) {
    const v = attrs[k]
    if (v === undefined || v === null || v === false) continue
    if (k === 'html') node.innerHTML = v
    else if (k === 'text') node.textContent = v
    else if (k === 'style' && typeof v === 'object') {
      // custom properties (--x) only work through setProperty
      for (const p in v) p.startsWith('--') ? node.style.setProperty(p, v[p]) : (node.style[p] = v[p])
    }
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v)
    else node.setAttribute(k, v === true ? '' : v)
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue
    node.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
  return node
}

export const $ = (s, root = document) => root.querySelector(s)
export const $$ = (s, root = document) => [...root.querySelectorAll(s)]

export const formatAltitude = (n) =>
  Math.max(0, Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export const isTouch = () => window.matchMedia('(hover: none), (pointer: coarse)').matches
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Cheap transform writer that skips no-op updates. */
export function setT(node, x, y, extra = '') {
  const v = `translate3d(${x}px, ${y}px, 0) ${extra}`
  if (node.__t !== v) {
    node.style.transform = v
    node.__t = v
  }
}
export function setO(node, o) {
  const v = o < 0.001 ? 0 : o > 0.999 ? 1 : Math.round(o * 1000) / 1000
  if (node.__o !== v) {
    node.style.opacity = v
    node.__o = v
  }
}
