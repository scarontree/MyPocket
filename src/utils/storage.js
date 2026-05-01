const DATA_KEY = 'mypocket_data'
const SETTINGS_KEY = 'mypocket_settings'
const DEFAULT_API_ENDPOINT = 'https://api.openai.com'
const DEFAULT_MODEL = 'gpt-4o-mini'

export function loadLedgerData() {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    const d = raw ? JSON.parse(raw) : {}
    return {
      budgets: d.budgets || {},
      transactions: d.transactions || [],
      assets: d.assets || [],
      categories: d.categories || [],
      periodRanges: d.periodRanges || {},
    }
  } catch {
    return { budgets: {}, transactions: [], assets: [], categories: [], periodRanges: {} }
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
      apiEndpoint: s.apiEndpoint || DEFAULT_API_ENDPOINT,
      apiKey: s.apiKey || '',
      model: s.model || DEFAULT_MODEL,
      apiPresets: Array.isArray(s.apiPresets) ? s.apiPresets : [],
      activePresetId: s.activePresetId || '',
    }
  } catch {
    return {
      apiEndpoint: DEFAULT_API_ENDPOINT,
      apiKey: '',
      model: DEFAULT_MODEL,
      apiPresets: [],
      activePresetId: '',
    }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
