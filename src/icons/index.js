/* SVG Icon components — all 24x24 viewBox, currentColor, 1.5px stroke, round caps */
import { h } from 'vue'

const s = { fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }

const icon = (paths) => (props) =>
  h('svg', { viewBox: '0 0 24 24', width: props.size || 20, height: props.size || 20, ...s, ...props }, paths.map(p =>
    typeof p === 'string' ? h('path', { d: p }) : h(p[0], p[1])
  ))

// ── Navigation ──
export const IconGrid = icon([
  ['rect', { x: '3', y: '3', width: '7', height: '7', rx: '1.5' }],
  ['rect', { x: '14', y: '3', width: '7', height: '7', rx: '1.5' }],
  ['rect', { x: '3', y: '14', width: '7', height: '7', rx: '1.5' }],
  ['rect', { x: '14', y: '14', width: '7', height: '7', rx: '1.5' }],
])

export const IconList = icon([
  'M8 6h13', 'M8 12h13', 'M8 18h13',
  ['circle', { cx: '3.5', cy: '6', r: '1' }],
  ['circle', { cx: '3.5', cy: '12', r: '1' }],
  ['circle', { cx: '3.5', cy: '18', r: '1' }],
])

export const IconWallet = icon([
  'M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z',
  'M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  ['circle', { cx: '17', cy: '14', r: '1.5', fill: 'currentColor', stroke: 'none' }],
])

// ── Actions ──
export const IconPlus = icon(['M12 5v14', 'M5 12h14'])
export const IconSend = icon(['M22 2 11 13', 'M22 2 15 22l-4-9-9-4Z'])
export const IconTrash = icon(['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M10 11v6', 'M14 11v6'])
export const IconEdit = icon(['M17 3l4 4L7 21H3v-4L17 3Z'])
export const IconX = icon(['M18 6 6 18', 'M6 6l12 12'])
export const IconSettings = icon([
  'M4 21v-7', 'M4 10V3',
  'M12 21v-9', 'M12 8V3',
  'M20 21v-5', 'M20 12V3',
  'M1 14h6', 'M9 8h6', 'M17 16h6'
])
export const IconDownload = icon(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'])
export const IconUpload = icon(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'])
export const IconChevLeft = icon(['M15 18l-6-6 6-6'])
export const IconChevRight = icon(['M9 18l6-6-6-6'])
export const IconMenu = icon(['M3 6h18', 'M3 12h18', 'M3 18h18'])
export const IconSparkle = icon([
  'M12 2l2.1 6.3L20 10l-5.9 1.7L12 18l-2.1-6.3L4 10l5.9-1.7Z',
  ['circle', { cx: '19', cy: '4', r: '1.2', fill: 'currentColor', stroke: 'none' }],
  ['circle', { cx: '5', cy: '19', r: '1', fill: 'currentColor', stroke: 'none' }],
])

// ── Categories ──
export const IconFood = icon([
  'M3 7c0 4 3 6 5 7v6a1 1 0 0 0 1 1h0a1 1 0 0 0 1-1v-6c2-1 5-3 5-7',
  'M3 7h12', 'M9 3v4',
  'M18 3c0 0-1 2-1 5s2 4 2 7a2 2 0 0 1-2 2h0a1 1 0 0 1-1-1v-5',
])

export const IconShop = icon([
  'M6 2 3 7v2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V7l-3-5Z',
  'M3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9',
  'M9 22V14h6v8',
])

export const IconPay = icon([
  ['rect', { x: '2', y: '5', width: '20', height: '14', rx: '2' }],
  'M2 10h20',
  'M7 15h4',
])

export const IconTransport = icon([
  'M5 17h14M5 17a2 2 0 0 1-2-2V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2M5 17l-1 3h2m12-3 1 3h-2',
  'M3 10h18',
  ['circle', { cx: '7.5', cy: '14', r: '1' }],
  ['circle', { cx: '16.5', cy: '14', r: '1' }],
])

export const IconFun = icon([
  ['rect', { x: '2', y: '6', width: '20', height: '12', rx: '3' }],
  ['circle', { cx: '8.5', cy: '12', r: '1.5' }],
  ['circle', { cx: '15.5', cy: '10.5', r: '.9', fill: 'currentColor', stroke: 'none' }],
  ['circle', { cx: '15.5', cy: '13.5', r: '.9', fill: 'currentColor', stroke: 'none' }],
  ['circle', { cx: '17', cy: '12', r: '.9', fill: 'currentColor', stroke: 'none' }],
  ['circle', { cx: '14', cy: '12', r: '.9', fill: 'currentColor', stroke: 'none' }],
])

export const IconDaily = icon([
  'M9 2v3m6-3v3',
  ['rect', { x: '3', y: '4', width: '18', height: '6', rx: '2' }],
  'M3 10v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8',
  'M8 14h8m-6 3h4',
])

export const IconOther = icon([
  'M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3',
  'M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3',
  'M3 8h18v8H3z',
  'M10 12h4',
])

// ── Asset Types ──
export const IconBank = icon([
  'M3 21h18', 'M3 10h18', 'M12 3l9 7H3Z',
  'M5 10v8m4-8v8m6-8v8m4-8v8',
])

export const IconSavings = icon([
  'M19 10c0-1-1-2-2-2h-1a3 3 0 0 0-6 0H7c-2 0-4 2-4 4s2 4 4 4h1v2h3v-2h2v2h3v-2h1c1 0 2-1 2-2',
  ['circle', { cx: '15', cy: '11', r: '.8', fill: 'currentColor', stroke: 'none' }],
  'M7 5l2 3',
])

export const IconCredit = icon([
  ['rect', { x: '2', y: '4', width: '20', height: '16', rx: '3' }],
  'M2 10h20',
  'M6 15h3m3 0h6',
])

export const CAT_ICONS = {
  food: IconFood,
  shop: IconShop,
  pay: IconPay,
  transport: IconTransport,
  fun: IconFun,
  daily: IconDaily,
  other: IconOther,
}

export const ASSET_ICONS = {
  cash: IconBank,
  savings: IconSavings,
  credit: IconCredit,
  other: IconOther,
}
