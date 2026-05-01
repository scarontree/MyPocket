<script setup>
import { ref, computed } from 'vue'
import { useLedgerStore } from '../stores/ledger'
import { fmtMoney, fmtDate } from '../utils/format'
import { CAT_ICONS, IconEdit } from '../icons'
import TxDialog from '../components/TxDialog.vue'

const store = useLedgerStore()
const editingId = ref(null)

const grouped = computed(() => {
  const map = {}
  store.monthTx.forEach(t => { (map[t.date] = map[t.date] || []).push(t) })
  return Object.keys(map).sort().reverse().map(date => ({
    date,
    label: fmtDate(date),
    total: map[date].reduce((s, t) => s + t.amount, 0),
    items: map[date],
  }))
})
</script>

<template>
  <section class="transactions" style="animation: fadeUp .35s var(--ease-out) both">
    <div class="tx-header">
      <h3 class="sec-title">支出明细</h3>
      <button class="manual-btn" @click="editingId = -1">
        <IconEdit :size="15" /> 手动记一笔
      </button>
    </div>

    <template v-if="grouped.length">
      <div v-for="group in grouped" :key="group.date">
        <div class="day-header">
          <span>{{ group.label }}</span>
          <span class="day-total">小计 ¥{{ fmtMoney(group.total) }}</span>
        </div>
        <div class="day-list">
          <div v-for="tx in group.items" :key="tx.id" class="tx-row" @click="editingId = tx.id">
            <div class="tx-icon" :style="{ background: store.getCat(tx.category).bg, color: store.getCat(tx.category).color }">
              <component :is="CAT_ICONS[tx.category] || CAT_ICONS.other" :size="14" />
            </div>
            <div class="tx-info">
              <div class="tx-name">{{ tx.name }}</div>
              <div class="tx-meta">{{ store.getCat(tx.category).name }}{{ tx.note ? ' · ' + tx.note : '' }}</div>
            </div>
            <div class="tx-amt">-¥{{ fmtMoney(tx.amount) }}</div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--text-3)" stroke-width="1" stroke-linecap="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10h8m-6 4h4"/>
        </svg>
      </div>
      <p class="empty-text">这个月还没有记录</p>
      <p class="empty-sub">回到总览页用 AI 输入，或点击上方手动添加</p>
    </div>

    <TxDialog v-if="editingId !== null" :txId="editingId > 0 ? editingId : null" @close="editingId = null" />
  </section>
</template>

<style scoped>
.tx-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.sec-title { font-family: var(--font-display); font-weight: 700; font-size: .95rem; }
.manual-btn {
  display: flex; align-items: center; gap: .3rem;
  padding: .4rem .85rem; border-radius: var(--radius);
  font-size: .8rem; font-weight: 500; color: var(--text-2);
  border: 1px solid var(--border); transition: all .15s;
}
.manual-btn:hover { background: var(--surface-2); border-color: var(--border-2); }

.day-header {
  display: flex; justify-content: space-between;
  padding: .4rem 0; margin-top: .5rem;
  font-size: .76rem; color: var(--text-3); font-weight: 500;
}
.day-total { font-variant-numeric: tabular-nums; }
.day-list { display: flex; flex-direction: column; gap: .3rem; }

.tx-row {
  display: flex; align-items: center; gap: .65rem;
  padding: .6rem .75rem; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius);
  cursor: pointer; transition: all .15s;
}
.tx-row:hover { border-color: var(--border-2); box-shadow: var(--shadow); }
.tx-icon {
  width: 1.85rem; height: 1.85rem; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tx-info { flex: 1; min-width: 0; }
.tx-name { font-weight: 500; font-size: .86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tx-meta { font-size: .7rem; color: var(--text-3); }
.tx-amt { font-family: var(--font-display); font-weight: 700; font-size: .9rem; color: var(--red); flex-shrink: 0; font-variant-numeric: tabular-nums; }

.empty { text-align: center; padding: 3rem 1rem; }
.empty-icon { margin-bottom: .75rem; }
.empty-text { font-weight: 600; margin-bottom: .2rem; }
.empty-sub { font-size: .82rem; color: var(--text-3); }
</style>
