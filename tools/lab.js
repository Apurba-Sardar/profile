// Dev-only: render one frame of a scene with uniforms from the query string.
// /tools/lab.html?scene=leap&w=1280&h=720&t=3&shape=rect&u={"uBeam":1}
import { Renderer } from '../src/gl/renderer.js'

const q = new URLSearchParams(location.search)
const scene = q.get('scene') || 'leap'
const w = +(q.get('w') || 1280)
const h = +(q.get('h') || 720)
const t = +(q.get('t') || 2)
const shape = q.get('shape') || 'rect'
const uniforms = JSON.parse(q.get('u') || '{}')
const spin = +(q.get('spin') || 0)
const zoom = +(q.get('zoom') || 1)

const canvas = document.getElementById('c')
canvas.style.width = w + 'px'
canvas.style.height = h + 'px'
const r = new Renderer(canvas, { maxDpr: 1, maxPixels: 1e8, preserve: true })
r.resize()
const t0 = performance.now()
r.begin()
r.add({ scene, rect: { x: 0, y: 0, w, h }, shape, uniforms, spin, zoom })
r.render(t)
r.gl.finish()
window.__ms = performance.now() - t0
window.__done = true
