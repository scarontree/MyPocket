<script setup>
import { ref } from 'vue'
import { useLLM } from '../composables/useLLM'
import { useSettingsStore } from '../stores/settings'
import ParsedPreview from './ParsedPreview.vue'
import { IconSparkle, IconSend, IconSettings } from '../icons'

const emit = defineEmits(['openSettings'])
const settings = useSettingsStore()
const { loading, error, parseExpenses } = useLLM()

const text = ref('')
const parsed = ref(null)

async function handleSubmit() {
  const input = text.value.trim()
  if (!input) return
  if (!settings.isConfigured()) {
    error.value = '请先配置 API'
    return
  }
  const result = await parseExpenses(input)
  if (result) {
    parsed.value = result
  }
}

function handleDone() {
  text.value = ''
  parsed.value = null
}

function handleKey(e) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    handleSubmit()
  }
}
</script>

<template>
  <div class="smart-input-wrap">
    <!-- Parsed results preview -->
    <ParsedPreview v-if="parsed && parsed.length > 0" :items="parsed" @done="handleDone" @cancel="parsed = null" />

    <!-- Input area -->
    <div v-else class="smart-input" :class="{ loading }">
      <div class="input-header">
        <IconSparkle :size="18" class="sparkle-icon" />
        <span class="input-title">随便写，AI 帮你整理</span>
        <button v-if="!settings.isConfigured()" class="config-hint" @click="$emit('openSettings')">
          <IconSettings :size="14" />
          配置 API
        </button>
      </div>

      <div class="textarea-wrap">
        <textarea
          v-model="text"
          placeholder="今天中午吃了碗麻辣烫18块，又去蜜雪买了杯柠檬水4块..."
          rows="3"
          @keydown="handleKey"
          :disabled="loading"
        />
      </div>

      <div class="input-footer">
        <span class="hint">⌘/Ctrl + Enter 发送</span>
        <div class="footer-right">
          <span v-if="error" class="error-msg">{{ error }}</span>
          <button class="send-btn" @click="handleSubmit" :disabled="!text.trim() || loading">
            <template v-if="loading">
              <span class="loading-dot" />
              整理中...
            </template>
            <template v-else>
              <IconSend :size="16" />
              整理一下
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.smart-input-wrap { margin-bottom: 2rem; }

.smart-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color .2s, box-shadow .2s;
}
.smart-input:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(224,122,74,.08);
}
.smart-input.loading { opacity: .85; }

.input-header {
  display: flex; align-items: center; gap: .45rem;
  padding: .75rem 1rem .25rem;
  font-size: .82rem; font-weight: 500; color: var(--text-2);
}
.sparkle-icon { color: var(--accent); }
.input-title { flex: 1; }
.config-hint {
  display: flex; align-items: center; gap: .25rem;
  padding: .25rem .6rem; border-radius: var(--radius-full);
  font-size: .72rem; font-weight: 600;
  color: var(--accent); background: var(--accent-soft);
  transition: all .15s;
}
.config-hint:hover { background: var(--accent); color: #fff; }

.textarea-wrap { padding: .25rem 1rem; }
.textarea-wrap textarea {
  width: 100%; border: none; outline: none; resize: none;
  background: none; font-size: .92rem; line-height: 1.6;
  color: var(--text); min-height: 72px;
}
.textarea-wrap textarea::placeholder { color: var(--text-3); }

.input-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: .5rem 1rem .75rem; gap: .5rem;
}
.hint { font-size: .7rem; color: var(--text-3); }
.footer-right { display: flex; align-items: center; gap: .75rem; }
.error-msg { font-size: .75rem; color: var(--red); }

.send-btn {
  display: flex; align-items: center; gap: .35rem;
  padding: .45rem 1rem; border-radius: var(--radius);
  background: var(--accent); color: #fff;
  font-size: .82rem; font-weight: 600;
  transition: all .15s;
}
.send-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); box-shadow: var(--shadow-accent); }
.send-btn:disabled { opacity: .5; cursor: not-allowed; }

.loading-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: currentColor; animation: pulse 1s infinite;
}
</style>
