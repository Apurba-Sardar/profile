import { defineConfig, loadEnv } from 'vite'
import { seo } from './seo.js'

// `base: './'` keeps every asset path relative, so the build works on
// GitHub Pages sub-paths, Netlify, Vercel or any static host.
export default defineConfig(({ mode }) => {
  // the page's absolute address (the deploy workflow sets it; .env holds the fallback)
  const site = loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL.replace(/\/?$/, '/')
  return {
    base: './',
    plugins: [seo(site)],
    server: { host: true, port: 5173 },
    preview: { host: true, port: 4173 },
    build: {
      target: 'es2020',
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 900,
    },
  }
})
