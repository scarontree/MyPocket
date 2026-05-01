<script setup>
import { ref } from 'vue'
import { useLedgerStore } from '../stores/ledger'
import { useSettingsStore } from '../stores/settings'
import { IconGrid, IconList, IconWallet, IconChevLeft, IconChevRight, IconDownload, IconUpload, IconSettings } from '../icons'
import { createBackup, restoreBackup } from '../utils/backup'
import { decodeBackupCsv, encodeBackupCsv } from '../utils/csvBackup'
import { decodeBackupWorkbook, decodeLegacyWorkbook, encodeBackupWorkbook } from '../utils/excelBackup'

const props = defineProps(['currentView', 'open'])
const emit = defineEmits(['navigate', 'close', 'openSettings'])
const store = useLedgerStore()
const settings = useSettingsStore()

const navItems = [
  { id: 'dashboard', label: '总览', icon: IconGrid },
  { id: 'transactions', label: '明细', icon: IconList },
  { id: 'assets', label: '资产', icon: IconWallet },
]

const showExportMenu = ref(false)

function fileDate() { return new Date().toISOString().slice(0, 10) }

function download(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── Export: JSON (full backup) ──
function exportJSON() {
  const backup = createBackup(store, settings)
  download(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }), `mypocket_full_${fileDate()}.json`)
  showExportMenu.value = false
  window.__toast?.('已导出完整备份（含 API Key）✓')
}

// ── Export: CSV ──
function exportCSV() {
  const csv = encodeBackupCsv(createBackup(store, settings))
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `mypocket_full_${fileDate()}.csv`)
  showExportMenu.value = false
  window.__toast?.('已导出完整 CSV（含 API Key）✓')
}

// ── Export: Excel ──
async function exportExcel() {
  const XLSX = await import('xlsx')
  const buf = encodeBackupWorkbook(XLSX, createBackup(store, settings))
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `mypocket_full_${fileDate()}.xlsx`)
  showExportMenu.value = false
  window.__toast?.('已导出完整 Excel（含 API Key）✓')
}

// ── Import ──
function doImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,.csv,.xlsx,.xls'
  input.onchange = async () => {
    const file = input.files[0]
    if (!file) return
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'json') {
        const data = JSON.parse(await file.text())
        const kind = restoreBackup(data, store, settings)
        window.__toast?.(kind === 'full' ? '导入完整备份成功 ✓' : '导入旧版账本备份成功 ✓')
        return
      }

      const XLSX = await import('xlsx')
      const csvText = ext === 'csv' ? await file.text() : ''
      if (ext === 'csv') {
        const backup = decodeBackupCsv(csvText)
        if (backup) {
          restoreBackup(backup, store, settings)
          window.__toast?.('导入完整 CSV 备份成功 ✓')
          return
        }
      }
      const wb = ext === 'csv'
        ? XLSX.read(csvText, { type: 'string', raw: true })
        : XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false })

      const backup = decodeBackupWorkbook(XLSX, wb)
      if (backup) {
        restoreBackup(backup, store, settings)
        window.__toast?.('导入完整 Excel 备份成功 ✓')
        return
      }

      const { transactions, assets } = decodeLegacyWorkbook(XLSX, wb, store.categories)
      store.addTransactions(transactions)
      if (assets.length) store.importData({ assets })
      window.__toast?.(`追加导入 ${transactions.length} 笔${assets.length ? `，恢复 ${assets.length} 个资产` : ''}成功 ✓`)
    } catch (e) {
      window.__toast?.(e.message || '导入失败，文件格式不对')
    }
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
      <div class="export-wrap">
        <button class="footer-btn" @click="showExportMenu = !showExportMenu"><IconDownload :size="15" /><span>导出</span></button>
        <Transition name="pop">
          <div v-if="showExportMenu" class="export-menu">
            <button @click="exportExcel">Excel 完整备份（含 Key）</button>
            <button @click="exportCSV">CSV 完整备份（含 Key）</button>
            <button @click="exportJSON">JSON 完整备份（含 Key）</button>
          </div>
        </Transition>
      </div>
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

.footer {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .35rem; padding-top: .5rem;
}
.footer-btn {
  width: 100%; min-width: 0;
  display: flex; align-items: center; justify-content: center;
  flex-wrap: nowrap; white-space: nowrap;
  gap: .3rem; padding: .45rem; border-radius: var(--radius);
  font-size: .75rem; color: var(--text-3); transition: all .15s;
}
.footer-btn span { white-space: nowrap; }
.footer-btn svg { flex-shrink: 0; }
.footer-btn:hover { background: var(--surface-2); color: var(--text-2); }

.export-wrap { position: relative; min-width: 0; }
.export-menu {
  position: absolute; bottom: calc(100% + .5rem); left: 0;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow-lg);
  min-width: 170px; padding: .3rem; z-index: 110;
}
.export-menu button {
  display: block; width: 100%; text-align: left;
  padding: .45rem .6rem; border-radius: 6px;
  font-size: .78rem; color: var(--text); transition: background .1s;
}
.export-menu button:hover { background: var(--surface-2); }

.pop-enter-active { animation: popIn .15s var(--ease-out); }
.pop-leave-active { animation: popIn .1s var(--ease-out) reverse; }
@keyframes popIn {
  from { opacity: 0; transform: translateY(4px) scale(.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 720px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: none; box-shadow: var(--shadow-lg); }
}
</style>
