<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { CircleMinus } from 'lucide-vue-next'
const props = defineProps({
  recipient: {
    type: Object,
    required: true
  },
  disabled: Boolean
})
const emit = defineEmits(['remove'])

const isPopoverOpen = ref(false)
const recipientRef = ref(null)
const recipientPopoverRef = ref(null)
const nameInput = ref(null)
const emailInput = ref(null)

const closePopover = (restoreFocus = false) => {
  isPopoverOpen.value = false
  if (!props.recipient.email && !props.recipient.name) {
    emit('remove', props.recipient)
  } else if (restoreFocus) {
    recipientRef.value?.focus()
  }
}

const togglePopover = async () => {
  if (isPopoverOpen.value) {
    closePopover(true)
    return
  }

  isPopoverOpen.value = true
  await nextTick()

  const popover = recipientPopoverRef.value
  const button = recipientRef.value
  if (!isPopoverOpen.value || !popover || !button) return

  const { top, left, width } = button.getBoundingClientRect()
  const edgePadding = popover.offsetWidth / 2 + 8
  const popoverCenter = Math.min(window.innerWidth - edgePadding, Math.max(edgePadding, left + width / 2))
  popover.style.top = `${top - popover.offsetHeight}px`
  popover.style.left = `${popoverCenter}px`
  nameInput.value?.focus()
}

const closeOnPointerDownOutside = ({ target }) => {
  if (isPopoverOpen.value && !recipientPopoverRef.value?.contains(target) && !recipientRef.value?.contains(target)) {
    closePopover()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', closeOnPointerDownOutside)
  if (props.recipient.showPopover) {
    togglePopover()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeOnPointerDownOutside)
})

const removeRecipient = () => {
  const confirm = window.confirm('Are you sure you want to remove this recipient?')
  if (confirm) {
    emit('remove', props.recipient)
  }
}
</script>
<template>
  <button
    type="button"
    class="recipient"
    :title="recipient.email"
    :aria-label="recipient.name || $t('Add Recipient')"
    :aria-expanded="isPopoverOpen && !disabled"
    :disabled="disabled"
    @click="togglePopover"
    ref="recipientRef"
  >
    {{ recipient.name }}
  </button>
  <teleport to="body">
    <div
      v-show="isPopoverOpen && !disabled"
      class="recipient-popover"
      :class="{ active: isPopoverOpen }"
      @keydown.esc.stop="closePopover(true)"
      ref="recipientPopoverRef"
    >
      <div class="recipient-popover-content">
        <div>
          <input
            type="text"
            v-model.trim="recipient.name"
            :placeholder="$t('full_name')"
            :aria-label="$t('full_name')"
            maxlength="255"
            ref="nameInput"
            @keyup.enter="emailInput?.focus()"
          />
          <input
            type="email"
            v-model.trim="recipient.email"
            :placeholder="$t('email')"
            :aria-label="$t('email')"
            maxlength="255"
            ref="emailInput"
            @keyup.enter="closePopover(true)"
          />
        </div>
        <div class="button-container">
          <div class="button-outside-label">
            <button
              type="button"
              class="icon-only round"
              :aria-label="$t('uploader.remove_recipient', 'Remove recipient')"
              @click="removeRecipient"
            >
              <CircleMinus />
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.recipient {
  position: relative;
  display: block;
  background: var(--primary-button-background-color);
  font-size: 12px;
  color: var(--primary-button-text-color);
  font-weight: 400;
  padding: 5px;
  height: auto;
  min-height: 25px;
  min-width: 20px;
  max-width: 100%;
  margin: 0;
  overflow-wrap: anywhere;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background: var(--primary-button-background-color-hover);
  }
  .email {
    display: block;
    color: var(--primary-button-text-color);
    font-weight: 600;
  }
  .name {
    display: block;
    font-size: 0.5rem;
    color: var(--primary-button-text-color);
  }
}
.recipient-popover {
  position: fixed;

  background: var(--panel-background-color);
  border-radius: 5px;
  padding: 5px 5px;
  z-index: 1000;
  opacity: 0;
  transition: all 0.5s ease-in-out;
  pointer-events: none;
  filter: blur(10px);
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.1);
  transform: skewX(-2deg) translate(-50%) translateY(10px);
  &.active {
    opacity: 1;
    pointer-events: auto;
    filter: blur(0px);
    transform: translate(-50%) translateY(-10px);
  }
  //little triangle at the bottom
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: calc(50% - 10px);
    width: 20px;
    height: 10px;
    background: var(--panel-background-color);
    clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
  }

  .recipient-popover-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;

    .button-container {
      position: absolute;
      right: 10px;
      top: 18px;
      svg {
        width: 13px;
        height: 13px;
        margin-top: -1px;

      }
      .button-outside-label-text {
        margin-left: -7px;
      }
    }
  }

  input {
    width: 200px;
    height: 30px;
    border-radius: 0px;
    border: none;
    padding: 5px;
    margin-bottom: 0px;
    display: block;
    background: var(--input-background-color);
    color: var(--input-text-color);
    font-size: 12px;
    font-weight: 400;
    padding: 5px;
    border-radius: 5px 5px 0 0;
    &:first-child {
      margin-bottom: 1px;
    }
    &:last-child {
      border-radius: 0 0 5px 5px;
    }
    &:focus {
      outline: none;
    }
  }
}
</style>
