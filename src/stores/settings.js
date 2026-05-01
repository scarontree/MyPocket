import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadSettings, saveSettings } from '../utils/storage'

const DEFAULT_API_ENDPOINT = 'https://api.openai.com'
const DEFAULT_MODEL = 'gpt-4o-mini'

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

function normalizePresets(value) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error('apiPresets 必须是数组')
  return value.map((preset, idx) => {
    if (!isObject(preset)) throw new Error('apiPresets 包含无效预设')
    const name = String(preset.name || '').trim() || `预设 ${idx + 1}`
    return {
      id: String(preset.id || `preset_${idx + 1}`),
      name,
      apiEndpoint: String(preset.apiEndpoint || DEFAULT_API_ENDPOINT),
      apiKey: String(preset.apiKey || ''),
      model: String(preset.model || ''),
    }
  })
}

export const useSettingsStore = defineStore('settings', () => {
  const raw = loadSettings()
  const apiEndpoint = ref(raw.apiEndpoint)
  const apiKey = ref(raw.apiKey)
  const model = ref(raw.model)
  const apiPresets = ref(raw.apiPresets)
  const activePresetId = ref(raw.activePresetId)

  const isConfigured = () => !!apiEndpoint.value.trim() && !!apiKey.value.trim() && !!model.value.trim()

  function persist() {
    saveSettings({
      apiEndpoint: apiEndpoint.value,
      apiKey: apiKey.value,
      model: model.value,
      apiPresets: apiPresets.value,
      activePresetId: activePresetId.value,
    })
  }

  function save(updates, options = {}) {
    if (updates.apiEndpoint !== undefined) apiEndpoint.value = updates.apiEndpoint
    if (updates.apiKey !== undefined) apiKey.value = updates.apiKey
    if (updates.model !== undefined) model.value = updates.model
    if (!options.keepActivePreset) activePresetId.value = ''
    persist()
  }

  function savePreset(preset) {
    const name = preset.name.trim()
    if (!name) return ''
    const existing = apiPresets.value.find(p => p.id === preset.id)
    const data = {
      id: preset.id || `preset_${Date.now().toString(36)}`,
      name,
      apiEndpoint: preset.apiEndpoint || 'https://api.openai.com',
      apiKey: preset.apiKey || '',
      model: preset.model || '',
    }
    if (existing) Object.assign(existing, data)
    else apiPresets.value.push(data)
    activePresetId.value = data.id
    save(data, { keepActivePreset: true })
    return data.id
  }

  function applyPreset(id) {
    const preset = apiPresets.value.find(p => p.id === id)
    if (!preset) return null
    activePresetId.value = preset.id
    save(preset, { keepActivePreset: true })
    return preset
  }

  function deletePreset(id) {
    apiPresets.value = apiPresets.value.filter(p => p.id !== id)
    if (activePresetId.value === id) activePresetId.value = ''
    persist()
  }

  function exportData() {
    return {
      apiEndpoint: apiEndpoint.value,
      apiKey: apiKey.value,
      model: model.value,
      apiPresets: apiPresets.value,
      activePresetId: activePresetId.value,
    }
  }

  function importData(imported) {
    if (!isObject(imported)) throw new Error('settings 必须是对象')
    const nextPresets = normalizePresets(imported.apiPresets)
    apiEndpoint.value = String(imported.apiEndpoint || DEFAULT_API_ENDPOINT)
    apiKey.value = String(imported.apiKey || '')
    model.value = String(imported.model || DEFAULT_MODEL)
    apiPresets.value = nextPresets
    activePresetId.value = String(imported.activePresetId || '')
    if (activePresetId.value && !apiPresets.value.some(p => p.id === activePresetId.value)) activePresetId.value = ''
    persist()
  }

  return {
    apiEndpoint, apiKey, model, apiPresets, activePresetId,
    isConfigured, save, savePreset, applyPreset, deletePreset, exportData, importData,
  }
})
