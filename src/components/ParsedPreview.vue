<script setup>
import { ref } from 'vue'
import { useLedgerStore } from '../stores/ledger'
import { fmtMoney, fmtDate } from '../utils/format'
import { CAT_ICONS, IconX } from '../icons'
import Toast from './Toast.vue'

const props = defineProps({ items: Array })
const emit = defineEmits(['done', 'cancel'])
const store = useLedgerStore()
const getCat = (id) => store.getCat(id)

const editingIdx = ref(-1)
const editData = ref({})

function startEdit(idx) {
  editingIdx.value = idx
  editData.value = { ...props.items[idx] }
}
function saveEdit(idx) {
  Object.assign(props.items[idx], editData.value)
  editingIdx.value = -1
}
function removeItem(idx) {
  props.items.splice(idx, 1)
  if (props.items.length === 0) emit('cancel')
}

function confirmAll() {
  store.addTransactions(props.items.map(item => ({
    name: item.name,
    amount: item.amount,
    category: item.category,
    date: item.date,
    note: item.note || '',
  })))
  window.__toast?.('已记录 ' + props.items.length + ' 笔 ✓')
  emit('done')
}
</script>

<template>
  <div class="preview">
    <div class="preview-header">
      <span class="preview-title">识别到 {{ items.length }} 笔支出</span>
      <button class="cancel-btn" @click="emit('cancel')"><IconX :size="16" /></button>
    </div>

    <div class="preview-list">
      <div v-for="(item, idx) in items" :key="idx" class="preview-item" @click="startEdit(idx)">
        <template v-if="editingIdx === idx">
          <div class="edit-row">
            <input v-model="editData.name" class="edit-name" placeholder="名称">
            <input v-model.number="editData.amount" type="number" class="edit-amount" placeholder="金额" step="0.01">
            <select v-model="editData.category" class="edit-cat">
              <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <input v-model="editData.date" type="date" class="edit-date">
            <button class="edit-save" @click.stop="saveEdit(idx)">✓</button>
          </div>
        </template>
        <template v-else>
          <div class="item-icon" :style="{ background: getCat(item.category).bg, color: getCat(item.category).color }">
            <component :is="CAT_ICONS[item.category] || CAT_ICONS.other" :size="16" />
          </div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-meta">{{ getCat(item.category).name }} · {{ fmtDate(item.date) }}</div>
          </div>
          <div class="item-amount">¥{{ fmtMoney(item.amount) }}</div>
          <button class="item-remove" @click.stop="removeItem(idx)"><IconX :size="14" /></button>
        </template>
      </div>
    </div>

    <div class="preview-footer">
      <span class="preview-total">合计 ¥{{ fmtMoney(items.reduce((s, i) => s + i.amount, 0)) }}</span>
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
.item-info { flex: 1; min-width: 0; }
.item-name { font-weight: 500; font-size: .88rem; }
.item-meta { font-size: .72rem; color: var(--text-3); }
.item-amount {
  font-family: var(--font-display); font-weight: 700;
  font-size: .92rem; color: var(--red); flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
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
