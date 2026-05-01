import {
  rowsToAssets,
  rowsToBackupTransactions,
  rowsToBudgets,
  rowsToCategories,
  rowsToPeriodRanges,
  rowsToSettings,
  rowsToTransactions,
} from './backupRows'

const BACKUP_SHEETS = ['交易', '设置', 'API预设']

function categoryName(categories, id) {
  return categories.find(c => c.id === id)?.name || id || ''
}

export function encodeBackupWorkbook(XLSX, backup) {
  const wb = XLSX.utils.book_new()
  const ledger = backup.ledger || {}
  const settings = backup.settings || {}
  const categories = ledger.categories || []

  const txData = [
    ['ID', '月份', '创建时间', '类型', '日期', '名称', '金额', '分类', '分类ID', '备注'],
    ...(ledger.transactions || []).map(tx => [
      tx.id, tx.month, tx.createdAt, tx.type || 'expense', tx.date, tx.name, tx.amount,
      categoryName(categories, tx.category), tx.category, tx.note || '',
    ]),
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(txData)
  ws1['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws1, '交易')

  const ws2 = XLSX.utils.aoa_to_sheet([
    ['ID', '账户', '余额', '类型', '备注'],
    ...(ledger.assets || []).map(a => [a.id, a.name, a.balance, a.type, a.note || '']),
  ])
  ws2['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws2, '资产')

  const ws3 = XLSX.utils.aoa_to_sheet([
    ['月份', '预算'],
    ...Object.entries(ledger.budgets || {}).map(([month, amount]) => [month, amount]),
  ])
  ws3['!cols'] = [{ wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws3, '预算')

  const ws4 = XLSX.utils.aoa_to_sheet([
    ['月份', '开始', '结束'],
    ...Object.entries(ledger.periodRanges || {}).map(([month, range]) => [month, range.start, range.end]),
  ])
  ws4['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws4, '账期')

  const ws5 = XLSX.utils.aoa_to_sheet([
    ['ID', '名称', '颜色', '背景', '图标'],
    ...(ledger.categories || []).map(c => [c.id, c.name, c.color, c.bg, c.icon]),
  ])
  ws5['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws5, '分类')

  const ws6 = XLSX.utils.aoa_to_sheet([
    ['键', '值'],
    ['apiEndpoint', settings.apiEndpoint],
    ['apiKey', settings.apiKey],
    ['model', settings.model],
    ['activePresetId', settings.activePresetId],
  ])
  ws6['!cols'] = [{ wch: 18 }, { wch: 42 }]
  XLSX.utils.book_append_sheet(wb, ws6, '设置')

  const ws7 = XLSX.utils.aoa_to_sheet([
    ['ID', '名称', 'API地址', 'API Key', '模型'],
    ...(settings.apiPresets || []).map(p => [p.id, p.name, p.apiEndpoint, p.apiKey, p.model]),
  ])
  ws7['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 32 }, { wch: 42 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws7, 'API预设')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}

export function decodeBackupWorkbook(XLSX, wb) {
  if (!BACKUP_SHEETS.some(name => wb.Sheets[name])) return null

  const sheetRows = name => wb.Sheets[name] ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' }) : []
  const backup = {
    version: 2,
  }
  const ledger = {}

  if (wb.Sheets['交易']) ledger.transactions = rowsToBackupTransactions(sheetRows('交易'))
  if (wb.Sheets['资产']) ledger.assets = rowsToAssets(sheetRows('资产'))
  if (wb.Sheets['预算']) ledger.budgets = rowsToBudgets(sheetRows('预算'))
  if (wb.Sheets['账期']) ledger.periodRanges = rowsToPeriodRanges(sheetRows('账期'))
  if (wb.Sheets['分类']) ledger.categories = rowsToCategories(sheetRows('分类'))
  if (Object.keys(ledger).length > 0) backup.ledger = ledger
  if (wb.Sheets['设置'] || wb.Sheets['API预设']) backup.settings = rowsToSettings(sheetRows('设置'), sheetRows('API预设'))

  return backup
}

export function decodeLegacyWorkbook(XLSX, wb, categories) {
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('导入文件没有工作表')

  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  const sheetMonth = wb.SheetNames[0]?.match(/^(\d{4})年(\d{1,2})月$/)
  const fallbackMonth = sheetMonth ? `${sheetMonth[1]}-${String(sheetMonth[2]).padStart(2, '0')}` : ''
  const transactions = rowsToTransactions(rows, { categories, fallbackMonth })

  const assetSheet = wb.Sheets['资产']
  const assetRows = assetSheet ? XLSX.utils.sheet_to_json(assetSheet, { defval: '' }) : []
  const assets = assetRows.length ? rowsToAssets(assetRows) : []
  return { transactions, assets }
}
