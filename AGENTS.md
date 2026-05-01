# MyPocket Agent Guide

## 项目定位

MyPocket 是一个 Vue 3 + Vite 的本地记账应用。核心体验是：

- 在总览页用自然语言输入财务事件，调用 OpenAI 兼容接口解析成支出、存入或资产账户。
- 在明细页按当前账期查看和编辑收支记录。
- 在资产页维护现金、储蓄、信用额度等账户余额。
- 数据、分类、API 设置和 API 预设都存储在浏览器 `localStorage`。

默认按“最小正确方案”推进改动：只围绕当前需求修改，不扩展新的业务路径；涉及数据结构、导入导出或账期逻辑时，先检查输入、处理流程、状态变化、输出和上下游影响。

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run preview
```

当前没有测试脚本。涉及行为逻辑变更时，至少运行 `npm run build`，并在浏览器里手动覆盖对应主流程。

## 目录结构

```text
src/
  App.vue                    应用入口和视图切换
  main.js                    Vue / Pinia 初始化
  components/                通用 UI、弹窗、智能输入、导入导出侧栏
  views/                     总览、明细、资产三个主视图
  stores/                    Pinia 状态：ledger / settings
  composables/useLLM.js      自然语言解析接口调用
  utils/                     存储、格式化、分类常量
  styles/                    全局样式和设计 token
  icons/                     本地 SVG 图标组件
public/                      静态资源
.github/workflows/deploy.yml GitHub Pages 构建部署
```

## 数据约定

`src/stores/ledger.js` 是账本状态中心：

- `budgets`：按 `YYYY-MM` 保存预算。
- `transactions`：收支记录，字段包含 `id`、`month`、`createdAt`、`type`、`name`、`amount`、`date`、`category`、`note`；`type` 为 `expense` 或 `income`，旧数据默认 `expense`。
- `assets`：资产账户，字段包含 `id`、`name`、`balance`、`type`、`note`。
- `categories`：用户可编辑分类，默认值来自 `src/utils/categories.js`。
- `periodRanges`：按 `YYYY-MM` 保存自定义账期范围，字段为 `start` / `end`，未设置时默认自然月。

`month` 是记录归属账期，`date` 是财务事件发生日期；当前总览、明细、统计和支出导出使用 `currentPeriod` 的日期范围筛选。改动新增/导入/编辑记录时，要明确这两个字段和账期范围的关系，不能默认等价。

空账本不自动写入 demo 记录；需要示例数据时应通过明确导入或专门的开发工具添加。

## LLM 接口约定

`src/composables/useLLM.js` 调用 OpenAI 兼容的 `/v1/chat/completions`：

- API 地址、Key、模型由 `src/stores/settings.js` 读取。
- 返回值只接受 JSON 数组。前端只做必要格式门槛，不擅自替模型改写字段内容。
- 智能输入结果使用 `kind: expense | income | asset`；确认后分别写入 `transactions` 或 `assets`。
- 设置页支持保存多组 API 预设，预设仍是本地浏览器数据。
- 不要把 API Key 写入源码、README 示例或提交记录。
- JSON / CSV / Excel 完整备份会包含当前 API Key 和 API 预设；处理导入导出时要把备份文件视为敏感数据。
- 修改 prompt 后，需要检查空输入、无财务信息、多笔记录、支出/存入/资产、非默认分类、今天/昨天日期这几类输入。

## 前端实现约定

- 优先沿用现有组合式 API、Pinia setup store、本地 icon 组件和 CSS token。
- 不引入路由、后端、云同步、状态库替换等超出需求的结构性变化。
- 保持移动端可用性，涉及弹窗、侧栏、输入框和列表时检查窄屏。
- 金额统一用 `fmtMoney`，账期键统一用 `monthKey`。
- 完整备份、CSV、Excel 的编解码放在 `src/utils/backup*.js`；组件和后端同步都应复用这层，不把格式细节塞回视图组件。
- 用户可见文案以中文为主，代码注释只在逻辑不直观处添加。

## Review 检查清单

改动前后重点检查：

- 输入：表单、导入文件、LLM 返回值是否经过必要约束。
- 处理流程：新增、批量新增、编辑、删除、导入导出是否共用一致的数据语义。
- 状态变化：Pinia 状态和 `localStorage` 是否同步持久化。
- 输出：总览统计、明细分组、导出 JSON/CSV/XLSX 是否使用同一账期和分类解释。
- 上下游影响：分类删除、账期切换、API 设置变更是否影响已有记录显示。

无法用当前代码验证的前提，要在结论里标注为假设。
