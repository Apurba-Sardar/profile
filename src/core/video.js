/**
 * Optional real footage. When content.videos.<scene> is set, a fixed <video>
 * is scrubbed by scroll instead of painting the procedural WebGL scene.
 * Encode with frequent keyframes for smooth scrubbing, e.g.
 *   ffmpeg -i in.mp4 -an -vf scale=1920:-2 -c:v libx264 -crf 22 -g 1 -pix_fmt yuv420p out.mp4
 */
export class VideoScrubber {
  constructor(src) {
    this.node = document.createElement('video')
    this.node.id = 'bgvideo'
    this.node.src = src
    this.node.muted = true
    this.node.playsInline = true
    this.node.preload = 'auto'
    this.node.setAttribute('aria-hidden', 'true')
    this.target = 0
    this.seeking = false
    this.node.addEventListener('seeked', () => {
      this.seeking = false
      this.seek()
    })
    document.getElementById('gl').before(this.node)
  }

  /** p: 0..1 progress through the footage */
  scrub(p, visible) {
    this.node.style.opacity = visible ? 1 : 0
    if (!visible || !this.node.duration) return
    this.target = p * (this.node.duration - 0.05)
    this.seek()
  }

  seek() {
    if (this.seeking) return
    if (Math.abs(this.node.currentTime - this.target) < 1 / 30) return
    this.seeking = true
    this.node.currentTime = this.target
  }
}
