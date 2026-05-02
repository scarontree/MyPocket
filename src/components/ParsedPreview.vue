<script setup>
import { ref } from 'vue'
import { useLedgerStore } from '../stores/ledger'
import { fmtMoney, fmtDate } from '../utils/format'
import { CAT_ICONS, IconX } from '../icons'
import { ASSET_TYPES } from '../utils/categories'

const props = defineProps({ items: Array })
const emit = defineEmits(['done', 'cancel'])
const store = useLedgerStore()
const getCat = (id) => store.getCat(id)
const kindLabel = item => item.kind === 'asset' ? '资产' : item.kind === 'income' ? '存入' : '支出'
const txAmountText = item => `${item.kind === 'income' ? '+' : '-'}¥${fmtMoney(item.amount)}`

const editingIdx = ref(-1)
const editData = ref({})

function startEdit(idx) {
  editingIdx.value = idx
  editData.value = { ...props.items[idx] }
}
function saveEdit(idx) {
  if (editData.value.kind === 'asset') {
    editData.value.balance = Number(editData.value.balance ?? editData.value.amount ?? 0)
    editData.value.assetType = editData.value.assetType || 'other'
  } else {
    editData.value.amount = Number(editData.value.amount ?? editData.value.balance ?? 0)
    editData.value.category = editData.value.kind === 'income' ? (editData.value.category || 'other') : editData.value.category
  }
  Object.assign(props.items[idx], editData.value)
  editingIdx.value = -1
}
function removeItem(idx) {
  props.items.splice(idx, 1)
  if (props.items.length === 0) emit('cancel')
}

function confirmAll() {
  const txItems = props.items.filter(item => item.kind !== 'asset' && item.name && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0)
  const assetItems = props.items.filter(item => item.kind === 'asset' && item.name && Number.isFinite(Number(item.balance)))

  if (txItems.length) store.addTransactions(txItems.map(item => ({
    type: item.kind === 'income' ? 'income' : 'expense',
    name: item.name,
    amount: Number(item.amount),
    category: item.kind === 'income' ? (item.category || 'other') : item.category,
    date: item.date,
    note: item.note || '',
  })))
  assetItems.forEach(item => {
    const existing = store.assets.find(asset => asset.name.trim() === item.name.trim())
    const data = {
      name: item.name,
      balance: Number(item.balance),
      type: item.assetType || existing?.type || 'other',
      note: item.note || existing?.note || '',
    }
    if (existing) store.updateAsset(existing.id, data)
    else store.addAsset(data)
  })

  const parts = []
  if (txItems.length) parts.push(`${txItems.length} 笔收支`)
  if (assetItems.length) parts.push(`${assetItems.length} 个资产余额`)
  window.__toast?.('已记录 ' + parts.join('、') + ' ✓')
  emit('done')
}
</script>

<template>
  <div class="preview">
    <div class="preview-header">
      <span class="preview-title">识别到 {{ items.length }} 条财务记录</span>
      <button class="cancel-btn" @click="emit('cancel')"><IconX :size="16" /></button>
    </div>

    <div class="preview-list">
      <div v-for="(item, idx) in items" :key="idx" class="preview-item" @click="startEdit(idx)">
        <template v-if="editingIdx === idx">
          <div class="edit-row">
            <select v-model="editData.kind" class="edit-kind">
              <option value="expense">支出</option>
              <option value="income">存入</option>
              <option value="asset">资产</option>
            </select>
            <input v-model="editData.name" class="edit-name" placeholder="名称">
            <input
              v-if="editData.kind === 'asset'"
              v-model.number="editData.balance"
              type="number"
              class="edit-amount"
              placeholder="余额"
              step="0.01"
            >
            <input
              v-else
              v-model.number="editData.amount"
              type="number"
              class="edit-amount"
              placeholder="金额"
              step="0.01"
            >
            <select v-if="editData.kind === 'expense'" v-model="editData.category" class="edit-cat">
              <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <select v-if="editData.kind === 'asset'" v-model="editData.assetType" class="edit-cat">
              <option v-for="t in ASSET_TYPES" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <input v-if="editData.kind !== 'asset'" v-model="editData.date" type="date" class="edit-date">
            <button class="edit-save" @click.stop="saveEdit(idx)">✓</button>
          </div>
        </template>
        <template v-else>
          <div v-if="item.kind === 'asset'" class="item-icon asset-icon">
            资
          </div>
          <div v-else class="item-icon" :style="{ background: getCat(item.category).bg, color: getCat(item.category).color }">
            <component :is="CAT_ICONS[getCat(item.category).icon] || CAT_ICONS.other" :size="16" />
          </div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div v-if="item.kind === 'asset'" class="item-meta">资产 · {{ ASSET_TYPES.find(t => t.id === item.assetType)?.name || '其他' }}</div>
            <div v-else class="item-meta">{{ kindLabel(item) }} · {{ item.kind === 'expense' ? getCat(item.category).name + ' · ' : '' }}{{ fmtDate(item.date) }}</div>
          </div>
          <div v-if="item.kind === 'asset'" class="item-amount asset">¥{{ fmtMoney(item.balance) }}</div>
          <div v-else class="item-amount" :class="{ income: item.kind === 'income' }">{{ txAmountText(item) }}</div>
          <button class="item-remove" @click.stop="removeItem(idx)"><IconX :size="14" /></button>
        </template>
      </div>
    </div>

    <div class="preview-footer">
      <span class="preview-total">支出 ¥{{ fmtMoney(items.filter(i => i.kind !== 'asset' && i.kind !== 'income').reduce((s, i) => s + i.amount, 0)) }} · 存入 ¥{{ fmtMoney(items.filter(i => i.kind === 'income').reduce((s, i) => s + i.amount, 0)) }}</span>
      <button class="confirm-btn" @click="confirmAll">全部记录 ✓</button>
    </div>
  </div>
</template>

<style scoped>
.preview {
  background: var(--surface); border: 2px solid var(--accent);
  border-radius: var(--radius-lg); overflow: hidden;
  animation: slideUp .3s var(--ease-out);
}
.preview-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; background: var(--accent-soft);
}
.preview-title { font-weight: 600; font-size: .88rem; color: var(--accent-hover); }
.cancel-btn { color: var(--text-3); padding: .2rem; border-radius: 50%; transition: all .15s; }
.cancel-btn:hover { background: var(--surface-2); color: var(--text); }

.preview-list { padding: .5rem; }
.preview-item {
  display: flex; align-items: center; gap: .65rem;
  padding: .55rem .65rem; border-radius: var(--radius);
  cursor: pointer; transition: background .1s;
}
.preview-item:hover { background: var(--surface-2); }

.item-icon {
  width: 2rem; height: 2rem; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.asset-icon { background: var(--blue-soft); color: var(--blue); font-size: .72rem; font-weight: 700; }
.item-info { flex: 1; min-width: 0; }
.item-name { font-weight: 500; font-size: .88rem; }
.item-meta { font-size: .72rem; color: var(--text-3); }
.item-amount {
  font-family: var(--font-display); font-weight: 700;
  font-size: .92rem; color: var(--red); flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.item-amount.income, .item-amount.asset { color: var(--green); }
.item-remove {
  opacity: 0; color: var(--text-3); padding: .2rem;
  border-radius: 50%; transition: all .15s;
}
.preview-item:hover .item-remove { opacity: 1; }
.item-remove:hover { color: var(--red); background: var(--red-soft); }

/* Inline edit */
.edit-row {
  display: flex; gap: .4rem; width: 100%; align-items: center; flex-wrap: wrap;
}
.edit-row input, .edit-row select {
  padding: .35rem .5rem; border: 1px solid var(--border);
  border-radius: 6px; font-size: .8rem; background: var(--bg); outline: none;
}
.edit-row input:focus, .edit-row select:focus { border-color: var(--accent); }
.edit-name { flex: 2; min-width: 80px; }
.edit-kind { width: 76px; }
.edit-amount { width: 70px; }
.edit-cat { width: 90px; }
.edit-date { width: 130px; }
.edit-save {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: .85rem; transition: all .15s;
}
.edit-save:hover { background: var(--accent-hover); }

.preview-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: .65rem 1rem; border-top: 1px solid var(--border);
}
.preview-total { font-weight: 600; font-size: .9rem; }
.confirm-btn {
  padding: .5rem 1.25rem; background: var(--accent); color: #fff;
  border-radius: var(--radius); font-weight: 600; font-size: .85rem;
  transition: all .15s;
}
.confirm-btn:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: var(--shadow-accent); }
</style>
