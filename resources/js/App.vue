<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'


//components
import LanguageSelector from './components/languageSelector.vue'
import Uploader from './components/uploader.vue'
import Downloader from './components/downloader.vue'
import Auth from './components/auth.vue'
import Settings from './components/settings.vue'
import Setup from './components/setup.vue'
import ThankGuestForUpload from './components/thankGuestForUpload.vue'
import ReverseInvite from './components/reverseInvite.vue'
import Background from './components/layout/background.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import CommandPalette from './components/CommandPalette.vue'

//3rd party
import { LogOut, Settings as SettingsIcon, MailPlus, Menu, X } from 'lucide-vue-next'
import { TolgeeProvider } from '@tolgee/vue'
import { useToast } from 'vue-toastification'
import { useTranslate } from '@tolgee/vue'

//1st party
import { domData, domError, domSuccess } from './domData'
import { emitter, store } from './store'
import { logout } from './api'
import { checkUrlHash } from './composables/useSettingsNavigation'


//use
const { t } = useTranslate()

//static data
const logoTimestamp = ref(Date.now())
const logoUrl = computed(() => `/images/logo.png?t=${logoTimestamp.value}`)
const allowReverseShares = ref(false)
const logoWidth = ref(0)
const showPoweredBy = ref(false)
const setupNeeded = ref(false)

//reactive data
const auth = ref(null)
const downloadShareCode = ref('')
const settingsPanel = ref(null)
const toast = useToast()
const reverseInvite = ref(null)
const showLanguageSelector = domData().show_language_selector === true
const appMenuOpen = ref(false)
const appMenuToggle = ref(null)
const settingsButton = ref(null)
let openedSettingsFromMenu = false

const closeAppMenu = (restoreFocus = false) => {
  if (!appMenuOpen.value) return
  appMenuOpen.value = false
  if (restoreFocus) appMenuToggle.value?.focus()
}

watch(() => store.settingsOpen, async (open) => {
  if (open) closeAppMenu()
  if (!open && openedSettingsFromMenu) {
    openedSettingsFromMenu = false
    await nextTick()
    const toggle = appMenuToggle.value
    const returnTarget = toggle?.getClientRects().length ? toggle : settingsButton.value
    returnTarget?.focus({ preventScroll: true })
  }
})

onMounted(() => {

  allowReverseShares.value = domData().allow_reverse_shares
  logoWidth.value = domData().logo_width
  showPoweredBy.value = domData().show_powered_by
  setupNeeded.value = domData().setup_needed

  if (domError().length > 0) {
    console.log('error', domError())
    nextTick(() => {
      toast.error(domError())
    })
  }

  if (domSuccess().length > 0) {
    nextTick(() => {
      console.log('domSuccess', domSuccess())
      toast.success(domSuccess())
      if (domSuccess() == 'Account linked successfully') {
        store.setSettingsOpen(true)
        settingsPanel.value.setActiveTab('myProfile')
        setTimeout(() => {
          settingsPanel.value.handleNavItemClicked('linked_accounts')
        }, 500)
      }
    })
  }

  if (setupNeeded.value) {
    store.setMode('setup')
    return
  }

  //figure out which mode the application is in
  setMode()

  //register events
  emitter.on('showPasswordResetForm', () => {
    settingsPanel.value.setActiveTab('myProfile')
    nextTick(() => {
      store.setSettingsOpen(true)
      nextTick(() => {
        emitter.emit('profileEditActive')
      })
    })
  })

  // Register settings navigation event listener
  emitter.on('settingsNavigate', handleSettingsNavigate)

  // Check for settings deep-link in URL hash
  // Delay slightly to ensure user is logged in and settings panel is available
  setTimeout(() => {
    checkSettingsDeepLink()
  }, 100)
})

const setMode = () => {
  if (window.location.pathname.includes('shares')) {
    store.setMode('download')
    downloadShareCode.value = window.location.pathname.split('/').pop()
    setPageTitle('Download Share')
  } else {
    store.setMode('upload')
    setPageTitle('Create Share')
  }
}

const setPageTitle = (title) => {
  let currentTitle = document.title
  document.title = `${currentTitle} - ${title}`
}

const handleLogoutClick = () => {
  if (store.isGuest()) {
    const confirm = window.confirm(t.value('auth.confirm_end_guest_session'))
    if (!confirm) {
      return
    }
  }

  closeAppMenu(true)
  logout()
}

const openSettings = () => {
  openedSettingsFromMenu = true
  store.setSettingsOpen(true)
}

const openReverseShareInvite = () => {
  closeAppMenu(true)
  reverseInvite.value.showReverseInviteForm()
}

/**
 * Handle settings navigation from the composable
 * @param {{ tab: string, section: string|null, subSection: string|null, skipUrlUpdate?: boolean }} navigation
 */
const handleSettingsNavigate = (navigation) => {
  const { tab, section, subSection, skipUrlUpdate = false } = navigation

  // Open settings panel
  store.setSettingsOpen(true)

  // Wait for settings panel to be ready, then navigate
  nextTick(() => {
    if (!settingsPanel.value) {
      console.warn('[App] Settings panel not available')
      return
    }

    // Set the active tab (skip URL update if requested)
    settingsPanel.value.setActiveTab(tab, { updateUrl: !skipUrlUpdate })

    // If there's a section or sub-section to scroll to, do it after a short delay
    // to allow the tab content to render
    if (section || subSection) {
      setTimeout(() => {
        // Prefer sub-section if available, otherwise use section
        const scrollTarget = subSection || section
        settingsPanel.value.handleNavItemClicked(scrollTarget, { skipUrlUpdate })
      }, 300)
    }
  })
}

/**
 * Track if we've already handled the initial deep-link
 */
const deepLinkHandled = ref(false)

/**
 * Check for settings deep-link in URL hash on page load
 */
const checkSettingsDeepLink = () => {
  if (deepLinkHandled.value) return
  
  const hashNav = checkUrlHash()
  if (hashNav && store.isLoggedIn()) {
    deepLinkHandled.value = true
    // Skip URL update since we're already at the correct URL
    handleSettingsNavigate({ ...hashNav, skipUrlUpdate: true })
  }
}

// Watch for login state changes to handle deep-links
watch(
  () => store.loggedIn,
  (isLoggedIn) => {
    if (!isLoggedIn) {
      closeAppMenu()
      store.setSettingsOpen(false)
      return
    }
    if (isLoggedIn && !deepLinkHandled.value) {
      // Small delay to ensure settings panel is mounted
      setTimeout(() => {
        checkSettingsDeepLink()
      }, 100)
    }
  }
)
</script>

<template>
  <TolgeeProvider>
    <Background />
    <header
      v-if="store.mode !== 'setup' || showLanguageSelector"
      class="app-header"
      :inert="store.settingsOpen"
      @keydown.esc="closeAppMenu(true)"
    >
      <a v-if="store.mode !== 'setup'" class="logo-container" href="/">
        <img :src="logoUrl" alt="Erugo" id="logo" :style="{ width: `${logoWidth}px` }" />
      </a>
      <template v-if="showLanguageSelector || store.isLoggedIn()">
        <button
          type="button"
          class="app-menu-toggle secondary icon-only"
          ref="appMenuToggle"
          :aria-label="$t('navigation.menu', 'Menu')"
          :aria-expanded="appMenuOpen"
          aria-controls="app-actions"
          @click="appMenuOpen = !appMenuOpen"
        >
          <X v-if="appMenuOpen" />
          <Menu v-else />
        </button>
        <nav
          id="app-actions"
          class="app-actions"
          :class="{ 'is-open': appMenuOpen }"
          :aria-label="$t('navigation.menu', 'Menu')"
        >
          <button
            v-if="store.isLoggedIn() && !store.isGuest() && allowReverseShares"
            type="button"
            class="app-action secondary"
            :title="t('button.reverse_share_invite')"
            @click="openReverseShareInvite"
          >
            <MailPlus />
            <span>{{ $t('button.reverse_share_invite') }}</span>
          </button>
          <button
            v-if="store.isLoggedIn() && !store.isGuest()"
            type="button"
            class="app-action secondary"
            ref="settingsButton"
            :title="$t('navigation.settings', 'Settings')"
            @click="openSettings"
          >
            <SettingsIcon />
            <span>{{ $t('navigation.settings', 'Settings') }}</span>
          </button>
          <button
            v-if="store.isLoggedIn()"
            type="button"
            class="app-action secondary"
            :title="store.isGuest() ? t('auth.end_guest_session') : t('auth.logout')"
            @click="handleLogoutClick"
          >
            <LogOut />
            <span>{{ store.isGuest() ? t('auth.end_guest_session') : t('auth.logout') }}</span>
          </button>
          <LanguageSelector v-if="showLanguageSelector" />
        </nav>
      </template>
    </header>
    <main class="main" :inert="store.settingsOpen">
      <!-- auth: shows if user is not logged in and the mode is upload -->
      <Auth v-show="!store.isLoggedIn() && store.mode === 'upload'" ref="auth" />

      <!-- uploader: shows if user is logged in and mode is upload -->
      <Uploader v-if="store.mode === 'upload' && store.isLoggedIn()" />

      <!-- downloader -->
      <Downloader v-if="store.mode === 'download'" :downloadShareCode="downloadShareCode" />

      <!-- setup wizard: shows if mode is setup -->
      <Setup v-if="store.mode === 'setup'" />

      <!-- thank guest for upload: shows if mode is thank_guest_for_upload -->
      <ThankGuestForUpload v-if="store.mode === 'thank_guest_for_upload'" />
    </main>

    <footer v-if="showPoweredBy" :inert="store.settingsOpen">
      <div class="powered-by">
        {{ $t('Powered by') }}
        <a href="https://erugo.app"><img :src="'/icon.svg'" alt="Erugo" class="erugo-icon" /> Erugo</a>
      </div>
    </footer>

    <!-- settings: load only if user is logged in -->
    <Settings ref="settingsPanel" v-if="store.isLoggedIn()" />

    <!-- reverse invite: load only if reverse shares are allowed and user is logged in and not a guest -->
    <ReverseInvite ref="reverseInvite" v-if="allowReverseShares && !store.isGuest() && store.isLoggedIn()" />

    <!-- confirmation dialog: available globally -->
    <ConfirmDialog />

    <!-- command palette: available when logged in -->
    <CommandPalette v-if="store.isLoggedIn()" />
  </TolgeeProvider>
</template>


<style scoped>
.erugo-icon {
  width: 20px;
  height: 20px;
  margin-top: -5px;
  margin-left: -5px;
}
</style>
