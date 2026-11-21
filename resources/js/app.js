import { createApp } from 'vue'
import { Tolgee, DevTools, VueTolgee } from '@tolgee/vue'
import { FormatIcu } from '@tolgee/format-icu'

import './style.scss'
import 'vue-color-kit/dist/vue-color-kit.css'
import App from './App.vue'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { domData } from './domData'

//import languages
import en from './i18n/en.json'
import de from './i18n/de.json'
import fr from './i18n/fr.json'
import it from './i18n/it.json'
import nl from './i18n/nl.json'
import pt from './i18n/pt.json'
let activeHelpTip = null

const closeHelpTip = () => {
  activeHelpTip?.classList.remove('visible')
  activeHelpTip = null
  document.removeEventListener('click', closeHelpTipOutside)
  window.removeEventListener('resize', closeHelpTip)
}

const closeHelpTipOutside = (event) => {
  if (!activeHelpTip?.contains(event.target)) closeHelpTip()
}

const showHelpTip = (event, selector) => {
  const tip = document.querySelector(selector)
  if (!tip) return
  closeHelpTip()
  activeHelpTip = tip

  const { top, bottom, left, width } = event.currentTarget.getBoundingClientRect()
  const inset = 8
  const x = Math.min(Math.max(inset, left + (width - tip.offsetWidth) / 2), window.innerWidth - tip.offsetWidth - inset)
  const nextTop = top >= tip.offsetHeight + inset ? top - tip.offsetHeight - inset : bottom + inset
  const y = Math.max(inset, Math.min(nextTop, window.innerHeight - tip.offsetHeight - inset))
  tip.style.left = `${x}px`
  tip.style.top = `${y}px`
  tip.classList.add('visible')

  document.addEventListener('click', closeHelpTipOutside)
  window.addEventListener('resize', closeHelpTip)
}

const hideHelpTip = (selector) => {
  if (document.querySelector(selector) === activeHelpTip) closeHelpTip()
}

//use a mutation observer to recursively watch the dom for any .slide-text elements that might appear
const observer = new MutationObserver((mutations) => {
  const processNode = (node) => {
    if (node.classList && node.classList.contains('slide-text')) {
      const innerContent = node.querySelector('.content')
      if (innerContent) {
        const outerWidth = node.offsetWidth
        const innerWidth = innerContent.offsetWidth
        if (innerWidth > outerWidth) {
          innerContent.classList.add('needs-slide')
          node.classList.add('has-slide')
          innerContent.style.setProperty('--content-width', `${innerWidth}px`)
          const animationTime = Math.max(innerWidth / 100, 20) // Ensure a minimum animation time of 20 seconds
          innerContent.style.setProperty('--animation-time', `${animationTime}s`)
        }
      }
    }
    node.childNodes.forEach((child) => processNode(child))
  }

  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      processNode(node)
    })
  })
})

observer.observe(document.body, { childList: true, subtree: true })

const tolgee = Tolgee().use(DevTools()).use(FormatIcu()).init({
  language: localStorage.getItem('language') || domData().default_language || 'en',

  // for development
  apiUrl:  import.meta.env.VITE_APP_TOLGEE_API_URL,
  apiKey:  import.meta.env.VITE_APP_TOLGEE_API_KEY,

  // for production
  staticData: {
    en,
    de,
    fr,
    it,
    nl,
    pt
  }
})


createApp(App)
  .use(Toast, {
    position: POSITION.BOTTOM_RIGHT,
    transition: "Vue-Toastification__fade",
  })
  .use(VueTolgee, { tolgee })
  .provide('showHelpTip', showHelpTip)
  .provide('hideHelpTip', hideHelpTip)
  .mount('#app')
