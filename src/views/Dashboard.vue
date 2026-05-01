<script setup>
import { computed } from 'vue'
import { useLedgerStore } from '../stores/ledger'
import { fmtMoney, fmtDate, todayStr } from '../utils/format'
import { CAT_ICONS } from '../icons'

const store = useLedgerStore()

const pct = computed(() => store.budget > 0 ? Math.min(store.totalExpense / store.budget, 1) : 0)
const ringOffset = computed(() => 326.73 * (1 - pct.value))
const ringColor = computed(() => pct.value > 0.9 ? 'var(--red)' : pct.value > 0.7 ? 'var(--yellow)' : 'var(--accent)')

const catStats = computed(() => {
  const map = {}
  store.expenseTx.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
  const max = Math.max(...Object.values(map), 1)
  return store.categories.map(c => ({ ...c, amount: map[c.id] || 0, pct: ((map[c.id] || 0) / max * 100) })).filter(c => c.amount > 0)
})

const recentTx = computed(() => store.monthTx.slice(0, 5))
const daysRemaining = computed(() => {
  const today = todayStr()
  const start = today < store.currentPeriod.start ? store.currentPeriod.start : today
  if (start > store.currentPeriod.end) return 0
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(store.currentPeriod.end + 'T00:00:00')
  return Math.floor((endDate - startDate) / 86400000) + 1
})
const dailyAllowance = computed(() =>
  store.budget > 0 && daysRemaining.value > 0 ? store.remaining / daysRemaining.value : null
)

function onBudgetChange(e) {
  store.setBudget(parseFloat(e.target.value) || 0)
}

function onPeriodStartChange(e) {
  if (!store.setPeriodRange(e.target.value, store.currentPeriod.end)) window.__toast?.('账期开始日期无效')
}

function onPeriodEndChange(e) {
  if (!store.setPeriodRange(store.currentPeriod.start, e.target.value)) window.__toast?.('账期结束日期无效')
}
</script>

<template>
  <section class="dashboard" style="animation: fadeUp .35s var(--ease-out) both">
    <div class="top-row">
      <div class="ring-wrap">
        <svg viewBox="0 0 120 120" class="ring-svg">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-2)" stroke-width="8" />
          <circle cx="60" cy="60" r="52" fill="none" :stroke="ringColor" stroke-width="8"
            stroke-linecap="round" :stroke-dasharray="326.73" :stroke-dashoffset="ringOffset"
            style="transition: stroke-dashoffset .8s cubic-bezier(.4,0,.2,1), stroke .3s" />
        </svg>
        <div class="ring-center">
          <span class="ring-label">已花</span>
          <span class="ring-value">¥{{ fmtMoney(store.totalExpense) }}</span>
          <span class="ring-sub">{{ store.budget > 0 ? '预算 ¥' + fmtMoney(store.budget) : '未设预算' }}</span>
        </div>
      </div>
      <div class="budget-config">
        <label class="config-label">本月预算</label>
        <div class="budget-wrap">
          <span class="prefix">¥</span>
          <input type="number" :value="store.budget || ''" @change="onBudgetChange" placeholder="0" min="0" step="100">
        </div>
        <div class="period-config">
          <label class="config-label">账期范围</label>
          <div class="period-inputs">
            <input type="date" :value="store.currentPeriod.start" @change="onPeriodStartChange">
            <span>至</span>
            <input type="date" :value="store.currentPeriod.end" @change="onPeriodEndChange">
          </div>
        </div>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat"><span class="stat-l">总支出</span><span class="stat-v expense">¥{{ fmtMoney(store.totalExpense) }}</span></div>
      <div class="stat"><span class="stat-l">总存入</span><span class="stat-v income">¥{{ fmtMoney(store.totalIncome) }}</span></div>
      <div class="stat"><span class="stat-l">剩余</span><span class="stat-v remain">{{ store.budget > 0 ? '¥' + fmtMoney(store.remaining) : '--' }}</span></div>
      <div class="stat">
        <span class="stat-l">日均可花 · 剩{{ daysRemaining }}天</span>
        <span class="stat-v daily">{{ dailyAllowance === null ? '--' : '¥' + fmtMoney(dailyAllowance) }}</span>
      </div>
      <div class="stat"><span class="stat-l">笔数</span><span class="stat-v count">{{ store.monthTx.length }}</span></div>
    </div>

    <h3 class="sec-title">分类统计</h3>
    <div class="cat-bars" v-if="catStats.length">
      <div v-for="c in catStats" :key="c.id" class="cat-row">
        <div class="cat-icon" :style="{ background: c.bg, color: c.color }">
          <component :is="CAT_ICONS[c.icon] || CAT_ICONS.other" :size="14" />
        </div>
        <div class="cat-info">
          <div class="cat-top"><span>{{ c.name }}</span><span class="cat-amt">¥{{ fmtMoney(c.amount) }}</span></div>
          <div class="cat-track"><div class="cat-fill" :style="{ width: c.pct + '%', background: c.color }" /></div>
        </div>
      </div>
    </div>
    <div v-else class="empty-hint">暂无数据</div>

    <h3 class="sec-title" v-if="recentTx.length">最近记录</h3>
    <div class="recent" v-if="recentTx.length">
      <div v-for="tx in recentTx" :key="tx.id" class="tx-row">
        <div class="tx-icon" :style="{ background: store.getCat(tx.category).bg, color: store.getCat(tx.category).color }">
          <component :is="CAT_ICONS[store.getCat(tx.category).icon] || CAT_ICONS.other" :size="14" />
        </div>
        <div class="tx-info">
          <div class="tx-name">{{ tx.name }}</div>
          <div class="tx-meta">{{ tx.type === 'income' ? '存入' : store.getCat(tx.category).name }}{{ tx.note ? ' · ' + tx.note : '' }}</div>
        </div>
        <div class="tx-amt" :class="{ income: tx.type === 'income' }">{{ tx.type === 'income' ? '+' : '-' }}¥{{ fmtMoney(tx.amount) }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.top-row { display: flex; align-items: center; gap: 2.5rem; margin-bottom: 1.75rem; }
.ring-wrap { position: relative; width: 130px; height: 130px; flex-shrink: 0; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-center {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.ring-label { font-size: .68rem; color: var(--text-3); font-weight: 500; text-transform: uppercase; letter-spacing: .05em; }
.ring-value { font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.ring-sub { font-size: .62rem; color: var(--text-3); }

.budget-config { flex: 1; }
.config-label { font-size: .8rem; color: var(--text-2); font-weight: 500; margin-bottom: .4rem; display: block; }
.budget-wrap {
  display: flex; align-items: center; gap: .2rem;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: .5rem .75rem; transition: border-color .15s;
}
.budget-wrap:focus-within { border-color: var(--accent); }
.prefix { color: var(--text-3); font-weight: 600; }
.budget-wrap input {
  border: none; outline: none; background: none;
  font-family: var(--font-display); font-weight: 700; font-size: 1.4rem;
  width: 100%; letter-spacing: -.02em;
}
.budget-wrap input::placeholder { color: var(--text-3); font-weight: 400; }

.period-config { margin-top: .8rem; }
.period-inputs {
  display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center; gap: .5rem;
}
.period-inputs span { color: var(--text-3); font-size: .78rem; }
.period-inputs input {
  width: 100%; min-width: 0; padding: .5rem .65rem;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); outline: none;
  color: var(--text-2); font-size: .82rem;
}
.period-inputs input:focus { border-color: var(--accent); }

.stat-row { display: grid; grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); gap: .75rem; margin-bottom: 2rem; }
.stat {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: .85rem 1rem;
  display: flex; flex-direction: column; gap: .15rem;
}
.stat-l { font-size: .72rem; color: var(--text-3); font-weight: 500; }
.stat-v { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; font-variant-numeric: tabular-nums; }
.stat-v.expense { color: var(--red); }
.stat-v.income { color: var(--green); }
.stat-v.remain { color: var(--green); }
.stat-v.daily { color: var(--accent); }
.stat-v.count { color: var(--blue); }

.sec-title { font-family: var(--font-display); font-weight: 700; font-size: .95rem; margin-bottom: .7rem; }

.cat-bars { display: flex; flex-direction: column; gap: .45rem; margin-bottom: 2rem; }
.cat-row { display: flex; align-items: center; gap: .65rem; }
.cat-icon {
  width: 1.75rem; height: 1.75rem; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cat-info { flex: 1; min-width: 0; }
.cat-top { display: flex; justify-content: space-between; font-size: .8rem; margin-bottom: .2rem; }
.cat-top span:first-child { font-weight: 500; }
.cat-amt { font-family: var(--font-display); font-weight: 600; color: var(--text-2); font-variant-numeric: tabular-nums; }
.cat-track { height: 5px; background: var(--surface-2); border-radius: 3px; overflow: hidden; }
.cat-fill { height: 100%; border-radius: 3px; transition: width .6s var(--ease-out); min-width: 2px; }

.empty-hint { font-size: .85rem; color: var(--text-3); padding: .5rem 0; margin-bottom: 2rem; }

.recent { display: flex; flex-direction: column; gap: .3rem; }
.tx-row {
  display: flex; align-items: center; gap: .65rem;
  padding: .6rem .75rem; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius);
  transition: border-color .15s;
}
.tx-row:hover { border-color: var(--border-2); }
.tx-icon {
  width: 1.85rem; height: 1.85rem; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tx-info { flex: 1; min-width: 0; }
.tx-name { font-weight: 500; font-size: .86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tx-meta { font-size: .7rem; color: var(--text-3); }
.tx-amt { font-family: var(--font-display); font-weight: 700; font-size: .9rem; color: var(--red); flex-shrink: 0; font-variant-numeric: tabular-nums; }
.tx-amt.income { color: var(--green); }

@media (max-width: 720px) {
  .top-row { flex-direction: column; gap: 1.25rem; align-items: stretch; }
  .ring-wrap { align-self: center; }
  .stat-row { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .period-inputs { grid-template-columns: 1fr; }
  .period-inputs span { display: none; }
}
</style>
