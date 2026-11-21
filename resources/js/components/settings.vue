<script setup>
import { store } from '../store'
import {
  CircleX,
  Settings,
  Users as UsersIcon,
  UserPlus,
  Save,
  Palette,
  User,
  Boxes,
  Plus,
  EllipsisVertical,
  Bomb,
  Mail,
  HelpCircle,
  BarChart3,
  FolderOpen,
  RefreshCw,
  LogIn,
  Info
} from 'lucide-vue-next'
import { computed, nextTick, ref, onMounted, watch } from 'vue'
import Users from './settings/users.vue'
import BrandingSettings from './settings/branding.vue'
import SystemSettings from './settings/system.vue'
import SystemStats from './settings/systemStats.vue'
import EmailTemplates from './settings/emailTemplates.vue'
import MyProfile from './settings/myProfile.vue'
import MyShares from './settings/myShares.vue'
import AllShares from './settings/allShares.vue'
import About from './settings/about.vue'
import { getUsers } from '../api'
import ButtonWithMenu from './buttonWithMenu.vue'
import { useSetting } from '../composables/useSetting'
import { useSettingsNavigation, updateUrlHash, buildSettingsPath, clearUrlHash } from '../composables/useSettingsNavigation'

import { useTranslate } from '@tolgee/vue'

const { t } = useTranslate()
const { navigateTo } = useSettingsNavigation()

//settings panels
const usersPanel = ref(null)
const mySharesPanel = ref(null)
const allSharesPanel = ref(null)
const brandingSettings = ref(null)
const systemSettings = ref(null)

const showDeletedShares = ref(false)
const showDeletedSharesAll = ref(false)
const allSharesUsers = ref([])
const selectedUserId = ref(null)

// Subscribe to self_registration_enabled setting - auto-updates when settings change
const { value: selfRegistrationEnabled } = useSetting('self_registration_enabled', 'system.auth', false)
const settingsPanel = ref(null)
const settingsContent = ref(null)
const closeButton = ref(null)
const activeTab = ref('myShares')
const tabs = [
  { id: 'about', icon: Info, label: 'About' },
  { id: 'stats', icon: BarChart3, label: 'System Stats', admin: true },
  { id: 'branding', icon: Palette, label: 'Branding', admin: true },
  { id: 'system', icon: Settings, label: 'System', admin: true },
  { id: 'emailTemplates', icon: Mail, label: 'Email Templates', admin: true },
  { id: 'users', icon: UsersIcon, label: 'Users', admin: true },
  { id: 'allShares', icon: FolderOpen, label: 'All Shares', admin: true },
  { id: 'myShares', icon: Boxes, label: 'My Shares' },
  { id: 'myProfile', icon: User, label: 'My Profile' }
]
const visibleTabs = computed(() => tabs.filter((tab) => !tab.admin || store.isAdmin()))
const tabLabel = (tab) => t.value(`settings.title.${tab.id}`, tab.label)
const settingsTitle = computed(() => tabLabel(visibleTabs.value.find((tab) => tab.id === activeTab.value) ?? tabs[0]))

onMounted(() => {
  //do we have showDeletedShares in local storage?
  const showDeletedSharesSetting = localStorage.getItem('showDeletedShares')
  if (showDeletedSharesSetting) {
    showDeletedShares.value = showDeletedSharesSetting === 'true'
  }
  const showDeletedSharesAllSetting = localStorage.getItem('allSharesShowDeleted')
  if (showDeletedSharesAllSetting) {
    showDeletedSharesAll.value = showDeletedSharesAllSetting === 'true'
  }
})

watch(() => store.settingsOpen, async (open) => {
  if (!open) return
  await nextTick()
  closeButton.value?.focus({ preventScroll: true })
})

const closeSettings = () => {
  store.setSettingsOpen(false)
  clearUrlHash()
}

const handleSettingsEscape = (event) => {
  if (!event.target.closest('.user-form-overlay, .markdown-modal-overlay')) {
    closeSettings()
  }
}

const setActiveTab = (tab, options = {}) => {
  const { updateUrl = true } = options
  if (!visibleTabs.value.some(({ id }) => id === tab)) return

  if (activeTab.value !== tab) {
    settingsContent.value?.scrollTo({ top: 0, left: 0 })
    settingsPanel.value?.scrollTo({ top: 0, left: 0 })
  }
  activeTab.value = tab
  if (tab === 'allShares' && allSharesUsers.value.length === 0) {
    loadAllSharesUsers()
  }
  
  // Update URL hash with the new tab
  if (updateUrl) {
    updateUrlHash(tab)
  }
}

const createShare = () => {
  store.setSettingsOpen(false)
}

const handleNavItemClicked = (item, options = {}) => {
  const { skipUrlUpdate = false } = options
  const content = settingsContent.value
  const element = document.getElementById(item)
  if (content?.contains(element)) {
    const scroller = getComputedStyle(content).overflowY === 'visible' ? settingsPanel.value : content
    const offset = element.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    scroller.scrollTo({
      top: scroller.scrollTop + offset,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    })
  }
  
  // Update URL hash with current tab and section
  if (activeTab.value && !skipUrlUpdate) {
    const path = buildSettingsPath(activeTab.value, item)
    updateUrlHash(path)
  }
}

defineExpose({
  setActiveTab,
  handleNavItemClicked
})

const handlePruneExpiredShares = () => {
  mySharesPanel.value.handlePruneExpiredShares()
}

const setShowDeletedShares = (value) => {
  showDeletedShares.value = value
  localStorage.setItem('showDeletedShares', value)
  mySharesPanel.value.setShowDeletedShares(value)
}

const setShowDeletedSharesAll = (value) => {
  showDeletedSharesAll.value = value
  localStorage.setItem('allSharesShowDeleted', value)
  allSharesPanel.value.setShowDeletedShares(value)
}

const goToHelp = () => {
  window.open('https://erugo.app/docs/', '_blank')
}

const handleViewUserShares = (user) => {
  setActiveTab('allShares')
  // Use nextTick to ensure the component is mounted before setting the filter
  setTimeout(() => {
    if (allSharesPanel.value) {
      selectedUserId.value = user.id
      allSharesPanel.value.setUserFilter(user.id)
    }
  }, 100)
}

const loadAllSharesUsers = async () => {
  try {
    const data = await getUsers()
    allSharesUsers.value = data.users || []
  } catch (error) {
    console.error('Failed to load users', error)
  }
}

const handleUserFilterChange = (event) => {
  selectedUserId.value = event.target.value || null
  if (allSharesPanel.value) {
    allSharesPanel.value.setUserFilter(selectedUserId.value)
  }
}
</script>

<template>
  <div
    v-show="store.settingsOpen"
    class="settings-overlay"
    :class="{ active: store.settingsOpen }"
    @click.self="closeSettings"
    @keydown.esc="handleSettingsEscape"
  >
    <section class="settings-container" ref="settingsPanel" role="dialog" aria-modal="true" aria-labelledby="settings-heading">
      <header class="settings-header">
        <h1 id="settings-heading"><Settings /> {{ settingsTitle }}</h1>
        <div class="settings-header-actions">
          <button type="button" class="icon-only" :aria-label="$t('navigation.help', 'Help')" @click="goToHelp">
            <HelpCircle />
          </button>
          <button type="button" class="icon-only" :aria-label="$t('settings.close')" ref="closeButton" @click="closeSettings">
            <CircleX />
          </button>
        </div>
      </header>
      <div class="settings-navigation">
        <nav class="settings-tabs-container" :aria-label="$t('navigation.settings_sections', 'Settings sections')">
          <button
            v-for="tab in visibleTabs"
            :key="tab.id"
            type="button"
            class="settings-tab"
            :aria-current="activeTab === tab.id ? 'true' : undefined"
            @click="setActiveTab(tab.id)"
          >
            <Component :is="tab.icon" />
            {{ tabLabel(tab) }}
          </button>
        </nav>
        <label class="settings-section-picker">
          <span class="visually-hidden">{{ $t('navigation.settings_sections', 'Settings sections') }}</span>
          <select :value="activeTab" @change="setActiveTab($event.target.value)">
            <option v-for="tab in visibleTabs" :key="tab.id" :value="tab.id">{{ tabLabel(tab) }}</option>
          </select>
        </label>
      </div>
      <div class="settings-content" ref="settingsContent">
        <div v-if="activeTab === 'stats'" class="settings-tab-content" key="stats">
          <div class="tab-content-header">
            <h2 class="d-none d-md-flex">
              <BarChart3 />
              <span>
                {{ $t('settings.title.stats') || 'System Stats' }}
                <small>{{ $t('settings.description.stats') || 'Monitor system usage and activity' }}</small>
              </span>
            </h2>
            <div class="user-actions">
              <button @click="$refs['systemStats'].refreshStats()">
                <RefreshCw />
                {{ $t('settings.stats.refresh') }}
              </button>
            </div>
          </div>
          <div class="tab-content-body">
            <SystemStats
              ref="systemStats"
              v-if="store.settingsOpen"
              @navItemClicked="handleNavItemClicked"
            />
          </div>
        </div>
        <div v-else-if="activeTab === 'branding'" class="settings-tab-content" key="branding">
          <div class="tab-content-header">
            <h2 class="d-none d-md-flex">
              <Palette />
              <span>
                {{ $t('settings.title.branding') }}
                <small>{{ $t('settings.description.branding') }}</small>
              </span>
            </h2>
            <div class="user-actions">
              <button @click="$refs['brandingSettings'].saveSettings()">
                <Save />
                {{ $t('settings.button.branding.save') }}
              </button>
            </div>
          </div>
          <div class="tab-content-body">
            <BrandingSettings
              ref="brandingSettings"
              v-if="store.settingsOpen"
              @navItemClicked="handleNavItemClicked"
            />
          </div>
        </div>
        <div v-else-if="activeTab === 'system'" class="settings-tab-content" key="system">
          <div class="tab-content-header">
            <h2 class="d-none d-md-flex">
              <Settings />
              <span>
                {{ $t('settings.title.system') }}
                <small>{{ $t('settings.description.system') }}</small>
              </span>
            </h2>
            <div class="user-actions">
              <button @click="$refs['systemSettings'].saveSettings()">
                <Save />
                {{ $t('settings.button.system.save') }}
              </button>
            </div>
          </div>
          <div class="tab-content-body">
            <SystemSettings ref="systemSettings" v-if="store.settingsOpen" @navItemClicked="handleNavItemClicked" />
          </div>
        </div>

        <div v-else-if="activeTab === 'emailTemplates'" class="settings-tab-content" key="emailTemplates">
          <div class="tab-content-header">
            <h2 class="d-none d-md-flex">
              <Settings />
              <span>
                {{ $t('settings.title.emailTemplates') }}
                <small>{{ $t('settings.description.emailTemplates') }}</small>
              </span>
            </h2>
            <div class="user-actions">
              <button @click="$refs['emailTemplates'].saveEmailTemplates()">
                <Save />
                {{ $t('settings.button.emailTemplates.save') }}
              </button>
            </div>
          </div>
          <div class="tab-content-body">
            <EmailTemplates ref="emailTemplates" v-if="store.settingsOpen" @navItemClicked="handleNavItemClicked" />
          </div>
        </div>



        <div v-else-if="activeTab === 'users'" class="settings-tab-content" key="users">
          <div class="tab-content-header">
            <h2 class="d-none d-md-flex">
              <UsersIcon />
              <span>
                {{ $t('settings.title.users') }}
                <small>{{ $t('settings.description.users') }}</small>
              </span>
            </h2>
            <div
              class="admin-tip clickable"
              v-if="store.isAdmin()"
              @click="navigateTo('system.auth.self_registration')"
              :title="$t('settings.users.click_to_configure') || 'Click to configure'"
            >
              <Info />
              <p v-if="selfRegistrationEnabled">{{ $t('settings.users.add_user_self_registration_tip_on_short') }}</p>
              <p v-else>{{ $t('settings.users.add_user_self_registration_tip_off_short') }}</p>
            </div>
            <div class="user-actions">
              <button @click="usersPanel.addUser">
                <UserPlus />
                {{ $t('settings.button.users.add') }}
              </button>
            </div>
          </div>
          <div class="tab-content-body">
            <Users ref="usersPanel" v-if="store.settingsOpen" @viewUserShares="handleViewUserShares" />
          </div>
        </div>
        <div
          v-else-if="activeTab === 'allShares'"
          class="settings-tab-content"

          key="allShares"
        >
          <div class="tab-content-header">
            <h2 class="d-none d-md-flex">
              <FolderOpen />
              <span>
                {{ $t('settings.title.allShares') }}
                <small>{{ $t('settings.description.allShares') }}</small>
              </span>
            </h2>
            <div class="user-actions">
              <div class="filter-actions">
                <div class="col-auto">
                  <div class="checkbox-container">
                    <input type="checkbox" id="show_deleted_shares_all" :checked="showDeletedSharesAll" @change="setShowDeletedSharesAll($event.target.checked)" />
                    <label for="show_deleted_shares_all">{{ $t('settings.system.show_deleted_shares') }}</label>
                  </div>
                </div>
                <div class="col-auto">
                  <select id="user-filter-all" class="user-filter-select" @change="handleUserFilterChange" :value="selectedUserId || ''">
                    <option value="">{{ $t('settings.allShares.allUsers') }}</option>
                    <option v-for="user in allSharesUsers" :key="user.id" :value="user.id">
                      {{ user.name }} ({{ user.email }})
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="tab-content-body">
            <AllShares ref="allSharesPanel" v-if="store.settingsOpen" />
          </div>
        </div>
        <div
          v-else-if="activeTab === 'myProfile'"
          class="settings-tab-content"

          key="myProfile"
        >
          <div class="tab-content-header">
            <h2 class="d-none d-md-flex">
              <User />
              <span>
                {{ $t('settings.title.myProfile') }}
                <small>{{ $t('settings.description.myProfile') }}</small>
              </span>
            </h2>
            <div class="user-actions">
              <button @click="$refs['myProfilePanel'].saveUser()">
                <Save />
                {{ $t('settings.button.myProfile.save') }}
              </button>
            </div>
          </div>
          <div class="tab-content-body">
            <MyProfile ref="myProfilePanel" v-if="store.settingsOpen" @navItemClicked="handleNavItemClicked" />
          </div>
        </div>
        <div
          v-else-if="activeTab === 'myShares'"
          class="settings-tab-content"

          key="myShares"
        >
          <div class="tab-content-header">
            <h2 class="d-none d-md-flex">
              <Boxes />
              <span>
                {{ $t('settings.title.myShares') }}
                <small>{{ $t('settings.description.myShares') }}</small>
              </span>
            </h2>
            <div class="user-actions">
              <div class="filter-actions">
                <div class="col-auto">
                  <div class="checkbox-container">
                    <input type="checkbox" id="show_deleted_shares" :checked="showDeletedShares" @change="setShowDeletedShares($event.target.checked)" />
                    <label for="show_deleted_shares">{{ $t('settings.system.show_deleted_shares') }}</label>
                  </div>
                </div>
                <div class="col-auto pe-0">
                  <button @click="createShare">
                    <Plus />
                    {{ $t('settings.button.myShares.create') }}
                  </button>
                </div>
                <div class="col-auto pe-0">
                  <ButtonWithMenu
                    :label="$t('navigation.more_share_actions', 'More share actions')"
                    :items="[
                      {
                        icon: Bomb,
                        label: t('settings.button.myShares.pruneExpired'),
                        action: handlePruneExpiredShares
                      }
                    ]"
                  >
                    <template #icon>
                      <EllipsisVertical />
                    </template>
                  </ButtonWithMenu>
                </div>
              </div>
            </div>
          </div>
          <div class="tab-content-body">
            <MyShares ref="mySharesPanel" v-if="store.settingsOpen" />
          </div>
        </div>
        <div
          v-else-if="activeTab === 'about'"
          class="settings-tab-content"

          key="about"
        >
          <div class="tab-content-header">
            <h2 class="d-none d-md-flex">
              <Info />
              <span>
                {{ $t('settings.title.about') }}
                <small>{{ $t('settings.description.about') }}</small>
              </span>
            </h2>
          </div>
          <div class="tab-content-body">
            <About v-if="store.settingsOpen" @navItemClicked="handleNavItemClicked" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  height: var(--viewport-height);
  z-index: 210;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  background: var(--overlay-background-color);
  backdrop-filter: blur(10px);
}

.settings-container {
  display: flex;
  flex-direction: column;
  width: min(var(--settings-width), 100%);
  height: min(var(--settings-height), 100%);
  min-width: 0;
  padding-inline: env(safe-area-inset-left) env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--panel-background-color);
  overflow-wrap: anywhere;
}

.settings-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: max(0.375rem, env(safe-area-inset-top)) var(--page-gutter) 0.375rem;
  background: var(--panel-header-background-color);

  h1 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    margin: 0;
    font-size: clamp(1rem, 3vw, 1.25rem);
    color: var(--panel-header-text-color);
  }

  svg {
    flex: none;
  }
}

.settings-header-actions {
  display: flex;
  flex: none;
  gap: 0.25rem;

  button {
    width: 44px;
    height: 44px;
    margin: 0;
  }
}

.settings-navigation {
  flex: none;
  container-type: inline-size;
  background: var(--tabs-bar-background-color);
}

.settings-tabs-container {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.25rem;
  padding: 0.375rem var(--page-gutter) 0;

  .settings-tab {
    gap: 0.5rem;
    height: auto;
    min-height: 44px;
    max-width: 100%;
    margin: 0;
    padding: 0.625rem;
    border-radius: var(--tabs-border-radius);
    color: var(--tabs-tab-text-color);
    background: var(--tabs-tab-background-color);
    line-height: 1.25;
    text-align: start;

    svg {
      flex: none;
      margin: 0;
    }

    &:hover {
      background: var(--tabs-tab-background-color-hover);
      color: var(--tabs-tab-text-color-hover);
    }

    &[aria-current='true'] {
      background: var(--tabs-tab-background-color-active);
      color: var(--tabs-tab-text-color-active);
    }
  }
}

.settings-section-picker {
  display: none;
  padding: 0.375rem var(--page-gutter);

  select {
    width: 100%;
    height: auto;
    min-height: 44px;
    margin: 0;
  }
}

@mixin compact-navigation {
  .settings-tabs-container {
    display: none;
  }

  .settings-section-picker {
    display: block;
  }
}

@container (max-width: 68rem) {
  @include compact-navigation;
}

@media (max-width: 68rem), (max-height: 32rem) {
  @include compact-navigation;
}

@media (max-width: 42rem), (max-height: 32rem) {
  .settings-container {
    width: 100%;
    height: 100%;
  }
}

.settings-content {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

@media (max-height: 16rem) {
  .settings-container {
    overflow: auto;
    overscroll-behavior: contain;
  }

  .settings-content {
    flex: 1 0 auto;
    overflow: visible;
  }
}

.tab-content-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: var(--page-gutter);
  background: var(--panel-subheader-background-color);

  h2 {
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
    margin: 0;
    color: var(--panel-subheader-text-color);
    font-size: 1.25rem;

    small {
      display: block;
      font-size: 0.8rem;
    }
  }

  svg {
    flex: none;
  }
}

.user-actions,
.filter-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: 100%;
  min-width: 0;

  button {
    height: auto;
    min-height: 44px;
    max-width: 100%;
    margin: 0;
    padding-block: 0.5rem;
    line-height: 1.25;
  }

  .checkbox-container {
    width: auto;
    max-width: 100%;
    padding: 0;
  }
}

.filter-actions > div {
  min-width: 0;
  max-width: 100%;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.user-filter-select {
  width: min(100%, 18rem);
  min-width: 0;
  height: auto;
  min-height: 44px;
  margin: 0;
}

.admin-tip {
  background: var(--secondary-button-background-color);
  padding: 10px 20px;
  border-radius: var(--button-border-radius);
  p {
    font-size: 0.8rem;
    color: var(--secondary-button-text-color)!important;
    margin: 0;
  }
  display: flex;
  align-items: center;
  gap: 10px;
  svg {
    width: 20px;
    height: 20px;
  }
  
  &.clickable {
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--secondary-button-background-color-hover, var(--secondary-button-background-color));
      transform: translateY(-1px);
    }
  }
}
</style>
