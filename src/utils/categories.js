// Default categories — used as initial seed, also as icon/color registry
export const DEFAULT_CATEGORIES = [
  { id: 'food',      name: '餐饮',     color: '#e07a4a', bg: '#fdf0ea', icon: 'food' },
  { id: 'shop',      name: '购物',     color: '#5484c4', bg: '#eaf0f8', icon: 'shop' },
  { id: 'pay',       name: '还款/订阅', color: '#8a6bbf', bg: '#f0ecf7', icon: 'pay' },
  { id: 'transport', name: '交通',     color: '#4a9e6d', bg: '#edf7f1', icon: 'transport' },
  { id: 'fun',       name: '娱乐',     color: '#c4a034', bg: '#faf5e6', icon: 'fun' },
  { id: 'daily',     name: '日用',     color: '#c47a9e', bg: '#f8eef3', icon: 'daily' },
  { id: 'other',     name: '其他',     color: '#7a8a9e', bg: '#f0f2f5', icon: 'other' },
]

// Available icon choices for custom categories
export const ICON_OPTIONS = [
  'food', 'shop', 'pay', 'transport', 'fun', 'daily', 'other',
]

// Available color presets for custom categories
export const COLOR_PRESETS = [
  { color: '#e07a4a', bg: '#fdf0ea' },
  { color: '#5484c4', bg: '#eaf0f8' },
  { color: '#8a6bbf', bg: '#f0ecf7' },
  { color: '#4a9e6d', bg: '#edf7f1' },
  { color: '#c4a034', bg: '#faf5e6' },
  { color: '#c47a9e', bg: '#f8eef3' },
  { color: '#7a8a9e', bg: '#f0f2f5' },
  { color: '#d45454', bg: '#fceaea' },
  { color: '#4a8a9e', bg: '#e8f4f7' },
  { color: '#9e6b4a', bg: '#f5efe8' },
]

export const ASSET_TYPES = [
  { id: 'cash',    name: '现金/银行卡' },
  { id: 'savings', name: '储蓄/理财' },
  { id: 'credit',  name: '信用/花呗' },
  { id: 'other',   name: '其他' },
]
