<script setup>
import { ref } from 'vue'
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
  download(new Blob([store.exportData()], { type: 'application/json' }), `mypocket_${fileDate()}.json`)
  showExportMenu.value = false
  window.__toast?.('已导出 JSON ✓')
}

// ── Export: CSV ──
function exportCSV() {
  const rows = [['日期', '名称', '金额', '分类', '分类ID', '备注', '月份']]
  store.monthTx.forEach(tx => {
    const cat = store.getCat(tx.category)
    rows.push([tx.date, tx.name, tx.amount.toFixed(2), cat.name, tx.category, tx.note || '', tx.month])
  })
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const bom = '\uFEFF' // UTF-8 BOM for Excel compatibility
  download(new Blob([bom + csv], { type: 'text/csv;charset=utf-8' }), `mypocket_${store.currentMonthKey}_${fileDate()}.csv`)
  showExportMenu.value = false
  window.__toast?.('已导出 CSV ✓')
}

// ── Export: Excel ──
async function exportExcel() {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  // Transactions sheet
  const txData = store.monthTx.map(tx => ({
    '日期': tx.date,
    '名称': tx.name,
    '金额': tx.amount,
    '分类': store.getCat(tx.category).name,
    '备注': tx.note || '',
  }))
  if (txData.length === 0) txData.push({ '日期': '', '名称': '暂无记录', '金额': 0, '分类': '', '备注': '' })
  const ws1 = XLSX.utils.json_to_sheet(txData)
  ws1['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws1, `${store.currentYear}年${store.currentMonth}月`)

  // Assets sheet
  const assetData = store.assets.map(a => ({
    '账户': a.name,
    '余额': a.balance,
    '类型': a.type,
    '备注': a.note || '',
  }))
  if (assetData.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(assetData)
    ws2['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws2, '资产')
  }

  // Summary row at bottom of tx sheet
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `mypocket_${store.currentMonthKey}_${fileDate()}.xlsx`)
  showExportMenu.value = false
  window.__toast?.('已导出 Excel ✓')
}

// ── Import ──
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
        if (data.transactions) { store.importData(data); window.__toast?.('导入成功 ✓') }
      } catch { window.__toast?.('导入失败，文件格式不对') }
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
      <div class="export-wrap">
        <button class="footer-btn" @click="showExportMenu = !showExportMenu"><IconDownload :size="15" /><span>导出</span></button>
        <Transition name="pop">
          <div v-if="showExportMenu" class="export-menu">
            <button @click="exportExcel">📊 Excel (.xlsx)</button>
            <button @click="exportCSV">📄 CSV (.csv)</button>
            <button @click="exportJSON">🔧 JSON (完整备份)</button>
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

.footer { display: flex; gap: .35rem; padding-top: .5rem; }
.footer-btn {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: .3rem; padding: .45rem; border-radius: var(--radius);
  font-size: .75rem; color: var(--text-3); transition: all .15s;
}
.footer-btn:hover { background: var(--surface-2); color: var(--text-2); }

.export-wrap { position: relative; flex: 1; }
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
