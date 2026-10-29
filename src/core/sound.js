/**
 * Generative soundtrack, no audio files: a low drone, wind that follows the
 * scroll velocity (the fall), a crowd murmur for THE NOISE, a sub boom on
 * IMPACT and a slow choir pad for THE PORTAL. Starts muted; browsers only let
 * audio start after a user gesture anyway.
 */
export class Sound {
  constructor() {
    this.on = false
    this.ctx = null
    this.scene = 'leap'
    this.velocity = 0
  }

  build() {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    const ctx = (this.ctx = new AC())
    const now = ctx.currentTime

    this.master = ctx.createGain()
    this.master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 3
    this.master.connect(comp).connect(ctx.destination)

    // shared noise buffer
    const len = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    this.noiseBuf = buf
    const noise = () => {
      const n = ctx.createBufferSource()
      n.buffer = buf
      n.loop = true
      n.start(now)
      return n
    }

    // drone
    this.droneFilter = ctx.createBiquadFilter()
    this.droneFilter.type = 'lowpass'
    this.droneFilter.frequency.value = 420
    this.droneFilter.Q.value = 0.8
    this.droneGain = ctx.createGain()
    this.droneGain.gain.value = 0.07
    this.droneFilter.connect(this.droneGain).connect(this.master)
    this.drones = [55, 55.35, 82.4].map((f, i) => {
      const o = ctx.createOscillator()
      o.type = i === 2 ? 'triangle' : 'sawtooth'
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = i === 2 ? 0.25 : 0.5
      o.connect(g).connect(this.droneFilter)
      o.start(now)
      return o
    })
    const sub = ctx.createOscillator()
    sub.frequency.value = 27.5
    const subG = ctx.createGain()
    subG.gain.value = 0.05
    sub.connect(subG).connect(this.master)
    sub.start(now)
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.06
    const lfoG = ctx.createGain()
    lfoG.gain.value = 90
    lfo.connect(lfoG).connect(this.droneFilter.frequency)
    lfo.start(now)

    // wind of the fall
    this.windFilter = ctx.createBiquadFilter()
    this.windFilter.type = 'bandpass'
    this.windFilter.frequency.value = 600
    this.windFilter.Q.value = 0.6
    this.windGain = ctx.createGain()
    this.windGain.gain.value = 0.02
    noise().connect(this.windFilter).connect(this.windGain).connect(this.master)

    // crowd murmur: noise through two formant-ish bands with a slow tremolo
    this.murmurGain = ctx.createGain()
    this.murmurGain.gain.value = 0
    ;[420, 1150].forEach((f) => {
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = f
      bp.Q.value = 2.2
      const trem = ctx.createGain()
      trem.gain.value = 0.5
      const tl = ctx.createOscillator()
      tl.frequency.value = 3.1 + Math.random()
      const tlg = ctx.createGain()
      tlg.gain.value = 0.35
      tl.connect(tlg).connect(trem.gain)
      tl.start(now)
      noise().connect(bp).connect(trem).connect(this.murmurGain)
    })
    this.murmurGain.connect(this.master)

    // portal choir
    this.choirGain = ctx.createGain()
    this.choirGain.gain.value = 0
    const choirFilter = ctx.createBiquadFilter()
    choirFilter.type = 'lowpass'
    choirFilter.frequency.value = 1400
    this.choirGain.connect(choirFilter).connect(this.master)
    ;[220, 261.63, 329.63, 440].forEach((f, i) => {
      ;[-4, 4].forEach((cents) => {
        const o = ctx.createOscillator()
        o.type = i % 2 ? 'triangle' : 'sine'
        o.frequency.value = f
        o.detune.value = cents
        const g = ctx.createGain()
        g.gain.value = 0.06
        o.connect(g).connect(this.choirGain)
        o.start(now)
      })
    })
    return true
  }

  toggle() {
    return this.on ? this.disable() : this.enable()
  }

  enable() {
    if (!this.ctx && !this.build()) return false
    this.ctx.resume()
    this.on = true
    this.ramp(this.master.gain, 0.9, 1.2)
    this.setScene(this.scene, true)
    return true
  }

  disable() {
    this.on = false
    if (this.ctx) this.ramp(this.master.gain, 0, 0.5)
    return false
  }

  ramp(param, value, time = 0.8) {
    if (!this.ctx) return
    param.setTargetAtTime(value, this.ctx.currentTime, time / 3)
  }

  setScene(id, force) {
    if (id === this.scene && !force) return
    this.scene = id
    if (!this.ctx) return
    const mood = {
      leap: { drone: 0.07, cut: 520, murmur: 0, choir: 0 },
      impact: { drone: 0.03, cut: 260, murmur: 0, choir: 0 },
      noise: { drone: 0.05, cut: 300, murmur: 0.09, choir: 0 },
      rise: { drone: 0.06, cut: 680, murmur: 0.03, choir: 0.15 },
      work: { drone: 0.05, cut: 380, murmur: 0, choir: 0 },
      about: { drone: 0.04, cut: 300, murmur: 0, choir: 0 },
      services: { drone: 0.04, cut: 340, murmur: 0, choir: 0 },
      portal: { drone: 0.05, cut: 460, murmur: 0, choir: 0.55 },
      contact: { drone: 0.035, cut: 300, murmur: 0, choir: 0.2 },
    }[id] || { drone: 0.05, cut: 400, murmur: 0, choir: 0 }
    this.ramp(this.droneGain.gain, mood.drone, 2)
    this.ramp(this.droneFilter.frequency, mood.cut, 2)
    this.ramp(this.murmurGain.gain, mood.murmur, 2)
    this.ramp(this.choirGain.gain, mood.choir, 3)
  }

  /** Called every frame with the smoothed scroll velocity. */
  wind(v) {
    if (!this.on || !this.ctx) return
    const s = Math.min(1, Math.abs(v) / 45)
    const boost = this.scene === 'leap' ? 1 : 0.4
    this.windGain.gain.setTargetAtTime(0.015 + s * 0.17 * boost, this.ctx.currentTime, 0.12)
    this.windFilter.frequency.setTargetAtTime(380 + s * 1500, this.ctx.currentTime, 0.15)
  }

  boom() {
    if (!this.on || !this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.frequency.setValueAtTime(110, t)
    o.frequency.exponentialRampToValueAtTime(28, t + 1.4)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
    o.connect(g).connect(this.master)
    o.start(t)
    o.stop(t + 2.3)
    const n = ctx.createBufferSource()
    n.buffer = this.noiseBuf
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(2400, t)
    lp.frequency.exponentialRampToValueAtTime(120, t + 1.2)
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.5, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
    n.connect(lp).connect(ng).connect(this.master)
    n.start(t)
    n.stop(t + 1.5)
  }

  tick(freq = 2400, gain = 0.05) {
    if (!this.on || !this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const n = ctx.createBufferSource()
    n.buffer = this.noiseBuf
    const hp = ctx.createBiquadFilter()
    hp.type = 'bandpass'
    hp.frequency.value = freq
    hp.Q.value = 6
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
    n.connect(hp).connect(g).connect(this.master)
    n.start(t, Math.random())
    n.stop(t + 0.08)
  }

  whoosh() {
    if (!this.on || !this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const n = ctx.createBufferSource()
    n.buffer = this.noiseBuf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.2
    bp.frequency.setValueAtTime(300, t)
    bp.frequency.exponentialRampToValueAtTime(2200, t + 0.5)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.18)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
    n.connect(bp).connect(g).connect(this.master)
    n.start(t, Math.random())
    n.stop(t + 0.75)
  }
}
