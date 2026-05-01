<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useLedgerStore } from '../stores/ledger'
import { COLOR_PRESETS, ICON_OPTIONS } from '../utils/categories'
import { IconX, IconPlus, IconTrash, CAT_ICONS } from '../icons'

const emit = defineEmits(['close'])
const settings = useSettingsStore()
const ledger = useLedgerStore()

const tab = ref('api') // 'api' | 'categories'

const form = ref({
  apiEndpoint: settings.apiEndpoint,
  apiKey: settings.apiKey,
  model: settings.model,
})

function saveApi() {
  settings.save(form.value)
  window.__toast?.('设置已保存 ✓')
  emit('close')
}

// ── Category editing ──
const editingCat = ref(null) // null = not editing, object = editing
const catForm = ref({})

function startAddCat() {
  const preset = COLOR_PRESETS[ledger.categories.length % COLOR_PRESETS.length]
  catForm.value = { name: '', icon: 'other', color: preset.color, bg: preset.bg }
  editingCat.value = 'new'
}

function startEditCat(cat) {
  catForm.value = { ...cat }
  editingCat.value = cat.id
}

function saveCat() {
  if (!catForm.value.name.trim()) return
  if (editingCat.value === 'new') {
    ledger.addCategory(catForm.value)
    window.__toast?.('已添加分类 ✓')
  } else {
    ledger.updateCategory(editingCat.value, catForm.value)
    window.__toast?.('已更新分类 ✓')
  }
  editingCat.value = null
}

function deleteCat(id) {
  ledger.deleteCategory(id)
  editingCat.value = null
  window.__toast?.('已删除')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <div class="tabs">
          <button class="tab" :class="{ active: tab === 'api' }" @click="tab = 'api'">API 设置</button>
          <button class="tab" :class="{ active: tab === 'categories' }" @click="tab = 'categories'">自定义分类</button>
        </div>
        <button class="close-btn" @click="emit('close')"><IconX :size="18" /></button>
      </div>

      <!-- API Tab -->
      <form v-if="tab === 'api'" class="dialog-body" @submit.prevent="saveApi">
        <div class="form-group">
          <label>API 地址</label>
          <input v-model="form.apiEndpoint" placeholder="https://api.openai.com">
          <span class="form-hint">OpenAI 兼容格式，自动拼接 /v1/chat/completions</span>
        </div>
        <div class="form-group">
          <label>API Key</label>
          <input v-model="form.apiKey" type="password" placeholder="sk-...">
        </div>
        <div class="form-group">
          <label>模型</label>
          <input v-model="form.model" placeholder="gpt-4o-mini">
          <span class="form-hint">支持任何 OpenAI 兼容的模型名</span>
        </div>
        <button type="submit" class="save-btn">保存设置</button>
      </form>

      <!-- Categories Tab -->
      <div v-else class="dialog-body">
        <div class="cat-list">
          <div
            v-for="cat in ledger.categories" :key="cat.id"
            class="cat-list-item"
            @click="startEditCat(cat)"
          >
            <div class="cat-swatch" :style="{ background: cat.bg, color: cat.color }">
              <component :is="CAT_ICONS[cat.icon] || CAT_ICONS.other" :size="14" />
            </div>
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-id">{{ cat.id }}</span>
          </div>
        </div>

        <button class="add-cat-btn" @click="startAddCat">
          <IconPlus :size="15" /> 添加分类
        </button>

        <!-- Inline editor -->
        <div v-if="editingCat" class="cat-editor">
          <div class="form-group">
            <label>分类名称</label>
            <input v-model="catForm.name" placeholder="如：医疗">
          </div>
          <div class="form-group">
            <label>图标</label>
            <div class="icon-picker">
              <button
                v-for="iconId in ICON_OPTIONS" :key="iconId"
                type="button" class="icon-option"
                :class="{ selected: catForm.icon === iconId }"
                @click="catForm.icon = iconId"
              >
                <component :is="CAT_ICONS[iconId]" :size="16" />
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>颜色</label>
            <div class="color-picker">
              <button
                v-for="(cp, i) in COLOR_PRESETS" :key="i"
                type="button" class="color-option"
                :class="{ selected: catForm.color === cp.color }"
                :style="{ background: cp.color }"
                @click="catForm.color = cp.color; catForm.bg = cp.bg"
              />
            </div>
          </div>
          <div class="editor-actions">
            <button v-if="editingCat !== 'new' && ledger.categories.length > 1" class="del-btn" @click="deleteCat(editingCat)">
              <IconTrash :size="14" /> 删除
            </button>
            <div class="editor-right">
              <button class="cancel-btn" @click="editingCat = null">取消</button>
              <button class="save-btn small" @click="saveCat" :disabled="!catForm.name.trim()">保存</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(42,37,32,.35); backdrop-filter: blur(4px);
  z-index: 200; display: flex; align-items: center; justify-content: center;
  padding: 1rem; animation: fadeIn .2s ease;
}
.dialog {
  background: var(--surface); border-radius: var(--radius-lg);
  width: 100%; max-width: 440px; box-shadow: var(--shadow-lg);
  animation: slideUp .25s var(--ease-out);
  max-height: 90vh; display: flex; flex-direction: column;
}
.dialog-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.5rem .5rem;
}
.tabs { display: flex; gap: .15rem; }
.tab {
  padding: .4rem .75rem; border-radius: var(--radius);
  font-size: .82rem; font-weight: 500; color: var(--text-3); transition: all .15s;
}
.tab:hover { color: var(--text-2); }
.tab.active { background: var(--accent-soft); color: var(--accent-hover); font-weight: 600; }
.close-btn {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; color: var(--text-3); transition: all .15s;
}
.close-btn:hover { background: var(--surface-2); color: var(--text); }

.dialog-body { padding: .75rem 1.5rem 1.5rem; overflow-y: auto; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: .8rem; font-weight: 600; color: var(--text-2); margin-bottom: .3rem; }
.form-group input {
  width: 100%; padding: .55rem .75rem; border: 1px solid var(--border);
  border-radius: var(--radius); font-size: .88rem; background: var(--bg);
  outline: none; transition: border-color .15s;
}
.form-group input:focus { border-color: var(--accent); }
.form-hint { font-size: .7rem; color: var(--text-3); margin-top: .25rem; display: block; }

.save-btn {
  width: 100%; padding: .6rem; background: var(--accent); color: #fff;
  border-radius: var(--radius); font-weight: 600; font-size: .9rem;
  transition: all .15s; margin-top: .25rem;
}
.save-btn:hover { background: var(--accent-hover); }
.save-btn.small { width: auto; padding: .4rem .85rem; font-size: .82rem; margin-top: 0; }
.save-btn:disabled { opacity: .5; cursor: not-allowed; }

/* ── Category List ── */
.cat-list { display: flex; flex-direction: column; gap: .3rem; margin-bottom: .75rem; }
.cat-list-item {
  display: flex; align-items: center; gap: .6rem;
  padding: .5rem .65rem; border-radius: var(--radius);
  cursor: pointer; transition: background .1s;
}
.cat-list-item:hover { background: var(--surface-2); }
.cat-swatch {
  width: 1.75rem; height: 1.75rem; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cat-name { font-weight: 500; font-size: .88rem; flex: 1; }
.cat-id { font-size: .7rem; color: var(--text-3); font-family: var(--font-display); }

.add-cat-btn {
  width: 100%; padding: .55rem; border: 1.5px dashed var(--border);
  border-radius: var(--radius); font-weight: 500; font-size: .82rem;
  color: var(--text-3); display: flex; align-items: center; justify-content: center;
  gap: .3rem; transition: all .15s;
}
.add-cat-btn:hover { border-color: var(--accent); color: var(--accent); }

/* ── Category Editor ── */
.cat-editor {
  margin-top: 1rem; padding-top: 1rem;
  border-top: 1px solid var(--border);
}
.icon-picker { display: flex; gap: .35rem; flex-wrap: wrap; }
.icon-option {
  width: 2rem; height: 2rem; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid var(--border); color: var(--text-2); transition: all .15s;
}
.icon-option:hover { border-color: var(--text-3); }
.icon-option.selected { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

.color-picker { display: flex; gap: .35rem; flex-wrap: wrap; }
.color-option {
  width: 1.5rem; height: 1.5rem; border-radius: 50%;
  border: 2px solid transparent; transition: all .15s; cursor: pointer;
}
.color-option:hover { transform: scale(1.15); }
.color-option.selected { border-color: var(--text); box-shadow: 0 0 0 2px var(--surface); }

.editor-actions {
  display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;
}
.editor-right { display: flex; gap: .5rem; align-items: center; }
.cancel-btn {
  padding: .4rem .75rem; font-size: .82rem; color: var(--text-3);
  border-radius: var(--radius); transition: all .15s;
}
.cancel-btn:hover { background: var(--surface-2); color: var(--text-2); }
.del-btn {
  display: flex; align-items: center; gap: .25rem;
  padding: .35rem .65rem; background: var(--red-soft); color: var(--red);
  border-radius: var(--radius); font-size: .78rem; font-weight: 500; transition: all .15s;
}
.del-btn:hover { background: var(--red); color: #fff; }
</style>
