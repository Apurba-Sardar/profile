import { defineConfig } from 'vite'

// `base: './'` keeps every asset path relative, so the build works on
// GitHub Pages sub-paths, Netlify, Vercel or any static host.
export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
  },
})
