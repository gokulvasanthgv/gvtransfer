<script setup>
import { useTolgee } from '@tolgee/vue'
import { Languages } from 'lucide-vue-next'

const tolgee = useTolgee(['language'])

const languages = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  nl: 'Nederlands',
  pt: 'Português'
}

const setLanguage = ({ target }) => {
  tolgee.value.changeLanguage(target.value)
  localStorage.setItem('language', target.value)
}
</script>

<template>
  <label class="language-selector">
    <Languages aria-hidden="true" />
    <span class="visually-hidden">{{ $t('navigation.language', 'Language') }}</span>
    <select :value="tolgee.getLanguage()" @change="setLanguage">
      <option v-for="(name, code) in languages" :key="code" :value="code" :lang="code">{{ name }}</option>
    </select>
  </label>
</template>

<style scoped>
.language-selector {
  display: flex;
  align-items: center;
  min-inline-size: 0;
  gap: 0.5rem;
}

.language-selector svg {
  flex: none;
  inline-size: 1.1rem;
}

.language-selector select {
  min-inline-size: 0;
  min-block-size: 44px;
  height: auto;
  margin: 0;
}
</style>
