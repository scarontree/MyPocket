<script setup>
import { ref, computed } from 'vue'
import { useLedgerStore } from '../stores/ledger'
import { ASSET_TYPES } from '../utils/categories'
import { fmtMoney } from '../utils/format'
import { ASSET_ICONS, IconPlus, IconX, IconTrash } from '../icons'

const store = useLedgerStore()
const editingId = ref(null)

const form = ref({})

function openEdit(id) {
  const existing = id ? store.assets.find(a => a.id === id) : null
  form.value = {
    name: existing?.name || '',
    balance: existing?.balance ?? '',
    type: existing?.type || 'cash',
    note: existing?.note || '',
  }
  editingId.value = id || -1
}

function save() {
  const data = { ...form.value, balance: parseFloat(form.value.balance) || 0 }
  if (!data.name) return
  if (editingId.value > 0) {
    store.updateAsset(editingId.value, data)
    window.__toast?.('已更新 ✓')
  } else {
    store.addAsset(data)
    window.__toast?.('已添加 ✓')
  }
  editingId.value = null
}

function remove() {
  if (editingId.value > 0) {
    store.deleteAsset(editingId.value)
    window.__toast?.('已删除')
  }
  editingId.value = null
}

const total = computed(() => store.assets.reduce((s, a) => s + a.balance, 0))
</script>

<template>
  <section class="assets-view" style="animation: fadeUp .35s var(--ease-out) both">
    <h3 class="sec-title">资产管理</h3>
    <p class="desc">记录各类资产，随时掌握财务全貌</p>

    <div class="asset-list">
      <div v-for="a in store.assets" :key="a.id" class="asset-row" @click="openEdit(a.id)">
        <div class="asset-icon" :class="a.type">
          <component :is="ASSET_ICONS[a.type] || ASSET_ICONS.other" :size="18" />
        </div>
        <div class="asset-info">
          <div class="asset-name">{{ a.name }}</div>
          <div v-if="a.note" class="asset-note">{{ a.note }}</div>
        </div>
        <div class="asset-bal" :class="a.balance >= 0 ? 'pos' : 'neg'">¥{{ fmtMoney(a.balance) }}</div>
      </div>
    </div>

    <button class="add-btn" @click="openEdit(null)">
      <IconPlus :size="16" /> 添加资产账户
    </button>

    <div class="total-bar">
      <span>资产合计</span>
      <span class="total-val">¥{{ fmtMoney(total) }}</span>
    </div>

    <!-- Edit Dialog -->
    <div v-if="editingId !== null" class="overlay" @click.self="editingId = null">
      <div class="dialog">
        <div class="dialog-header">
          <h2>{{ editingId > 0 ? '编辑资产' : '添加资产' }}</h2>
          <button class="close-btn" @click="editingId = null"><IconX :size="18" /></button>
        </div>
        <form class="dialog-body" @submit.prevent="save">
          <div class="form-group">
            <label>账户名称</label>
            <input v-model="form.name" placeholder="如：招商银行卡" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>余额</label>
              <div class="money-input">
                <span class="prefix">¥</span>
                <input v-model.number="form.balance" type="number" placeholder="0.00" step="0.01" required>
              </div>
            </div>
            <div class="form-group">
              <label>类型</label>
              <select v-model="form.type">
                <option v-for="t in ASSET_TYPES" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>备注 <span class="opt">可选</span></label>
            <input v-model="form.note" placeholder="补充说明">
          </div>
          <div class="dialog-actions">
            <button v-if="editingId > 0" type="button" class="del-btn" @click="remove">
              <IconTrash :size="15" /> 删除
            </button>
            <button type="submit" class="save-btn">保存</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sec-title { font-family: var(--font-display); font-weight: 700; font-size: .95rem; margin-bottom: .25rem; }
.desc { font-size: .82rem; color: var(--text-2); margin-bottom: 1.25rem; }

.asset-list { display: flex; flex-direction: column; gap: .4rem; margin-bottom: 1rem; }
.asset-row {
  display: flex; align-items: center; gap: .75rem;
  padding: .8rem 1rem; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius);
  cursor: pointer; transition: all .15s;
}
.asset-row:hover { border-color: var(--border-2); box-shadow: var(--shadow); }
.asset-icon {
  width: 2.1rem; height: 2.1rem; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.asset-icon.cash { background: var(--green-soft); color: var(--green); }
.asset-icon.savings { background: var(--yellow-soft); color: var(--yellow); }
.asset-icon.credit { background: var(--purple-soft); color: var(--purple); }
.asset-icon.other { background: var(--blue-soft); color: var(--blue); }
.asset-info { flex: 1; min-width: 0; }
.asset-name { font-weight: 500; font-size: .88rem; }
.asset-note { font-size: .72rem; color: var(--text-3); }
.asset-bal { font-family: var(--font-display); font-weight: 700; font-size: .95rem; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.asset-bal.pos { color: var(--green); }
.asset-bal.neg { color: var(--red); }

.add-btn {
  width: 100%; padding: .65rem; border: 2px dashed var(--border);
  border-radius: var(--radius); font-weight: 500; font-size: .82rem;
  color: var(--text-3); display: flex; align-items: center; justify-content: center;
  gap: .35rem; transition: all .15s;
}
.add-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

.total-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: .9rem 1rem; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius-lg);
  margin-top: 1.25rem; font-weight: 600; font-size: .88rem;
}
.total-val { font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; color: var(--green); font-variant-numeric: tabular-nums; }

/* Dialog */
.overlay {
  position: fixed; inset: 0;
  background: rgba(42,37,32,.35); backdrop-filter: blur(4px);
  z-index: 200; display: flex; align-items: center; justify-content: center;
  padding: 1rem; animation: fadeIn .2s ease;
}
.dialog {
  background: var(--surface); border-radius: var(--radius-lg);
  width: 100%; max-width: 400px; box-shadow: var(--shadow-lg);
  animation: slideUp .25s var(--ease-out);
}
.dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem .5rem; }
.dialog-header h2 { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; }
.close-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--text-3); transition: all .15s; }
.close-btn:hover { background: var(--surface-2); color: var(--text); }
.dialog-body { padding: .75rem 1.5rem 1.5rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: .8rem; font-weight: 600; color: var(--text-2); margin-bottom: .3rem; }
.opt { font-weight: 400; color: var(--text-3); }
.form-group input, .form-group select { width: 100%; padding: .55rem .75rem; border: 1px solid var(--border); border-radius: var(--radius); font-size: .88rem; background: var(--bg); outline: none; transition: border-color .15s; }
.form-group input:focus, .form-group select:focus { border-color: var(--accent); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.money-input { display: flex; align-items: center; gap: .2rem; padding: 0 .75rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); transition: border-color .15s; }
.money-input:focus-within { border-color: var(--accent); }
.prefix { color: var(--text-3); font-weight: 600; }
.money-input input { border: none !important; padding: .55rem .25rem !important; background: none !important; }
.dialog-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; gap: .75rem; }
.save-btn { flex: 1; padding: .6rem; background: var(--accent); color: #fff; border-radius: var(--radius); font-weight: 600; font-size: .88rem; transition: all .15s; }
.save-btn:hover { background: var(--accent-hover); }
.del-btn { display: flex; align-items: center; gap: .3rem; padding: .5rem .85rem; background: var(--red-soft); color: var(--red); border-radius: var(--radius); font-weight: 600; font-size: .82rem; transition: all .15s; }
.del-btn:hover { background: var(--red); color: #fff; }
</style>
