<script setup>
import { ref } from 'vue'
import { ColorPicker as cp } from 'vue-color-kit'
import { Palette } from 'lucide-vue-next'
defineProps({
  modelValue: { type: String, required: true }
})
const emit = defineEmits(['update:modelValue'])
const pickerOpen = ref(false)
const handleChangeColor = (color) => {
  let rgbaValues = color.rgba
  let rgbaString = `rgba(${rgbaValues.r}, ${rgbaValues.g}, ${rgbaValues.b}, ${rgbaValues.a})`
  emit('update:modelValue', rgbaString)
}
</script>

<template>
  <details class="colour-picker" @toggle="pickerOpen = $event.target.open">
    <summary class="colour-picker-button">
      <span class="swatch" :style="{ backgroundColor: modelValue }"></span>
      <span class="colour-picker-label">{{ modelValue }}</span>
      <Palette aria-hidden="true" />
    </summary>
    <div v-if="pickerOpen" class="colour-picker-panel">
      <cp theme="light" :color="modelValue" :sucker-hide="false" @changeColor="handleChangeColor" />
    </div>
  </details>
</template>

<style scoped lang="scss">
.colour-picker-button {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 44px;
  padding: 0.5rem;
  border-radius: 5px;
  border: 1px solid var(--input-border-color);
  background: var(--input-background-color);
  color: var(--input-text-color);
  list-style: none;
  cursor: pointer;

  &::-webkit-details-marker {
    display: none;
  }

  svg,
  .swatch {
    flex: none;
    width: 1.25rem;
    height: 1.25rem;
  }
}

.swatch {
  border-radius: 50%;
  border: 1px solid var(--input-border-color);
}

.colour-picker-label {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.colour-picker-panel {
  max-width: 100%;
  padding-top: 0.5rem;
  overflow-x: auto;
}
</style>
