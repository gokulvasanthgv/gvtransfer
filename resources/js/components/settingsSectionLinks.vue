<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const wideLayout = window.matchMedia('(min-width: 992px)')
const wide = ref(wideLayout.matches)
const updateLayout = ({ matches }) => {
  wide.value = matches
}

onMounted(() => wideLayout.addEventListener('change', updateLayout))
onUnmounted(() => wideLayout.removeEventListener('change', updateLayout))
</script>

<template>
  <details class="section-links" :open="wide">
    <summary>{{ $t('navigation.jump_to_section', 'Jump to section') }}</summary>
    <slot />
  </details>
</template>

<style scoped lang="scss">
.section-links {
  margin-top: 0.625rem;
}

summary {
  min-height: 44px;
  padding: 0.625rem;
  border-radius: var(--panel-border-radius);
  background: var(--panel-section-background-color);
  cursor: pointer;
}

@media (min-width: 992px) {
  .section-links {
    align-self: flex-start;
    position: sticky;
    top: 0;
  }

  summary {
    display: none;
  }
}
</style>
