import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useLedgerStore } from '../stores/ledger'
import { todayStr, yesterdayStr } from '../utils/format'

export function useLLM() {
  const loading = ref(false)
  const error = ref('')

  async function parseExpenses(text) {
    const settings = useSettingsStore()
    const ledger = useLedgerStore()

    if (!settings.apiKey) {
      error.value = '请先在设置中配置 API Key'
      return null
    }

    loading.value = true
    error.value = ''

    // Build dynamic category list from store
    const catList = ledger.categories.map(c => `${c.id}（${c.name}）`).join('、')
    const validCatIds = ledger.categories.map(c => c.id)
    const fallbackCat = validCatIds[validCatIds.length - 1] || 'other'

    const systemPrompt = `你是一个记账助手。用户会用自然语言描述消费，请解析为 JSON 数组。
每条记录包含：
- name: 项目名（简洁，2-6个字）
- amount: 金额（数字，不带符号）
- category: 分类，只能是以下之一：${catList}
- date: 日期（YYYY-MM-DD 格式。"今天"=${todayStr()}，"昨天"=${yesterdayStr()}。如未提及日期则默认今天）
- note: 备注（可选的补充信息，默认空字符串。不要重复 name 的内容）

规则：
1. 只返回 JSON 数组，不要 markdown 代码块，不要其他文字
2. 金额必须是正数
3. 如果用户描述中没有明确的消费信息，返回空数组 []
4. 善于从口语化表达中提取信息`

    try {
      const url = `${settings.apiEndpoint.replace(/\/+$/, '')}/v1/chat/completions`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          temperature: 0.1,
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`API ${res.status}: ${errBody.slice(0, 200)}`)
      }

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content?.trim()
      if (!content) throw new Error('API 返回为空')

      // Parse JSON, handling possible markdown code fences
      let cleaned = content
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }

      const parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed)) throw new Error('返回格式不是数组')

      // Validate and clean each entry
      const results = parsed.map(item => ({
        name: String(item.name || '未知').slice(0, 20),
        amount: Math.abs(parseFloat(item.amount)) || 0,
        category: validCatIds.includes(item.category) ? item.category : fallbackCat,
        date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : todayStr(),
        note: String(item.note || ''),
      })).filter(item => item.amount > 0)

      loading.value = false
      return results
    } catch (e) {
      loading.value = false
      error.value = e.message || '解析失败'
      return null
    }
  }

  return { loading, error, parseExpenses }
}
