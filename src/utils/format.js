export function fmtMoney(n) {
  const abs = Math.abs(n)
  return abs >= 1000
    ? abs.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toFixed(2)
}

export function fmtDate(d) {
  const [, m, day] = d.split('-')
  return `${parseInt(m)}月${parseInt(day)}日`
}

export function monthKey(y, m) {
  return `${y}-${String(m).padStart(2, '0')}`
}

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
