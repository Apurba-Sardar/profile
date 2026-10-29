import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import './styles/main.css'
import { content } from './content.js'
import { App } from './app.js'

const app = new App(content)
// handy for poking at the film from the console while developing
if (import.meta.env.DEV) window.__app = app

app.start().catch((err) => {
  console.error(err)
  // never leave the visitor stuck behind the loader
  document.body.classList.remove('is-loading')
  const loader = document.getElementById('loader')
  if (loader) loader.style.display = 'none'
})
