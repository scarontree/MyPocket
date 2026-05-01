import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadLedgerData, saveLedgerData } from '../utils/storage'
import { monthKey } from '../utils/format'
import { DEFAULT_CATEGORIES } from '../utils/categories'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-\d{2}$/

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

function normalizeTxType(value) {
  const s = String(value || '').trim()
  if (s === 'income' || ['收入', '存入', '到账', '转入'].includes(s)) return 'income'
  return 'expense'
}

function monthFromExcelSerial(value) {
  const d = new Date(Math.round((value - 25569) * 86400 * 1000))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function normalizeMonth(value, fallbackDate) {
  if (MONTH_RE.test(String(value || ''))) return String(value)
  if (typeof value === 'number' && Number.isFinite(value)) return monthFromExcelSerial(value)
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
  }
  return fallbackDate.slice(0, 7)
}

function normalizeBudgets(value) {
  if (value === undefined) return {}
  if (!isObject(value)) throw new Error('budgets 必须是对象')
  return Object.fromEntries(Object.entries(value).map(([key, amount]) => {
    if (!MONTH_RE.test(key)) throw new Error('budgets 包含无效月份')
    const n = Number(amount)
    if (!Number.isFinite(n) || n < 0) throw new Error('budgets 包含无效金额')
    return [key, n]
  }))
}

function normalizeTransactions(value) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error('transactions 必须是数组')
  return value.map((tx, idx) => {
    if (!isObject(tx)) throw new Error('transactions 包含无效记录')
    const amount = Number(tx.amount)
    const date = String(tx.date || '')
    const month = normalizeMonth(tx.month, date)
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('transactions 包含无效金额')
    if (!DATE_RE.test(date)) throw new Error('transactions 包含无效日期')
    if (!MONTH_RE.test(month)) throw new Error('transactions 包含无效账期')
    return {
      id: Number.isFinite(Number(tx.id)) ? Number(tx.id) : idx + 1,
      month,
      createdAt: Number.isFinite(Number(tx.createdAt)) ? Number(tx.createdAt) : Date.now(),
      type: normalizeTxType(tx.type),
      name: String(tx.name || '未命名'),
      amount,
      date,
      category: String(tx.category || 'other'),
      note: String(tx.note || ''),
    }
  })
}

function normalizeAssets(value) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error('assets 必须是数组')
  return value.map((asset, idx) => {
    if (!isObject(asset)) throw new Error('assets 包含无效账户')
    const balance = Number(asset.balance)
    if (!Number.isFinite(balance)) throw new Error('assets 包含无效余额')
    return {
      id: Number.isFinite(Number(asset.id)) ? Number(asset.id) : idx + 1,
      name: String(asset.name || '未命名账户'),
      balance,
      type: String(asset.type || 'other'),
      note: String(asset.note || ''),
    }
  })
}

function normalizeCategories(value) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error('categories 必须是数组')
  return value.map(cat => {
    if (!isObject(cat) || !cat.id || !cat.name) throw new Error('categories 包含无效分类')
    return {
      id: String(cat.id),
      name: String(cat.name),
      color: String(cat.color || '#7a8a9e'),
      bg: String(cat.bg || '#f0f2f5'),
      icon: String(cat.icon || cat.id || 'other'),
    }
  })
}

function defaultPeriodRange(year, month) {
  const start = monthKey(year, month) + '-01'
  const endDate = new Date(year, month, 0).getDate()
  const end = `${monthKey(year, month)}-${String(endDate).padStart(2, '0')}`
  return { start, end }
}

function normalizePeriodRanges(value) {
  if (value === undefined) return {}
  if (!isObject(value)) throw new Error('periodRanges 必须是对象')
  return Object.fromEntries(Object.entries(value).map(([key, range]) => {
    if (!MONTH_RE.test(key) || !isObject(range)) throw new Error('periodRanges 包含无效账期')
    const start = String(range.start || '')
    const end = String(range.end || '')
    if (!DATE_RE.test(start) || !DATE_RE.test(end) || start > end) throw new Error('periodRanges 包含无效日期范围')
    return [key, { start, end }]
  }))
}

export const useLedgerStore = defineStore('ledger', () => {
  const raw = loadLedgerData()
  const budgets = ref(normalizeBudgets(raw.budgets))
  const transactions = ref(normalizeTransactions(raw.transactions))
  const assets = ref(normalizeAssets(raw.assets))
  const rawCategories = normalizeCategories(raw.categories)
  const categories = ref(rawCategories.length > 0 ? rawCategories : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)))
  const periodRanges = ref(normalizePeriodRanges(raw.periodRanges))

  const now = new Date()
  const currentYear = ref(now.getFullYear())
  const currentMonth = ref(now.getMonth() + 1)

  const currentMonthKey = computed(() => monthKey(currentYear.value, currentMonth.value))
  const currentPeriod = computed(() =>
    periodRanges.value[currentMonthKey.value] || defaultPeriodRange(currentYear.value, currentMonth.value)
  )

  const monthTx = computed(() =>
    transactions.value
      .filter(t => t.date >= currentPeriod.value.start && t.date <= currentPeriod.value.end)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  )

  const budget = computed(() => budgets.value[currentMonthKey.value] || 0)
  const expenseTx = computed(() => monthTx.value.filter(t => t.type !== 'income'))
  const incomeTx = computed(() => monthTx.value.filter(t => t.type === 'income'))
  const totalExpense = computed(() => expenseTx.value.reduce((s, t) => s + t.amount, 0))
  const totalIncome = computed(() => incomeTx.value.reduce((s, t) => s + t.amount, 0))
  const netIncome = computed(() => totalIncome.value - totalExpense.value)
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
      periodRanges: periodRanges.value,
    })
  }

  function setBudget(v) { budgets.value[currentMonthKey.value] = v; persist() }

  function setPeriodRange(start, end) {
    if (!DATE_RE.test(start) || !DATE_RE.test(end) || start > end) return false
    const def = defaultPeriodRange(currentYear.value, currentMonth.value)
    if (start === def.start && end === def.end) delete periodRanges.value[currentMonthKey.value]
    else periodRanges.value[currentMonthKey.value] = { start, end }
    persist()
    return true
  }

  function addTransaction(tx) {
    const maxId = transactions.value.reduce((m, t) => Math.max(m, t.id), 0)
    transactions.value.push({ id: maxId + 1, month: currentMonthKey.value, createdAt: Date.now(), type: 'expense', ...tx })
    persist()
  }

  function addTransactions(txList) {
    let maxId = transactions.value.reduce((m, t) => Math.max(m, t.id), 0)
    txList.forEach(tx => {
      maxId++
      transactions.value.push({ id: maxId, month: currentMonthKey.value, createdAt: Date.now(), type: 'expense', ...tx })
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
    assets.value.push({
      id: maxId + 1,
      name: String(asset.name || '未命名账户'),
      balance: Number(asset.balance) || 0,
      type: String(asset.type || 'other'),
      note: String(asset.note || ''),
    })
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
    if (!isObject(imported)) throw new Error('导入内容必须是对象')
    const hasKnownField = ['budgets', 'transactions', 'assets', 'categories', 'periodRanges'].some(key => imported[key] !== undefined)
    if (!hasKnownField) throw new Error('导入文件不包含账本数据')
    const nextBudgets = normalizeBudgets(imported.budgets)
    const nextTransactions = normalizeTransactions(imported.transactions)
    const nextAssets = normalizeAssets(imported.assets)
    const nextCategories = normalizeCategories(imported.categories)
    const nextPeriodRanges = normalizePeriodRanges(imported.periodRanges)

    if (imported.budgets !== undefined) budgets.value = nextBudgets
    if (imported.transactions !== undefined) transactions.value = nextTransactions
    if (imported.assets !== undefined) assets.value = nextAssets
    if (imported.categories !== undefined) {
      categories.value = nextCategories.length > 0 ? nextCategories : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES))
    }
    if (imported.periodRanges !== undefined) periodRanges.value = nextPeriodRanges
    persist()
  }

  function exportData() {
    return JSON.stringify({
      budgets: budgets.value, transactions: transactions.value,
      assets: assets.value, categories: categories.value,
      periodRanges: periodRanges.value,
    }, null, 2)
  }

  return {
    currentYear, currentMonth, currentMonthKey,
    budgets, transactions, assets, categories, periodRanges,
    currentPeriod, monthTx, expenseTx, incomeTx, budget, totalExpense, totalIncome, netIncome, remaining,
    getCat,
    setBudget, setPeriodRange, addTransaction, addTransactions, updateTransaction, deleteTransaction,
    addAsset, updateAsset, deleteAsset,
    addCategory, updateCategory, deleteCategory, reorderCategories,
    changeMonth, importData, exportData,
  }
})
