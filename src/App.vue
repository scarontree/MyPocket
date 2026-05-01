<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import SmartInput from './components/SmartInput.vue'
import Dashboard from './views/Dashboard.vue'
import Transactions from './views/Transactions.vue'
import Assets from './views/Assets.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import Toast from './components/Toast.vue'
import { IconPlus, IconMenu, IconSettings } from './icons'

const currentView = ref('dashboard')
const sidebarOpen = ref(false)
const showSettings = ref(false)

const views = { dashboard: Dashboard, transactions: Transactions, assets: Assets }
</script>

<template>
  <div class="app">
    <Sidebar
      :currentView="currentView"
      :open="sidebarOpen"
      @navigate="v => { currentView = v; sidebarOpen = false }"
      @close="sidebarOpen = false"
      @openSettings="showSettings = true"
    />

    <main class="main">
      <header class="mobile-header">
        <button class="menu-btn" @click="sidebarOpen = true">
          <IconMenu :size="22" />
        </button>
        <div class="mobile-brand">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
          <span>MyPocket</span>
        </div>
        <button class="settings-btn" @click="showSettings = true">
          <IconSettings :size="20" />
        </button>
      </header>

      <SmartInput v-if="currentView === 'dashboard'" @openSettings="showSettings = true" />

      <KeepAlive>
        <component :is="views[currentView]" :key="currentView" />
      </KeepAlive>

      <!-- Mobile FAB -->
      <button v-if="currentView !== 'dashboard'" class="fab" @click="currentView = 'dashboard'">
        <IconPlus :size="24" />
      </button>
    </main>

    <SettingsDialog v-if="showSettings" @close="showSettings = false" />
    <Toast />
  </div>
</template>

<style scoped>
.app { display: flex; min-height: 100dvh; }
.main {
  width: min(1040px, calc(100vw - var(--sidebar-w) - 5rem));
  margin-left: calc(var(--sidebar-w) + max(2.5rem, (100vw - var(--sidebar-w) - 1040px) / 2));
  padding: 2rem 2.5rem 5rem;
}
.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: .75rem 0 1rem;
  position: sticky; top: 0;
  background: var(--bg); z-index: 50;
}
.menu-btn, .settings-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius); color: var(--text-2);
  transition: background .15s;
}
.menu-btn:hover, .settings-btn:hover { background: var(--surface-2); }
.mobile-brand {
  display: flex; align-items: center; gap: .4rem;
  font-family: var(--font-display); font-weight: 800; font-size: 1rem;
  color: var(--accent);
}
.fab {
  display: none; position: fixed;
  bottom: 1.5rem; right: 1.5rem;
  width: 52px; height: 52px;
  background: var(--accent); color: #fff;
  border-radius: 50%;
  align-items: center; justify-content: center;
  box-shadow: var(--shadow-accent); z-index: 90;
  transition: transform .15s;
}
.fab:hover { transform: scale(1.05); }

@media (max-width: 720px) {
  .main { width: 100%; margin-left: 0; padding: 0 1.15rem 6rem; }
  .mobile-header { display: flex; }
  .fab { display: flex; }
}
</style>
