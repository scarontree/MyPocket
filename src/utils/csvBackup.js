import { BACKUP_VERSION } from './backup'
import { cleanHeader } from './backupRows'

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function rowsToCsv(rows) {
  return rows.map(row => row.map(csvCell).join(',')).join('\n')
}

function parseCsvLine(line) {
  const cells = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      cells.push(cell)
      cell = ''
    } else {
      cell += ch
    }
  }
  cells.push(cell)
  return cells.map(v => v.trim())
}

function parseSectionedCsv(text) {
  const sections = {}
  let current = ''
  let headers = []
  String(text).replace(/^\uFEFF/, '').split(/\r?\n/).forEach(line => {
    const raw = line.trim()
    if (!raw || raw.startsWith('#')) return
    const section = raw.match(/^\[([a-zA-Z0-9_-]+)\]$/)
    if (section) {
      current = section[1]
      headers = []
      sections[current] = []
      return
    }
    if (!current) return
    const cells = parseCsvLine(line)
    if (headers.length === 0) {
      headers = cells.map(cleanHeader)
      return
    }
    sections[current].push(Object.fromEntries(headers.map((key, idx) => [key, cells[idx] ?? ''])))
  })
  return sections
}

function normalizeTxType(value) {
  const s = String(value || '').trim()
  return ['income', '收入', '存入', '到账', '转入'].includes(s) ? 'income' : 'expense'
}

export function encodeBackupCsv(backup) {
  const ledger = backup.ledger || {}
  const settings = backup.settings || {}
  const sections = [
    '# MyPocket CSV Backup v2',
    '[meta]',
    rowsToCsv([
      ['key', 'value'],
      ['version', backup.version || BACKUP_VERSION],
      ['exportedAt', backup.exportedAt || new Date().toISOString()],
    ]),
    '[settings]',
    rowsToCsv([
      ['key', 'value'],
      ['apiEndpoint', settings.apiEndpoint],
      ['apiKey', settings.apiKey],
      ['model', settings.model],
      ['activePresetId', settings.activePresetId],
    ]),
    '[apiPresets]',
    rowsToCsv([
      ['id', 'name', 'apiEndpoint', 'apiKey', 'model'],
      ...(settings.apiPresets || []).map(p => [p.id, p.name, p.apiEndpoint, p.apiKey, p.model]),
    ]),
    '[budgets]',
    rowsToCsv([
      ['month', 'amount'],
      ...Object.entries(ledger.budgets || {}).map(([month, amount]) => [month, amount]),
    ]),
    '[periodRanges]',
    rowsToCsv([
      ['month', 'start', 'end'],
      ...Object.entries(ledger.periodRanges || {}).map(([month, range]) => [month, range.start, range.end]),
    ]),
    '[categories]',
    rowsToCsv([
      ['id', 'name', 'color', 'bg', 'icon'],
      ...(ledger.categories || []).map(c => [c.id, c.name, c.color, c.bg, c.icon]),
    ]),
    '[assets]',
    rowsToCsv([
      ['id', 'name', 'balance', 'type', 'note'],
      ...(ledger.assets || []).map(a => [a.id, a.name, a.balance, a.type, a.note || '']),
    ]),
    '[transactions]',
    rowsToCsv([
      ['id', 'month', 'createdAt', 'type', 'date', 'name', 'amount', 'category', 'note'],
      ...(ledger.transactions || []).map(tx => [tx.id, tx.month, tx.createdAt, tx.type || 'expense', tx.date, tx.name, tx.amount, tx.category, tx.note || '']),
    ]),
  ]
  return '\uFEFF' + sections.join('\n\n')
}

export function decodeBackupCsv(text) {
  const rawText = String(text)
  if (!rawText.includes('[transactions]') && !rawText.includes('[assets]')) return null
  const sections = parseSectionedCsv(rawText)
  const hasBackupSection = ['settings', 'apiPresets', 'budgets', 'periodRanges', 'categories', 'assets', 'transactions']
    .some(key => sections[key])
  if (!hasBackupSection) return null

  const settingsRows = sections.settings || []
  const settingsData = Object.fromEntries(settingsRows.map(row => [row.key, row.value]))
  const budgets = Object.fromEntries((sections.budgets || [])
    .filter(row => row.month)
    .map(row => [row.month, Number(row.amount || 0)]))
  const periodRanges = Object.fromEntries((sections.periodRanges || [])
    .filter(row => row.month)
    .map(row => [row.month, { start: row.start, end: row.end }]))

  return {
    version: Number((sections.meta || []).find(row => row.key === 'version')?.value || BACKUP_VERSION),
    ledger: {
      budgets,
      periodRanges,
      categories: (sections.categories || []).map(row => ({
        id: row.id,
        name: row.name,
        color: row.color,
        bg: row.bg,
        icon: row.icon,
      })),
      assets: (sections.assets || []).map((row, idx) => ({
        id: Number.isFinite(Number(row.id)) ? Number(row.id) : idx + 1,
        name: row.name,
        balance: Number(row.balance || 0),
        type: row.type || 'other',
        note: row.note || '',
      })),
      transactions: (sections.transactions || []).map((row, idx) => ({
        id: Number.isFinite(Number(row.id)) ? Number(row.id) : idx + 1,
        month: row.month || String(row.date || '').slice(0, 7),
        createdAt: Number.isFinite(Number(row.createdAt)) ? Number(row.createdAt) : Date.now(),
        type: normalizeTxType(row.type),
        date: row.date,
        name: row.name,
        amount: Number(row.amount || 0),
        category: row.category || 'other',
        note: row.note || '',
      })),
    },
    settings: sections.settings || sections.apiPresets ? {
      apiEndpoint: settingsData.apiEndpoint,
      apiKey: settingsData.apiKey,
      model: settingsData.model,
      activePresetId: settingsData.activePresetId,
      apiPresets: (sections.apiPresets || []).map(row => ({
        id: row.id,
        name: row.name,
        apiEndpoint: row.apiEndpoint,
        apiKey: row.apiKey,
        model: row.model,
      })),
    } : undefined,
  }
}
