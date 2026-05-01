<script setup>
import { ref } from 'vue'
import { useLedgerStore } from '../stores/ledger'
import { todayStr } from '../utils/format'
import { IconX, IconTrash } from '../icons'

const props = defineProps({ txId: { type: Number, default: null } })
const emit = defineEmits(['close'])
const store = useLedgerStore()

const existing = props.txId ? store.transactions.find(t => t.id === props.txId) : null
const form = ref({
  name: existing?.name || '',
  amount: existing?.amount || '',
  date: existing?.date || todayStr(),
  category: existing?.category || 'food',
  note: existing?.note || '',
})

function save() {
  const data = { ...form.value, amount: parseFloat(form.value.amount) }
  if (!data.name || !data.amount) return
  if (existing) {
    store.updateTransaction(props.txId, data)
    window.__toast?.('已更新 ✓')
  } else {
    store.addTransaction(data)
    window.__toast?.('已记录 ✓')
  }
  emit('close')
}

function remove() {
  if (existing) {
    store.deleteTransaction(props.txId)
    window.__toast?.('已删除')
  }
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <h2>{{ existing ? '编辑记录' : '手动记一笔' }}</h2>
        <button class="close-btn" @click="emit('close')"><IconX :size="18" /></button>
      </div>
      <form class="dialog-body" @submit.prevent="save">
        <div class="form-group">
          <label>项目名称</label>
          <input v-model="form.name" placeholder="买了什么？" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>金额</label>
            <div class="money-input">
              <span class="prefix">¥</span>
              <input v-model.number="form.amount" type="number" placeholder="0.00" step="0.01" required>
            </div>
          </div>
          <div class="form-group">
            <label>日期</label>
            <input v-model="form.date" type="date" required>
          </div>
        </div>
        <div class="form-group">
          <label>分类</label>
          <div class="cat-picker">
            <button
              v-for="cat in store.categories" :key="cat.id"
              type="button" class="cat-chip"
              :class="{ selected: form.category === cat.id }"
              @click="form.category = cat.id"
            >{{ cat.name }}</button>
          </div>
        </div>
        <div class="form-group">
          <label>备注 <span class="optional">可选</span></label>
          <input v-model="form.note" placeholder="补充说明">
        </div>
        <div class="dialog-actions">
          <button v-if="existing" type="button" class="del-btn" @click="remove">
            <IconTrash :size="15" /> 删除
          </button>
          <button type="submit" class="save-btn">保存</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(42,37,32,.35); backdrop-filter: blur(4px);
  z-index: 200; display: flex; align-items: center; justify-content: center;
  padding: 1rem; animation: fadeIn .2s ease;
}
.dialog {
  background: var(--surface); border-radius: var(--radius-lg);
  width: 100%; max-width: 420px; box-shadow: var(--shadow-lg);
  animation: slideUp .25s var(--ease-out);
}
.dialog-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem .5rem;
}
.dialog-header h2 { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; }
.close-btn {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; color: var(--text-3); transition: all .15s;
}
.close-btn:hover { background: var(--surface-2); color: var(--text); }

.dialog-body { padding: .75rem 1.5rem 1.5rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: .8rem; font-weight: 600; color: var(--text-2); margin-bottom: .3rem; }
.optional { font-weight: 400; color: var(--text-3); }
.form-group input, .form-group select {
  width: 100%; padding: .55rem .75rem; border: 1px solid var(--border);
  border-radius: var(--radius); font-size: .88rem; background: var(--bg);
  outline: none; transition: border-color .15s;
}
.form-group input:focus { border-color: var(--accent); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }

.money-input {
  display: flex; align-items: center; gap: .2rem;
  padding: 0 .75rem; border: 1px solid var(--border);
  border-radius: var(--radius); background: var(--bg); transition: border-color .15s;
}
.money-input:focus-within { border-color: var(--accent); }
.prefix { color: var(--text-3); font-weight: 600; }
.money-input input { border: none !important; padding: .55rem .25rem !important; background: none !important; }

.cat-picker { display: flex; flex-wrap: wrap; gap: .35rem; }
.cat-chip {
  padding: .3rem .65rem; border-radius: var(--radius-full);
  font-size: .78rem; font-weight: 500;
  border: 1px solid var(--border); color: var(--text-2); transition: all .15s;
}
.cat-chip:hover { border-color: var(--text-3); }
.cat-chip.selected { background: var(--accent); color: #fff; border-color: var(--accent); }

.dialog-actions {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 1rem; gap: .75rem;
}
.save-btn {
  flex: 1; padding: .6rem; background: var(--accent); color: #fff;
  border-radius: var(--radius); font-weight: 600; font-size: .88rem; transition: all .15s;
}
.save-btn:hover { background: var(--accent-hover); }
.del-btn {
  display: flex; align-items: center; gap: .3rem;
  padding: .5rem .85rem; background: var(--red-soft); color: var(--red);
  border-radius: var(--radius); font-weight: 600; font-size: .82rem; transition: all .15s;
}
.del-btn:hover { background: var(--red); color: #fff; }

@media (max-width: 720px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
