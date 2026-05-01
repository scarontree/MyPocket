<script setup>
import { useLedgerStore } from '../stores/ledger'
import { IconGrid, IconList, IconWallet, IconChevLeft, IconChevRight, IconDownload, IconUpload, IconSettings } from '../icons'

const props = defineProps(['currentView', 'open'])
const emit = defineEmits(['navigate', 'close', 'openSettings'])
const store = useLedgerStore()

const navItems = [
  { id: 'dashboard', label: '总览', icon: IconGrid },
  { id: 'transactions', label: '明细', icon: IconList },
  { id: 'assets', label: '资产', icon: IconWallet },
]

function doExport() {
  const blob = new Blob([store.exportData()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `mypocket_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

function doImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = () => {
    const file = input.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (data.transactions) store.importData(data)
      } catch { /* ignore */ }
    }
    reader.readAsText(file)
  }
  input.click()
}
</script>

<template>
  <div class="sidebar-overlay" :class="{ visible: open }" @click="emit('close')" />
  <aside class="sidebar" :class="{ open }">
    <div class="brand">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <circle cx="17" cy="14" r="1.5" fill="var(--accent)" stroke="none"/>
      </svg>
      <h1>MyPocket</h1>
    </div>

    <nav class="nav">
      <button
        v-for="item in navItems" :key="item.id"
        class="nav-btn" :class="{ active: currentView === item.id }"
        @click="emit('navigate', item.id)"
      >
        <component :is="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="month-sel">
      <button class="month-arrow" @click="store.changeMonth(-1)"><IconChevLeft :size="18" /></button>
      <span class="month-label">{{ store.currentYear }}年{{ store.currentMonth }}月</span>
      <button class="month-arrow" @click="store.changeMonth(1)"><IconChevRight :size="18" /></button>
    </div>

    <div class="footer">
      <button class="footer-btn" @click="doExport"><IconDownload :size="15" /><span>导出</span></button>
      <button class="footer-btn" @click="doImport"><IconUpload :size="15" /><span>导入</span></button>
      <button class="footer-btn" @click="emit('openSettings')"><IconSettings :size="15" /><span>设置</span></button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(42,37,32,.3); z-index: 99;
  opacity: 0; transition: opacity .3s;
}
.sidebar-overlay.visible { display: block; opacity: 1; }

.sidebar {
  width: var(--sidebar-w); background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  padding: 1.5rem 1rem;
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
  transition: transform .3s var(--ease-out);
}
.brand {
  display: flex; align-items: center; gap: .55rem;
  padding: 0 .5rem .75rem; margin-bottom: 1.25rem;
}
.brand h1 {
  font-family: var(--font-display); font-size: 1.1rem;
  font-weight: 800; letter-spacing: -.02em; color: var(--text);
}
.nav { display: flex; flex-direction: column; gap: .2rem; margin-bottom: auto; }
.nav-btn {
  display: flex; align-items: center; gap: .6rem;
  padding: .55rem .75rem; border-radius: var(--radius);
  font-size: .88rem; font-weight: 500; color: var(--text-2);
  transition: all .15s; width: 100%; text-align: left;
}
.nav-btn:hover { background: var(--surface-2); color: var(--text); }
.nav-btn.active { background: var(--accent-soft); color: var(--accent-hover); font-weight: 600; }
.nav-btn svg { flex-shrink: 0; }

.month-sel {
  display: flex; align-items: center; justify-content: center; gap: .4rem;
  padding: .7rem 0; margin: .75rem 0;
  border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
}
.month-arrow {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; color: var(--text-2); transition: all .15s;
}
.month-arrow:hover { background: var(--surface-2); color: var(--text); }
.month-label { font-weight: 600; font-size: .88rem; min-width: 5.5rem; text-align: center; }

.footer { display: flex; gap: .35rem; padding-top: .5rem; }
.footer-btn {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: .3rem; padding: .45rem; border-radius: var(--radius);
  font-size: .75rem; color: var(--text-3); transition: all .15s;
}
.footer-btn:hover { background: var(--surface-2); color: var(--text-2); }

@media (max-width: 720px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: none; box-shadow: var(--shadow-lg); }
}
</style>
