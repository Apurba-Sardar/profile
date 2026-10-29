import { el } from '../lib/util.js'

/** Outline marquee of the stack; rows drift in opposite directions and speed up with your scroll. */
export function createClients(ctx) {
  const rows = ctx.content.stack.map((names, r) => {
    const items = []
    for (let k = 0; k < 4; k++)
      names.forEach((n, i) => items.push(el('span.item.display', { text: n, 'data-t': n, class: (i + r + k) % 3 === 0 ? 'item display is-solid' : 'item display' })))
    return { node: el('div.clients-row', { 'aria-hidden': 'true' }, items), x: Math.random() * -400, dir: r % 2 ? 1 : -1 }
  })
  const list = el(
    'ul.sr-only',
    {},
    ctx.content.stack.flat().map((n) => el('li', { text: n })),
  )
  const section = el('section.clients#stack', { 'aria-label': 'Stack' }, [list, ...rows.map((r) => r.node)])
  let visible = false
  new IntersectionObserver((e) => (visible = e[0].isIntersecting)).observe(section)

  return {
    section,
    resize() {
      rows.forEach((r) => (r.w = 0))
    },
    tick(dt, velocity) {
      if (!visible) return
      const boost = 1 + Math.min(6, Math.abs(velocity) * 0.25)
      for (const r of rows) {
        if (!r.w) r.w = r.node.scrollWidth / 4
        const w = r.w
        r.x += r.dir * dt * 0.04 * boost
        if (r.x < -w) r.x += w
        if (r.x > 0) r.x -= w
        r.node.style.transform = `translate3d(${r.x.toFixed(1)}px, 0, 0) skewX(${(-velocity * 0.15).toFixed(2)}deg)`
      }
    },
  }
}
