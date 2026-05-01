const DATA_KEY = 'mypocket_data'
const SETTINGS_KEY = 'mypocket_settings'

export function loadLedgerData() {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    const d = raw ? JSON.parse(raw) : {}
    return {
      budgets: d.budgets || {},
      transactions: d.transactions || [],
      assets: d.assets || [],
      categories: d.categories || [],
    }
  } catch {
    return { budgets: {}, transactions: [], assets: [] }
  }
}

export function saveLedgerData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const s = raw ? JSON.parse(raw) : {}
    return {
      apiEndpoint: s.apiEndpoint || 'https://api.openai.com',
      apiKey: s.apiKey || '',
      model: s.model || 'gpt-4o-mini',
    }
  } catch {
    return { apiEndpoint: 'https://api.openai.com', apiKey: '', model: 'gpt-4o-mini' }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
