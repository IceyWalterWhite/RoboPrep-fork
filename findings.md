# Findings & Decisions

## Requirements

- 网页所有用户可见文案改为中文。
- Coding 等用户指定的专有名词可以保留；同类技术和品牌名词也按行业惯例保留。
- 覆盖公共页面、导航、Auth、表单、状态页、Admin、错误页和 seed 中会显示的内容。
- 不改变路由、数据库字段、内部状态值、API 字段和程序逻辑。

## Research Findings

- 应用是 Next.js App Router，用户可见文案分散在 src/app、src/components、src/lib/validation 和 supabase/seed.sql。
- 全局布局目前使用 `<html lang="en">`，metadata、Navbar、Footer 和首页主要是英文。
- 公共数据来自 Supabase；supabase/seed.sql 中的公司、岗位、主题、Knowledge 题、Interview 题目和 Coding 题描述会直接渲染到网页。
- Admin 页面、Auth 表单、反馈/举报、404、加载/错误/空状态同样包含英文。
- 用户此前的 README 已经修改；package.json、scripts/tests/loader.mjs、contributions/ 和 scripts/import-contributions.ts 也存在未提交改动，本次不覆盖。
- 页面文件共覆盖首页、Knowledge、Interview、Coding、Companies、Auth、设置、Onboarding、反馈、法律页面、Admin 和通用 loading/error/not-found 状态；需要同时处理 metadata、aria-label 和表单校验消息。
- `src/lib/knowledge/constants.ts`、`src/lib/interviews/constants.ts`、`src/lib/coding/constants.ts`、`src/lib/companies/helpers.ts`、`src/lib/ingestion/constants.ts` 提供页面使用的筛选、难度、季节、状态等英文标签。
- `supabase/seed.sql` 中的公司和题目标题/描述/答案是英文，会在有 seed 数据的实例中直接显示；用户生成的原始经历不应被脚本强行翻译。

## Technical Decisions

- 全局 `<html lang="en">` 需要改为 `zh-CN`；页面 metadata 也属于浏览器和搜索引擎可见文案。
- Navbar、Footer、Search、Breadcrumb、Pagination、Modal 等通用组件承载大量英文按钮、aria-label 和无障碍文本，必须和页面正文一起翻译。
- Auth、Onboarding、Settings、Feedback 和 Legal 页面都有独立的英文表单/状态/政策文案，不能只改首页。
- 本地 `src/app` 的文件名包含 `[slug]` 等 glob 特殊字符，执行盘点命令时需要加引号。
- 展示标签应直接在既有常量或组件中替换，保留 `spring`、`published`、`wrong_answer` 等程序值，避免影响筛选参数、数据库枚举和判题逻辑。
- 领域缩写和产品名保留原文：Coding、VLA、Transformer、RL、PPO、GRPO、API、Python、NumPy、PyTorch、Supabase、Vercel、GitHub、Judge0、Next.js、React、Monaco；常规 UI 词汇翻译为中文。

| Decision | Rationale |
|----------|-----------|
| 优先修改展示层常量和 JSX 文案 | 影响清晰、不会改变业务行为 |
| 统一状态词：Published=已发布、Under review=审核中、Failed=失败、Unknown=未知 | 页面间状态表达一致 |
| English 技术专名只在必要处保留 | 满足用户要求并保持 Embodied AI 领域表达自然 |

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| 页面和 seed 文案数量较多，无法只改导航 | 分区域盘点并用英文残留搜索做最终复核 |

## Implementation Notes

- 使用既有数据值和路由参数，不新增语言切换逻辑；本次目标是将默认网页文案改为中文。
- 代码示例、命令、URL、slug、邮箱字段和数据库枚举保持原样；会在网页中显示的题目说明、状态和表单提示翻译为中文。
- 对季节、来源、审核状态、任务类型、错误码、内容审核标记和功能开关等动态枚举增加中文展示映射；未知值使用中文兜底，内部枚举值仍保持不变。
- seed 中的开发示例标题、摘要、答案、面试地点、轮次、问题原文和 Coding 题描述在事务末尾统一更新为中文，保证重置本地数据库后页面不会重新出现英文示例文案。
- 另外发现 `supabase/seed_week5_function_problems.sql` 是独立导入的补充题库，包含 33 道结构化 Coding 题、6 个题单和可见测试名称；已在该文件事务末尾追加中文展示数据更新，同时保留 slug、UUID、代码和技术公式不变。

## Resources

- 页面：src/app/
- 组件：src/components/
- 用户错误消息：src/lib/validation/auth.ts 及各表单组件
- 示例公开数据：supabase/seed.sql
- 现有隐私规则：docs/interview-submission-privacy.md
