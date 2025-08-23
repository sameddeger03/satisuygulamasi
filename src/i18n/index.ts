// Enhanced src/i18n/index.js with language detection
import { createI18n } from 'vue-i18n'
import tr from './locales/tr.json'
import en from './locales/en.json'

const messages = {
  tr,
  en
}

// Detect saved language or use browser language
const getSavedLanguage = () => {
  // First check localStorage
  const savedLang = localStorage.getItem('language')
  if (savedLang && messages[savedLang]) {
    return savedLang
  }
  
  // Then check browser language
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('tr')) {
    return 'tr'
  }
  
  // Default to Turkish
  return 'tr'
}

const i18n = createI18n({
  legacy: false, // Vue 3 Composition API mode
  locale: getSavedLanguage(),
  fallbackLocale: 'tr',
  messages,
  globalInjection: true // This allows $t to be used globally
})

export default i18n

// Utility function to change language
export const changeLanguage = (newLocale) => {
  if (messages[newLocale]) {
    i18n.global.locale.value = newLocale
    localStorage.setItem('language', newLocale)
    return true
  }
  return false
}
