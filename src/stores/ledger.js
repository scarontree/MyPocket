import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadLedgerData, saveLedgerData } from '../utils/storage'
import { monthKey } from '../utils/format'
import { DEFAULT_CATEGORIES } from '../utils/categories'

export const useLedgerStore = defineStore('ledger', () => {
  const raw = loadLedgerData()
  const budgets = ref(raw.budgets)
  const transactions = ref(raw.transactions)
  const assets = ref(raw.assets)
  const categories = ref(raw.categories && raw.categories.length > 0 ? raw.categories : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)))

  const now = new Date()
  const currentYear = ref(now.getFullYear())
  const currentMonth = ref(now.getMonth() + 1)

  const currentMonthKey = computed(() => monthKey(currentYear.value, currentMonth.value))

  const monthTx = computed(() =>
    transactions.value
      .filter(t => t.month === currentMonthKey.value)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  )

  const budget = computed(() => budgets.value[currentMonthKey.value] || 0)
  const totalExpense = computed(() => monthTx.value.reduce((s, t) => s + t.amount, 0))
  const remaining = computed(() => budget.value - totalExpense.value)

  // Get category by id (with fallback)
  function getCat(id) {
    return categories.value.find(c => c.id === id) || categories.value[categories.value.length - 1] || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1]
  }

  function persist() {
    saveLedgerData({
      budgets: budgets.value,
      transactions: transactions.value,
      assets: assets.value,
      categories: categories.value,
    })
  }

  function setBudget(v) { budgets.value[currentMonthKey.value] = v; persist() }

  function addTransaction(tx) {
    const maxId = transactions.value.reduce((m, t) => Math.max(m, t.id), 0)
    transactions.value.push({ id: maxId + 1, month: currentMonthKey.value, createdAt: Date.now(), ...tx })
    persist()
  }

  function addTransactions(txList) {
    let maxId = transactions.value.reduce((m, t) => Math.max(m, t.id), 0)
    txList.forEach(tx => {
      maxId++
      transactions.value.push({ id: maxId, month: currentMonthKey.value, createdAt: Date.now(), ...tx })
    })
    persist()
  }

  function updateTransaction(id, updates) {
    const tx = transactions.value.find(t => t.id === id)
    if (tx) { Object.assign(tx, updates); persist() }
  }

  function deleteTransaction(id) {
    transactions.value = transactions.value.filter(t => t.id !== id)
    persist()
  }

  function addAsset(asset) {
    const maxId = assets.value.reduce((m, a) => Math.max(m, a.id), 0)
    assets.value.push({ id: maxId + 1, ...asset })
    persist()
  }

  function updateAsset(id, updates) {
    const a = assets.value.find(x => x.id === id)
    if (a) { Object.assign(a, updates); persist() }
  }

  function deleteAsset(id) {
    assets.value = assets.value.filter(a => a.id !== id)
    persist()
  }

  // ── Category CRUD ──
  function addCategory(cat) {
    // Generate unique id from name
    const id = cat.id || cat.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '_').slice(0, 20) + '_' + Date.now().toString(36)
    categories.value.push({ ...cat, id })
    persist()
    return id
  }

  function updateCategory(id, updates) {
    const cat = categories.value.find(c => c.id === id)
    if (cat) { Object.assign(cat, updates); persist() }
  }

  function deleteCategory(id) {
    // Don't allow deleting the last category
    if (categories.value.length <= 1) return
    categories.value = categories.value.filter(c => c.id !== id)
    // Reassign orphaned transactions to the last remaining category
    const fallbackId = categories.value[categories.value.length - 1].id
    transactions.value.forEach(t => {
      if (t.category === id) t.category = fallbackId
    })
    persist()
  }

  function reorderCategories(newOrder) {
    categories.value = newOrder
    persist()
  }

  function changeMonth(delta) {
    currentMonth.value += delta
    if (currentMonth.value < 1) { currentMonth.value = 12; currentYear.value-- }
    if (currentMonth.value > 12) { currentMonth.value = 1; currentYear.value++ }
  }

  function importData(imported) {
    if (imported.budgets) budgets.value = imported.budgets
    if (imported.transactions) transactions.value = imported.transactions
    if (imported.assets) assets.value = imported.assets
    if (imported.categories) categories.value = imported.categories
    persist()
  }

  function exportData() {
    return JSON.stringify({
      budgets: budgets.value, transactions: transactions.value,
      assets: assets.value, categories: categories.value,
    }, null, 2)
  }

  // Seed demo data if empty
  if (transactions.value.length === 0 && assets.value.length === 0) {
    const mk = monthKey(2026, 5)
    budgets.value[mk] = 2100
    const seeds = [
      { name: '绝味鸭脖', amount: 21.42, date: '2026-04-30', category: 'food', note: '' },
      { name: '寿司', amount: 14, date: '2026-04-30', category: 'food', note: '' },
      { name: '麻辣烫', amount: 18.8, date: '2026-04-30', category: 'food', note: '' },
      { name: '酱香饼', amount: 5.5, date: '2026-05-01', category: 'food', note: '' },
      { name: '自选菜', amount: 9.5, date: '2026-05-01', category: 'food', note: '' },
      { name: '玉米肠', amount: 17.6, date: '2026-04-30', category: 'food', note: '' },
      { name: '蜜雪冰城', amount: 7.92, date: '2026-04-30', category: 'food', note: '' },
      { name: '凤梨百香果麻糍', amount: 9, date: '2026-04-30', category: 'food', note: '' },
      { name: 'Switch Lite', amount: 972.06, date: '2026-04-30', category: 'shop', note: '游戏机' },
      { name: '读卡器', amount: 19.78, date: '2026-04-30', category: 'shop', note: '未收货未扣款' },
      { name: '模型机', amount: 8.88, date: '2026-04-30', category: 'shop', note: '上月购买本月到账' },
      { name: '还花呗', amount: 347.72, date: '2026-04-30', category: 'pay', note: '' },
      { name: 'Claude Pro 订阅', amount: 136.8, date: '2026-04-29', category: 'pay', note: '20 USD' },
    ]
    let id = 1
    seeds.forEach(s => { transactions.value.push({ id: id++, month: mk, createdAt: Date.now(), ...s }) })
    assets.value = [
      { id: 1, name: '招商银行卡', balance: 332.31, type: 'cash', note: '可用现金' },
      { id: 2, name: '朝朝宝', balance: 200, type: 'savings', note: '储蓄不动' },
      { id: 3, name: '花呗额度', balance: 350, type: 'credit', note: '可用额度' },
    ]
    persist()
  }

  return {
    currentYear, currentMonth, currentMonthKey,
    budgets, transactions, assets, categories,
    monthTx, budget, totalExpense, remaining,
    getCat,
    setBudget, addTransaction, addTransactions, updateTransaction, deleteTransaction,
    addAsset, updateAsset, deleteAsset,
    addCategory, updateCategory, deleteCategory, reorderCategories,
    changeMonth, importData, exportData,
  }
})
