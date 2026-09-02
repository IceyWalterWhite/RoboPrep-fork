# Task Plan: Chinese UI localization

## Goal

将 RoboPrep 所有网页中的用户可见文案统一为中文，同时保留 Coding、VLA、Transformer 等必要专有名词和代码/API 标识。

## Next Step

本地化与验证已完成，交付前仅需查看最终 diff；部署时按 README 的 Quick Start 执行。

## Current Phase

Phase 5

## Phases

### Phase 1: Requirements & Discovery

- [x] 明确范围：网页用户可见文案，不改代码标识、路由、数据库字段和专有名词
- [x] 盘点页面、组件、错误状态和 seed 内容
- [x] 将发现记录到 findings.md
- **Status:** complete

### Phase 2: Translation structure

- [x] 统一术语和状态文案
- [x] 确定哪些英文品牌/技术名词保留
- [x] 记录决定及理由
- **Status:** complete

### Phase 3: Implementation

- [x] 翻译布局、导航、首页和公共组件
- [x] 翻译 Knowledge、Interview、Coding、Companies 页面
- [x] 翻译 Auth、提交、Admin、反馈、法律和错误状态
- [x] 翻译会直接展示给用户的 seed 内容（包括 Week 5 补充 Coding 题库和题单）
- **Status:** complete

### Phase 4: Testing & Verification

- [x] 检查用户可见英文残留
- [x] 运行格式、类型检查、lint 和构建
- [x] 修复发现的问题
- [x] 将测试结果记录到 progress.md
- **Status:** complete

### Phase 5: Delivery

- [x] Review 变更范围和未提交改动
- [x] 确认专有名词和功能含义没有被误译
- [x] 向用户交付
- **Status:** complete

## Key Questions

1. “全部中文”是否包含数据库 seed 中会渲染到网页的示例题目、答案和公司描述？包含。
2. 哪些词保留英文？Coding、Knowledge、Interview、VLA、Transformer、RL、PPO、GRPO、API、Supabase、Vercel、GitHub、Judge0 等品牌或技术专名按可读性保留。
3. 是否修改 route、数据库字段或程序内部状态？不修改，只翻译展示层文案和面向用户的错误信息。

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| 以中文为默认 UI 语言 | 用户要求网页全部中文 |
| 技术名词按行业惯例保留 | 避免把 Coding、VLA 等专名翻译成不自然或有歧义的中文 |
| 翻译 seed 中的公开示例内容 | 它们会出现在首页、Knowledge、Interview、Coding 和 Companies 页面 |
| 不翻译 URL、slug、数据库枚举和代码逻辑 | 这些不是网页文案，修改会破坏链接、查询或运行语义；仅将 starter code 中的 TODO 提示改为中文 |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| zsh regex 搜索命令解析失败 | 1 | 改用单引号包裹的 PCRE2 表达式继续盘点 |
| Prettier 无法解析 SQL seed 文件 | 1 | 单独跳过 SQL 文件，继续格式化 TypeScript/TSX；SQL 通过类型/构建前的独立检查验证 |
| 组合补丁出现上下文不匹配 | 2 | 先重新读取目标片段，再拆分为更小的补丁应用 |
| SQL 地点字段补丁初次落在错误的 UPDATE 片段 | 1 | 移除错误片段，并将地点映射放回 `public.interviews` 更新中 |
| 新增枚举映射出现重复对象键 | 1 | 通过 TypeScript 检查定位并删除重复的 `research`、`systems`、`robotics` 映射 |
| 发现 Week 5 补充 seed 未纳入自动 seed 配置 | 1 | 仍补齐其公开题目、题单和可见测试名称，避免手动导入后网页出现英文 |

## Notes

- 保留用户之前对 README、package.json、测试 loader 和 contributions 相关的未提交修改。
- 每完成两轮页面盘点后更新 findings.md。
