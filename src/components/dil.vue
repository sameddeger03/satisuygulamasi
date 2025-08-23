<template>
  <div class="dropdown">
    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
      <i class="bi bi-translate"></i>
      {{ getCurrentLanguageName() }}
    </button>
    <ul class="dropdown-menu">
      <li>
        <button class="dropdown-item" @click="changeLanguage('tr')" :class="{ active: $i18n.locale === 'tr' }">
          🇹🇷 Türkçe
        </button>
      </li>
      <li>
        <button class="dropdown-item" @click="changeLanguage('en')" :class="{ active: $i18n.locale === 'en' }">
          🇺🇸 English
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

const { locale } = useI18n()
const store = useStore()

const changeLanguage = (newLocale: string) => {
  locale.value = newLocale
  // Save language preference to localStorage or Vuex store
  localStorage.setItem('language', newLocale)
  // You can also dispatch to store if needed
  store.dispatch('iletisimDeposu/ayarKaydet', { degisken: 'dil', deger: newLocale })
}

const getCurrentLanguageName = () => {
  switch (locale.value) {
    case 'tr':
      return 'TR'
    case 'en':
      return 'EN'
    default:
      return 'TR'
  }
}
</script>

<style scoped>
.dropdown-item.active {
  background-color: var(--bs-primary);
  color: white;
}
</style>
