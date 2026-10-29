// Re-renders every image in public/media from the live shaders + tiles.
//
//   npm run dev                       (in one terminal)
//   npm i -D playwright && npx playwright install chromium
//   node tools/render-media.mjs       (in another)
//
// Stills come from tools/lab.html (one frame of a scene with given uniforms),
// graphic tiles from tools/tiles.html, and og.jpg is a shot of the real hero.
import { chromium } from 'playwright'
import { writeFile, mkdir } from 'node:fs/promises'

const BASE = process.argv[2] || 'http://localhost:5173'
const OUT = new URL('../public/media/', import.meta.url)

const leapMid = { uFall: 2.0, uTilt: 0.03, uBeam: 1, uWidth: 1.0, uShaft: 1, uSpark: 1, uRib: 1, uBurst: 0, uWhite: 0, uFig: 1, uSpinFig: 0.6, uSpill: 0.35 }
const crowd = { uZoom: 1, uTilt: 0.45, uEmber: 1, uExplode: 0, uRise: 0, uPush: 0, uDesat: 0, uSun: 0, uExpo: 1 }
const portal = { uOpen: 1, uHalo: 0, uFlare: 0, uBolt: 0, uWalk: 0, uFigure: 0, uZoom: 1, uGlow: 1 }

const STILLS = [
  { name: 'leap-beam', scene: 'leap', t: 4, u: leapMid },
  { name: 'leap-burst', scene: 'leap', t: 6, u: { ...leapMid, uBurst: 0.75, uRib: 0.4, uShaft: 0.5 } },
  { name: 'leap-shaft', scene: 'leap', t: 2, u: { ...leapMid, uTilt: 0.3, uWidth: 1.3, uShaft: 0, uRib: 0, uSpark: 0.3, uSpill: 1, uSpinFig: 0 } },
  { name: 'crowd-top', scene: 'crowd', t: 3, u: crowd },
  { name: 'crowd-bw', scene: 'crowd', t: 3, u: { ...crowd, uZoom: 2.1, uTilt: 0.3, uEmber: 1.25, uDesat: 1, uExpo: 1.1 } },
  { name: 'ember-burst', scene: 'crowd', t: 3, u: { ...crowd, uSun: 1, uExpo: 1.05 } },
  { name: 'ember-small', scene: 'crowd', t: 3.6, u: { ...crowd, uZoom: 2.3, uExplode: 0.25, uPush: 0.2 } },
  { name: 'rise-figure', scene: 'crowd', t: 4, u: { ...crowd, uZoom: 1.15, uEmber: 0.8, uRise: 1, uPush: 0.4 } },
  { name: 'portal-door', scene: 'portal', t: 2, u: { ...portal, uHalo: 1, uFlare: 0.8, uGlow: 0.8 } },
  { name: 'portal-walk', scene: 'portal', t: 2.3, u: { ...portal, uHalo: 0.2, uFlare: 0.1, uBolt: 0.8, uWalk: 0.55, uFigure: 1, uZoom: 1.3 } },
  { name: 'portal-close', scene: 'portal', t: 2, u: { ...portal, uBolt: 1, uWalk: 0.85, uFigure: 1, uZoom: 2.5 } },
  { name: 'portal-blue', scene: 'portal', t: 2.6, u: { ...portal, uFlare: 0.6, uBolt: 0.4, uWalk: 0.3, uFigure: 1 }, tint: 'blue' },
]
const TILES = ['code-tile', 'terminal-tile', 'fr-tile', 'solace-mark', 'phone-tile', 'commit-tile']

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 900, height: 1125 } })
await mkdir(OUT, { recursive: true })

const save = async (name, dataUrl) => {
  const b64 = dataUrl.split(',')[1]
  await writeFile(new URL(name, OUT), Buffer.from(b64, 'base64'))
  console.log('wrote', name)
}

// shader stills (portrait 4:5)
for (const s of STILLS) {
  const q = new URLSearchParams({ scene: s.scene, w: 900, h: 1125, t: s.t, u: JSON.stringify(s.u) })
  await page.goto(`${BASE}/tools/lab.html?${q}`)
  await page.waitForFunction(() => window.__done === true, null, { timeout: 120000 })
  const url = await page.evaluate((tint) => {
    const src = document.getElementById('c')
    const c = document.createElement('canvas')
    c.width = src.width
    c.height = src.height
    const g = c.getContext('2d')
    g.drawImage(src, 0, 0)
    if (tint === 'blue') {
      // cold duotone for the THRESHOLD tile
      const d = g.getImageData(0, 0, c.width, c.height)
      for (let i = 0; i < d.data.length; i += 4) {
        const l = (d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) / 255
        d.data[i] = 20 + l * 200
        d.data[i + 1] = 40 + l * 205
        d.data[i + 2] = 110 + l * 145
      }
      g.putImageData(d, 0, 0)
    }
    return c.toDataURL('image/webp', 0.84)
  }, s.tint)
  await save(`${s.name}.webp`, url)
}

// graphic tiles
await page.setViewportSize({ width: 1700, height: 3300 })
await page.goto(`${BASE}/tools/tiles.html`)
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
await page.waitForTimeout(400)
for (const id of TILES) {
  const png = await page.locator('#' + id).screenshot()
  const url = await page.evaluate(async (b64) => {
    const img = new Image()
    img.src = 'data:image/png;base64,' + b64
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    c.getContext('2d').drawImage(img, 0, 0)
    return c.toDataURL('image/webp', 0.86)
  }, png.toString('base64'))
  await save(`${id}.webp`, url)
}

// social preview from the real hero
await page.setViewportSize({ width: 1200, height: 630 })
await page.goto(BASE + '/')
await page.waitForFunction(() => getComputedStyle(document.getElementById('loader')).display === 'none', null, { timeout: 120000 })
await page.waitForTimeout(2600)
await writeFile(new URL('og.jpg', OUT), await page.screenshot({ type: 'jpeg', quality: 86 }))
console.log('wrote og.jpg')

await browser.close()
