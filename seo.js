import { content } from './src/content.js'

/**
 * Search engines and link previews. At build time this fills the page's head (title, description,
 * canonical address, Open Graph and Twitter cards, and structured data that tells Google who the
 * site is about and which ventures he runs), puts the site's words into the HTML as plain,
 * crawlable markup (the app takes it out when it starts, since it shows the same words its own
 * way, and visitors without JavaScript read it instead), and writes robots.txt and sitemap.xml.
 *
 * Everything comes from src/content.js; `site` is the page's absolute address, with a trailing /.
 */
export function seo(site) {
  const c = content
  const s = c.seo
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const words = (v) => String(v).replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim()
  const nameCase = (v) => v.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())
  // "AI & AUTOMATION" -> "AI & automation"
  const sentence = (v) => (v.charAt(0) + v.slice(1).toLowerCase()).replace(/\b(ai|ui|ux|api|seo|css|html)\b/gi, (m) => m.toUpperCase())
  const NAMES = { TYPESCRIPT: 'TypeScript', JAVASCRIPT: 'JavaScript', PYTHON: 'Python', WEBGL: 'WebGL', VITE: 'Vite', 'NODE.JS': 'Node.js', GIT: 'Git', GITHUB: 'GitHub' }

  const name = nameCase(c.brand.name)
  const [first, ...rest] = name.split(' ')
  const city = c.contact.city
  const image = site + s.image
  const x = c.contact.socials.find((l) => /\/\/(www\.)?(x|twitter)\.com\//.test(l.href))
  const handle = x && '@' + x.href.replace(/\/+$/, '').split('/').pop()
  const projects = c.work.projects.map((p) => ({ ...p, title: p.title || nameCase(p.name) }))
  const skills = c.stack.flat().map((t) => NAMES[t] || t)

  // who the site is about, for Google (schema.org, as JSON-LD)
  const person = `${site}#person`
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${site}#page`,
        url: site,
        name: s.title,
        description: s.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${site}#website` },
        mainEntity: { '@id': person },
        dateModified: new Date().toISOString(),
      },
      {
        '@type': 'WebSite',
        '@id': `${site}#website`,
        url: site,
        name,
        inLanguage: 'en',
        publisher: { '@id': person },
      },
      {
        '@type': 'Person',
        '@id': person,
        name,
        givenName: first,
        familyName: rest.join(' '),
        url: site,
        jobTitle: s.jobTitle,
        description: s.description,
        email: `mailto:${c.contact.email}`,
        address: { '@type': 'PostalAddress', addressLocality: city, addressRegion: s.region, addressCountry: s.country },
        worksFor: s.worksFor && { '@type': 'Organization', ...s.worksFor },
        knowsAbout: [...skills, ...c.services.items.map((i) => sentence(i.title))],
        sameAs: c.contact.socials.map((l) => l.href),
      },
      ...projects
        .filter((p) => p.url)
        .map((p) => ({
          '@type': 'Organization',
          '@id': `${p.url.replace(/\/?$/, '/')}#organization`,
          name: p.title,
          url: p.url,
          description: p.description,
          founder: { '@id': person },
        })),
    ],
  }

  const head = [
    `<title>${esc(s.title)}</title>`,
    `<meta name="description" content="${esc(s.description)}" />`,
    `<meta name="author" content="${esc(name)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${esc(site)}" />`,
    `<meta property="og:site_name" content="${esc(name)}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="profile:first_name" content="${esc(first)}" />`,
    `<meta property="profile:last_name" content="${esc(rest.join(' '))}" />`,
    `<meta property="og:title" content="${esc(s.title)}" />`,
    `<meta property="og:description" content="${esc(s.description)}" />`,
    `<meta property="og:url" content="${esc(site)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(s.imageAlt)}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    handle && `<meta name="twitter:site" content="${esc(handle)}" />`,
    handle && `<meta name="twitter:creator" content="${esc(handle)}" />`,
    `<meta name="twitter:title" content="${esc(s.title)}" />`,
    `<meta name="twitter:description" content="${esc(s.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<meta name="twitter:image:alt" content="${esc(s.imageAlt)}" />`,
    // (JSON.stringify leaves "</" alone, which would end the script early)
    `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ')

  // the site's words as plain HTML
  const body = `<article id="static" class="static">
        <header>
          <p class="static-kicker">${esc(sentence(c.brand.role))} · ${esc(city)}, India</p>
          <h1>${esc(name)}</h1>
          <p>${esc(s.description)}</p>
        </header>
        <section aria-labelledby="static-work">
          <h2 id="static-work">${esc(sentence(c.work.heading))}</h2>
          ${projects
            .map(
              (p) => `<article>
            <h3>${p.url ? `<a href="${esc(p.url)}">${esc(p.title)}</a>` : esc(p.title)} · ${esc(sentence(p.category))}</h3>
            <p>${esc(p.description)}</p>
          </article>`,
            )
            .join('\n          ')}
        </section>
        <section aria-labelledby="static-about">
          <h2 id="static-about">About</h2>
          <p>${esc(words(c.about.statement))}</p>
          ${c.about.notes.map((n) => `<p>${esc(words(n))}</p>`).join('\n          ')}
        </section>
        <section aria-labelledby="static-services">
          <h2 id="static-services">${esc(c.services.heading)}</h2>
          <dl>
            ${c.services.items.map((i) => `<dt>${esc(sentence(i.title))}</dt>\n            <dd>${esc(i.text)}</dd>`).join('\n            ')}
          </dl>
        </section>
        <section aria-labelledby="static-stack">
          <h2 id="static-stack">Stack</h2>
          <p>${esc(skills.join(', '))}</p>
        </section>
        <section aria-labelledby="static-contact">
          <h2 id="static-contact">Contact</h2>
          <p>${esc(c.contact.availability)}</p>
          <p><a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a> · ${esc(city)}, India</p>
          <ul>
            ${c.contact.socials.map((l) => `<li><a href="${esc(l.href)}" rel="me">${esc(l.label)}</a></li>`).join('\n            ')}
          </ul>
        </section>
        <p class="static-note">This is the plain version of the page: the portfolio itself is a scroll-driven film that needs JavaScript.</p>
      </article>`

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${site}sitemap.xml\n`
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${esc(site)}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </url>
</urlset>
`

  return {
    name: 'seo',
    transformIndexHtml: (html) => html.replace('<!--seo:head-->', head).replace('<!--seo:body-->', body),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    },
  }
}
