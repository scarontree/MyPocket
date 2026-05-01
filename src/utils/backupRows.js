import { ASSET_TYPES } from './categories'

function normalizeDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  }
  const s = String(value || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split('/')
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  throw new Error('导入文件包含无效日期')
}

function normalizeMonthValue(value, fallbackMonth) {
  const s = String(value || '').trim()
  if (/^\d{4}-\d{2}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0, 7)
  if (/^\d{4}\/\d{1,2}(?:\/\d{1,2})?$/.test(s)) {
    const [y, m] = s.split('/')
    return `${y}-${String(m).padStart(2, '0')}`
  }
  if (value instanceof Date || (typeof value === 'number' && Number.isFinite(value))) {
    return normalizeDateValue(value).slice(0, 7)
  }
  return fallbackMonth
}

function parseAmount(value) {
  const n = Number(String(value ?? '').replace(/[¥,\s]/g, ''))
  if (!Number.isFinite(n) || n <= 0) throw new Error('导入文件包含无效金额')
  return n
}

function parseBalance(value) {
  const n = Number(String(value ?? '').replace(/[¥,\s]/g, ''))
  if (!Number.isFinite(n)) throw new Error('资产表包含无效余额')
  return n
}

function normalizeTxType(value) {
  const s = String(value || '').trim()
  return ['income', '收入', '存入', '到账', '转入'].includes(s) ? 'income' : 'expense'
}

export function cleanHeader(key) {
  return String(key).replace(/^\uFEFF/, '').replace(/^"+|"+$/g, '').trim()
}

export function normalizeRow(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [cleanHeader(key), value]))
}

function resolveCategory(row, categories = []) {
  const id = String(row['分类ID'] || row.categoryId || row.category || '').trim()
  if (id && categories.some(c => c.id === id)) return id

  const name = String(row['分类'] || row.categoryName || '').trim()
  const byName = categories.find(c => c.name === name)
  if (byName) return byName.id

  return categories.find(c => c.id === 'other')?.id || categories[categories.length - 1]?.id || 'other'
}

export function rowsToTransactions(rows, { categories = [], fallbackMonth = '' } = {}) {
  const txs = rows
    .map(rawRow => {
      const row = normalizeRow(rawRow)
      const name = String(row['名称'] || row.name || '').trim()
      if (!name || name === '暂无记录') return null
      const date = normalizeDateValue(row['日期'] || row.date)
      const month = normalizeMonthValue(row['月份'] || row.month, fallbackMonth || date.slice(0, 7))
      return {
        type: normalizeTxType(row['类型'] || row.type),
        date,
        month,
        name,
        amount: parseAmount(row['金额'] || row.amount),
        category: resolveCategory(row, categories),
        note: String(row['备注'] || row.note || ''),
      }
    })
    .filter(Boolean)

  if (txs.length === 0) throw new Error('导入文件没有可用交易记录')
  return txs
}

export function rowsToBackupTransactions(rows, { categories = [], fallbackMonth = '' } = {}) {
  return rows
    .map((rawRow, idx) => {
      const row = normalizeRow(rawRow)
      const name = String(row['名称'] || row.name || '').trim()
      if (!name || name === '暂无记录') return null
      const date = normalizeDateValue(row['日期'] || row.date)
      const month = normalizeMonthValue(row['月份'] || row.month, fallbackMonth || date.slice(0, 7))
      return {
        id: Number.isFinite(Number(row.ID ?? row.id)) ? Number(row.ID ?? row.id) : idx + 1,
        month,
        createdAt: Number.isFinite(Number(row['创建时间'] ?? row.createdAt)) ? Number(row['创建时间'] ?? row.createdAt) : Date.now(),
        type: normalizeTxType(row['类型'] || row.type),
        date,
        name,
        amount: parseAmount(row['金额'] ?? row.amount),
        category: String(row['分类ID'] || row.category || resolveCategory(row, categories)),
        note: String(row['备注'] || row.note || ''),
      }
    })
    .filter(Boolean)
}

export function rowsToBudgets(rows) {
  return Object.fromEntries(rows
    .map(rawRow => normalizeRow(rawRow))
    .filter(row => row['月份'] || row.month)
    .map(row => [String(row['月份'] || row.month), Number(row['预算'] ?? row.amount ?? 0)]))
}

export function rowsToPeriodRanges(rows) {
  return Object.fromEntries(rows
    .map(rawRow => normalizeRow(rawRow))
    .filter(row => row['月份'] || row.month)
    .map(row => [String(row['月份'] || row.month), { start: String(row['开始'] || row.start), end: String(row['结束'] || row.end) }]))
}

export function rowsToCategories(rows) {
  return rows
    .map(rawRow => normalizeRow(rawRow))
    .filter(row => row.ID || row.id)
    .map(row => ({
      id: String(row.ID || row.id),
      name: String(row['名称'] || row.name || ''),
      color: String(row['颜色'] || row.color || '#7a8a9e'),
      bg: String(row['背景'] || row.bg || '#f0f2f5'),
      icon: String(row['图标'] || row.icon || 'other'),
    }))
}

function resolveAssetType(value) {
  const s = String(value || '').trim()
  return ASSET_TYPES.find(t => t.id === s || t.name === s)?.id || 'other'
}

export function rowsToAssets(rows) {
  return rows
    .map((rawRow, idx) => {
      const row = normalizeRow(rawRow)
      const name = String(row['账户'] || row.name || '').trim()
      if (!name) return null
      return {
        id: Number.isFinite(Number(row.ID ?? row.id)) ? Number(row.ID ?? row.id) : idx + 1,
        name,
        balance: parseBalance(row['余额'] ?? row.balance),
        type: resolveAssetType(row['类型'] || row.type),
        note: String(row['备注'] || row.note || ''),
      }
    })
    .filter(Boolean)
}

export function rowsToSettings(rows, presetRows) {
  const settingRows = rows.map(rawRow => normalizeRow(rawRow))
  const map = Object.fromEntries(settingRows.map(row => [row.key || row['键'], row.value || row['值'] || '']))
  return {
    apiEndpoint: map.apiEndpoint,
    apiKey: map.apiKey,
    model: map.model,
    activePresetId: map.activePresetId,
    apiPresets: presetRows
      .map(rawRow => normalizeRow(rawRow))
      .filter(row => row.ID || row.id || row['名称'] || row.name)
      .map(row => ({
        id: String(row.ID || row.id || ''),
        name: String(row['名称'] || row.name || ''),
        apiEndpoint: String(row['API地址'] || row.apiEndpoint || ''),
        apiKey: String(row['API Key'] || row.apiKey || ''),
        model: String(row['模型'] || row.model || ''),
      })),
  }
}
