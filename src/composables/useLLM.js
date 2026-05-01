import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useLedgerStore } from '../stores/ledger'
import { todayStr, yesterdayStr } from '../utils/format'
import { ASSET_TYPES } from '../utils/categories'

export function useLLM() {
  const loading = ref(false)
  const error = ref('')

  async function parseExpenses(text) {
    const settings = useSettingsStore()
    const ledger = useLedgerStore()

    if (!settings.isConfigured()) {
      error.value = '请先在设置中补全 API 配置'
      return null
    }

    loading.value = true
    error.value = ''

    const catList = ledger.categories.map(c => `${c.id}（${c.name}）`).join('、')
    const assetTypeList = ASSET_TYPES.map(t => `${t.id}（${t.name}）`).join('、')
    const systemPrompt = `你是一个记账助手。用户会用自然语言描述财务事件，请解析为 JSON 数组。
每条记录都必须包含 kind：
- kind: "expense" 表示支出，"income" 表示收入/存入/到账，"asset" 表示资产账户余额

支出和收入记录包含：
- name: 项目名
- amount: 金额（数字）
- category: 支出分类，只能是以下之一：${catList}。income 可省略或填 other
- date: 日期（YYYY-MM-DD 格式。"今天"=${todayStr()}，"昨天"=${yesterdayStr()}。如未提及日期则默认今天）
- note: 备注（可选的补充信息，默认空字符串）

资产记录包含：
- name: 账户/资产名
- balance: 当前余额（数字，可正可负）
- assetType: 资产类型，只能是以下之一：${assetTypeList}
- note: 备注（可选，默认空字符串）

规则：
1. 只返回 JSON 数组，不要 markdown 代码块，不要其他文字
2. 支出和收入金额必须是正数
3. 资产余额是当前余额，不是收入或支出
4. 如果用户描述中没有明确的财务信息，返回空数组 []
5. 善于从口语化表达中提取信息`

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

      const results = parsed.map(item => {
        if (!item || typeof item !== 'object') throw new Error('数组项不是对象')
        const kind = String(item.kind || item.type || 'expense')
        if (!['expense', 'income', 'asset'].includes(kind)) throw new Error('AI 返回的记录类型不支持')

        if (kind === 'asset') {
          const balance = Number(item.balance)
          if (!item.name || !Number.isFinite(balance)) throw new Error('AI 返回的资产字段不完整')
          const assetType = ASSET_TYPES.some(t => t.id === item.assetType) ? String(item.assetType) : 'other'
          return {
            kind,
            name: String(item.name),
            balance,
            assetType,
            note: item.note == null ? '' : String(item.note),
          }
        }

        const amount = Number(item.amount)
        const category = kind === 'income' ? String(item.category || 'other') : String(item.category || '')
        if (!item.name || !Number.isFinite(amount) || amount <= 0 || !category || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
          throw new Error('AI 返回的记录字段不完整')
        }
        return {
          kind,
          name: String(item.name),
          amount,
          category,
          date: String(item.date),
          note: item.note == null ? '' : String(item.note),
        }
      })

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
