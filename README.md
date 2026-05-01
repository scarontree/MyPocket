# MyPocket

一个本地优先的轻量记账应用：用自然语言输入财务事件，AI 整理成结构化记录，再按账期查看收支、预算和资产。

## 功能

- 自然语言记账：通过 OpenAI 兼容接口解析支出、存入和资产账户。
- 支出总览：展示账期预算、已花、存入、剩余、每日可花、分类统计和最近记录。
- 收支明细：按日期分组查看、编辑、删除记录。
- 资产管理：维护现金、储蓄、信用等账户余额。
- 分类管理：添加、编辑、删除自定义分类。
- API 预设：保存多组 OpenAI 兼容接口配置，便于切换模型测试。
- 导入导出：支持完整 JSON / CSV / Excel 备份。

## 技术栈

- Vue 3
- Vite
- Pinia
- xlsx

数据保存在浏览器 `localStorage`，没有后端服务。

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

项目配置了 GitHub Pages 部署，`vite.config.js` 的 `base` 为 `/MyPocket/`。

## 重要约定

- API Key 只通过应用设置页保存到本地浏览器，不要写入源码。
- JSON / CSV / Excel 完整备份会包含 API Key 和 API 预设，备份文件按敏感文件处理。
- 账本核心逻辑在 `src/stores/ledger.js`。
- 完整备份编解码在 `src/utils/backup*.js`，同步后端应复用这层统一 payload。
- `transactions.type` 为 `expense` 或 `income`；旧数据未带类型时按 `expense` 处理。
- `month` 表示记录归属账期，`date` 表示发生日期；当前总览/明细按账期日期范围筛选。
- `periodRanges` 保存自定义账期范围，未设置时默认使用自然月。
- 新浏览器或清空本地数据后不会自动写入 demo 账单。
- 当前没有自动化测试，改动后至少运行 `npm run build` 并手动验证相关流程。
