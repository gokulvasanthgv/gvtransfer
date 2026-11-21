<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { Trash } from 'lucide-vue-next'

const props = defineProps({
  recipient: { type: Object, required: true },
  editing: Boolean,
  disabled: Boolean
})
const emit = defineEmits(['edit', 'close', 'remove'])
const nameInput = ref(null)
const emailInput = ref(null)
const recipientButton = ref(null)

const focusName = () => {
  if (props.editing) nameInput.value?.focus()
}
onMounted(focusName)
watch(() => props.editing, focusName, { flush: 'post' })

const closeEditor = async () => {
  emit('close', props.recipient)
  await nextTick()
  recipientButton.value?.focus({ preventScroll: true })
}
</script>

<template>
  <div class="recipient-entry" :class="{ editing }">
    <button
      type="button"
      class="recipient"
      ref="recipientButton"
      :title="recipient.email"
      :aria-expanded="editing"
      :disabled="disabled"
      @click="editing ? closeEditor() : emit('edit', recipient)"
    >
      {{ recipient.name || recipient.email || $t('Add Recipient') }}
    </button>
    <form v-if="editing" class="recipient-fields" @submit.prevent="closeEditor" @keydown.esc.stop="closeEditor">
      <label>
        {{ $t('full_name') }}
        <input
          type="text"
          v-model.trim="recipient.name"
          required
          maxlength="255"
          ref="nameInput"
          @keydown.enter.prevent="emailInput?.focus()"
        />
      </label>
      <label>
        {{ $t('email') }}
        <input type="email" v-model.trim="recipient.email" required maxlength="255" ref="emailInput" />
      </label>
      <div class="recipient-actions">
        <button
          type="button"
          class="secondary icon-only"
          :aria-label="$t('uploader.remove_recipient', 'Remove recipient')"
          :title="$t('uploader.remove_recipient', 'Remove recipient')"
          @click="emit('remove', recipient)"
        >
          <Trash />
        </button>
        <button type="submit">{{ $t('uploader.recipient_done', 'Done') }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss">
.recipient-entry {
  min-width: 0;
  max-width: 100%;

  &.editing {
    flex: 1 0 100%;
  }
}

.recipient,
.recipient-actions button {
  max-width: 100%;
  min-height: 44px;
  height: auto;
  padding: 0.5rem 0.75rem;
  margin: 0;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.recipient-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 0.625rem;
  margin-top: 0.5rem;
  padding: 0.625rem;
  border-radius: var(--panel-border-radius);
  background: var(--panel-background-color);
  color: var(--panel-text-color);

  label {
    min-width: 0;
    margin: 0;
    font-size: 0.875rem;
  }

  input {
    display: block;
    height: auto;
    min-height: 44px;
    margin: 0.25rem 0 0;
    font-size: 1rem;
  }
}

.recipient-actions {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
