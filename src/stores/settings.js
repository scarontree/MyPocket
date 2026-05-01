import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadSettings, saveSettings } from '../utils/storage'

export const useSettingsStore = defineStore('settings', () => {
  const raw = loadSettings()
  const apiEndpoint = ref(raw.apiEndpoint)
  const apiKey = ref(raw.apiKey)
  const model = ref(raw.model)

  const isConfigured = () => !!apiKey.value

  function save(updates) {
    if (updates.apiEndpoint !== undefined) apiEndpoint.value = updates.apiEndpoint
    if (updates.apiKey !== undefined) apiKey.value = updates.apiKey
    if (updates.model !== undefined) model.value = updates.model
    saveSettings({ apiEndpoint: apiEndpoint.value, apiKey: apiKey.value, model: model.value })
  }

  return { apiEndpoint, apiKey, model, isConfigured, save }
})
