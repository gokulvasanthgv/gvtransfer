<script setup>
import { computed, ref, useSlots } from 'vue'

defineProps({
  items: { type: Array, required: true },
  secondary: { type: Boolean, default: true },
  label: String
})

const slots = useSlots()
const iconOnly = computed(() => !slots.label)
const menu = ref(null)
const trigger = ref(null)

const closeMenu = (restoreFocus = false) => {
  if (!menu.value.open) return
  menu.value.open = false
  if (restoreFocus) trigger.value?.focus()
}

const choose = (item) => {
  closeMenu(true)
  item.action?.()
}

const handleEscape = (event) => {
  if (!menu.value.open) return
  event.stopPropagation()
  closeMenu(true)
}
</script>

<template>
  <details class="button-with-menu" ref="menu" @keydown.esc="handleEscape">
    <summary
      ref="trigger"
      :class="{ 'icon-only': iconOnly, secondary: secondary }"
      :aria-label="label || (iconOnly ? $t('navigation.more_actions', 'More actions') : undefined)"
    >
      <slot name="icon" />
      <slot name="label" />
    </summary>
    <div class="button-with-menu-options">
      <button v-for="item in items" :key="item.label" type="button" class="secondary" @click="choose(item)">
        <Component :is="item.icon" v-if="item.icon" />
        {{ item.label }}
      </button>
    </div>
  </details>
</template>

<style lang="scss" scoped>
.button-with-menu {
  min-width: 0;
  max-width: 100%;
}

summary,
.button-with-menu-options button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  min-width: 0;
  min-height: 44px;
  height: auto;
  max-width: 100%;
  margin: 0;
  padding: 0.5rem 0.75rem;
  border-radius: var(--button-border-radius);
  line-height: 1.25;
  text-align: start;
  overflow-wrap: anywhere;
  cursor: pointer;

  svg {
    flex: none;
    width: 1.125rem;
    height: 1.125rem;
    margin: 0;
  }
}

summary {
  width: fit-content;
  background: var(--primary-button-background-color);
  color: var(--primary-button-text-color);
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  &.secondary {
    background: var(--secondary-button-background-color);
    color: var(--secondary-button-text-color);
  }

  &.icon-only {
    min-width: 44px;
    justify-content: center;
  }
}

.button-with-menu-options {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-block-start: 0.25rem;
}
</style>
