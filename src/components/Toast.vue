<script setup>
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
let timer = null

window.__toast = (msg) => {
  message.value = msg
  visible.value = true
  clearTimeout(timer)
  timer = setTimeout(() => { visible.value = false }, 2200)
}
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" class="toast">{{ message }}</div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed; bottom: 2rem; left: 50%;
  transform: translateX(-50%);
  padding: .6rem 1.25rem;
  background: var(--text); color: var(--bg);
  border-radius: var(--radius);
  font-size: .85rem; font-weight: 500;
  z-index: 999; box-shadow: var(--shadow-lg);
  white-space: nowrap;
}
.toast-enter-active { animation: toastIn .3s var(--ease-out); }
.toast-leave-active { animation: toastIn .2s var(--ease-out) reverse; }
@keyframes toastIn {
  from { opacity: 0; transform: translate(-50%, 12px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
</style>
