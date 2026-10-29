import common from './shaders/common.glsl?raw'
import leap from './shaders/leap.glsl?raw'
import crowd from './shaders/crowd.glsl?raw'
import portal from './shaders/portal.glsl?raw'

const VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const HEADER = `#version 300 es
precision highp float;
precision highp int;
`

export const SCENES = { leap, crowd, portal }

/**
 * Tiny WebGL2 renderer built around "views": every frame the scenes push the
 * rectangles (or circles) they want painted, each with its own shader and
 * uniforms. A full-screen scene is just a view the size of the viewport.
 */
export class Renderer {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.maxDpr = opts.maxDpr ?? 1.5
    this.maxPixels = opts.maxPixels ?? 2.4e6
    this.quality = opts.quality ?? 1
    this.views = []
    this.programs = {}
    this.frameTimes = []
    this.lastFrame = 0
    this.adaptCooldown = 0

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: !!opts.preserve,
    })
    this.ok = !!gl
    if (!gl) return
    this.gl = gl

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    this.vs = this.shader(gl.VERTEX_SHADER, VERT)
    this.resize()
  }

  shader(type, src) {
    const gl = this.gl
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s)
      const numbered = src
        .split('\n')
        .map((l, i) => `${String(i + 1).padStart(4)}: ${l}`)
        .join('\n')
      console.error(log + '\n' + numbered)
      throw new Error('Shader compile failed: ' + log)
    }
    return s
  }

  /** Compile a scene program (lazily, once). */
  program(name) {
    if (this.programs[name]) return this.programs[name]
    const gl = this.gl
    const fs = this.shader(gl.FRAGMENT_SHADER, HEADER + common + '\n' + SCENES[name])
    const p = gl.createProgram()
    gl.attachShader(p, this.vs)
    gl.attachShader(p, fs)
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('Program link failed: ' + gl.getProgramInfoLog(p))
    }
    const prog = { p, loc: {} }
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i)
      prog.loc[info.name] = gl.getUniformLocation(p, info.name)
    }
    this.programs[name] = prog
    return prog
  }

  /** Compile everything up front (called during the loader). */
  warm(names = Object.keys(SCENES)) {
    if (!this.ok) return
    for (const n of names) this.program(n)
  }

  resize() {
    if (!this.ok) return
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    let scale = Math.min(window.devicePixelRatio || 1, this.maxDpr) * this.quality
    const px = w * h * scale * scale
    if (px > this.maxPixels) scale *= Math.sqrt(this.maxPixels / px)
    this.scale = scale
    this.cssW = w
    this.cssH = h
    const bw = Math.max(1, Math.round(w * scale))
    const bh = Math.max(1, Math.round(h * scale))
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw
      this.canvas.height = bh
    }
  }

  begin() {
    this.views.length = 0
  }

  /**
   * view = { scene, rect: {x, y, w, h} in CSS px (top-left origin),
   *          shape: 'rect' | 'circle', uniforms: {} }
   */
  add(view) {
    this.views.push(view)
  }

  /** Drop resolution when frames get slow, recover when they are fast. */
  adapt(now) {
    if (!this.lastFrame) {
      this.lastFrame = now
      return
    }
    const dt = now - this.lastFrame
    this.lastFrame = now
    if (dt > 250) return // tab switch / pause
    this.frameTimes.push(dt)
    if (this.frameTimes.length < 40) return
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    this.frameTimes.length = 0
    if (this.adaptCooldown > 0) {
      this.adaptCooldown--
      return
    }
    if (avg > 24 && this.quality > 0.45) {
      this.quality = Math.max(0.45, this.quality * 0.82)
      this.resize()
      this.adaptCooldown = 1
    } else if (avg < 15 && this.quality < 1) {
      this.quality = Math.min(1, this.quality * 1.12)
      this.resize()
      this.adaptCooldown = 3
    }
  }

  render(time) {
    if (!this.ok) return
    const gl = this.gl
    const W = this.canvas.width
    const H = this.canvas.height
    gl.disable(gl.SCISSOR_TEST)
    gl.viewport(0, 0, W, H)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (!this.views.length) return
    gl.enable(gl.SCISSOR_TEST)
    gl.bindVertexArray(this.vao)
    const s = this.scale
    for (const v of this.views) {
      const r = v.rect
      const x = Math.round(r.x * s)
      const w = Math.round(r.w * s)
      const h = Math.round(r.h * s)
      const y = Math.round(H - (r.y + r.h) * s)
      if (w < 2 || h < 2 || x > W || y > H || x + w < 0 || y + h < 0) continue
      const prog = this.program(v.scene)
      gl.useProgram(prog.p)
      gl.viewport(x, y, w, h)
      const sx = Math.max(0, x)
      const sy = Math.max(0, y)
      gl.scissor(sx, sy, Math.min(W, x + w) - sx, Math.min(H, y + h) - sy)
      this.set(prog, 'uRes', [w, h])
      this.set(prog, 'uOffset', [x, y])
      this.set(prog, 'uTime', time)
      this.set(prog, 'uShape', v.shape === 'circle' ? 1 : 0)
      this.set(prog, 'uAlpha', v.alpha ?? 1)
      this.set(prog, 'uSpin', v.spin ?? 0)
      this.set(prog, 'uViewZoom', v.zoom ?? 1)
      const u = v.uniforms
      if (u) for (const k in u) this.set(prog, k, u[k])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
  }

  set(prog, name, value) {
    const loc = prog.loc[name]
    if (loc === undefined || loc === null) return
    const gl = this.gl
    if (typeof value === 'number') gl.uniform1f(loc, value)
    else if (value.length === 2) gl.uniform2f(loc, value[0], value[1])
    else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2])
    else if (value.length === 4) gl.uniform4f(loc, value[0], value[1], value[2], value[3])
  }
}
