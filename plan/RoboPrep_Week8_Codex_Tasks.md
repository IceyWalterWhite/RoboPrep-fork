# RoboPrep — Week 8 Codex Implementation Tasks

> Goal: turn the feature-complete RoboPrep built in Weeks 1–7 into a **production-ready public V1**.
>
> Week 8 is deliberately focused on **Productization + Launch**, not another major feature subsystem.

## Week 8 Definition of Done

By the end of Week 8, RoboPrep should have:

```text
Production deployment
SEO + sitemap + robots
Global Cmd+K search
Product analytics
Error tracking + structured logs
Performance budgets and query audits
Full RLS / authorization / secret audit
Production-safe Judge posture
Production-safe Ingestion posture
Backup + tested restore path
Privacy / Terms / Content policy
Mobile + accessibility polish
Launch runbooks + rollback plan
Production smoke tests
v1.0.0 release checklist
```

The product should support the complete public loop:

```text
Discover RoboPrep
→ Sign up
→ Browse Interviews
→ Study Knowledge
→ Solve Coding
→ Inspect Company Intelligence
→ Submit Interview Experience
→ Return and continue progress
```

And the maintainer loop:

```text
Detect failure
→ Trace request/job
→ Disable risky feature
→ Inspect admin operations
→ Roll back / restore
```

## Week 8 Non-Goals

Do **not** add:

```text
Job board
Referral marketplace
Salary database
AI mock interview
GPU judge
Kubernetes rewrite
Native mobile app
Payment/subscription
Large ML recommendation system
```

---

# Codex Execution Rule

Do not send all Week 8 tasks at once.

Recommended:

```text
one task
→ inspect current repository
→ implement or audit
→ run relevant checks
→ inspect diff
→ commit
→ next task
```

For audit tasks, Codex must produce both:

```text
1. concrete findings
2. concrete code/config/document fixes
```

rather than generic recommendations.

---

# Task 1 — Production Readiness Audit

## Goal

审计 Week 1–7 的 routes、DB、RLS、Auth、Knowledge、Interview、Coding、Judge、Ingestion、Company Intelligence。

## Deliverable

```text
docs/production-readiness-audit.md
```

## Acceptance Criteria

- 按 P0/P1/P2 分类；每个 P0 有具体修复项；基于真实仓库而不是假设。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 2 — Environment Separation

## Goal

明确 local / preview / production 三套环境与外部服务配置。

## Deliverable

```text
docs/environments.md + .env.example
```

## Acceptance Criteria

- Supabase、Judge、LLM、Analytics、Error Tracking、Site URL 分环境；生产 secret 不出现在本地示例。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 3 — Environment Validation Audit

## Goal

集中校验所有环境变量，区分 public/server-only/optional/production-required。

## Deliverable

```text
src/lib/env.ts
```

## Acceptance Criteria

- 生产缺关键变量时 fail fast；禁止散落的危险 process.env 使用。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 4 — Secret Leakage Audit

## Goal

扫描 API key、service role、Judge/LLM token、日志和文档泄漏。

## Deliverable

```text
docs/week8-secret-audit.md
```

## Acceptance Criteria

- 仓库/客户端 bundle/日志/README 无真实 secret；敏感字段默认 redact。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 5 — Feature Flag Infrastructure

## Goal

为 Judge、ML Judge、Interview Submission、LLM Ingestion、Company Trends 增加轻量 feature flag。

## Deliverable

```text
server-side feature flag config
```

## Acceptance Criteria

- 可快速关闭高风险/高成本能力；关闭后 UI 有可理解的降级状态。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 6 — Production Health Endpoint

## Goal

增加快速公开健康检查。

## Deliverable

```text
GET /api/health
```

## Acceptance Criteria

- 只返回 minimal status；不暴露依赖和 secret。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 7 — Admin Diagnostics

## Goal

增加管理员深度诊断页/端点。

## Deliverable

```text
/admin/system 或 internal endpoint
```

## Acceptance Criteria

- 可检查 DB、Judge config、Ingestion config、stats freshness；仅 admin。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 8 — Structured Server Logging

## Goal

统一结构化服务端日志。

## Deliverable

```text
src/lib/logger/*
```

## Acceptance Criteria

- 支持 level/event/request_id/route/job_id/duration；不记录 hidden tests、raw PII、token。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 9 — Correlation ID

## Goal

为 API、Judge、Ingestion、Publish 流程增加 request/correlation id。

## Deliverable

```text
request middleware/helpers
```

## Acceptance Criteria

- 同一故障可跨服务日志追踪；可给用户安全 support id。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 10 — Error Boundary Audit

## Goal

审计所有核心 route 的 loading/error/not-found。

## Deliverable

```text
route-level error/loading files
```

## Acceptance Criteria

- 不展示 raw stack；重要错误有 recovery CTA。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 11 — Error Tracking Integration

## Goal

接入生产 error tracking。

## Deliverable

```text
provider integration
```

## Acceptance Criteria

- 客户端/服务端错误可见；敏感字段 scrub；测试异常可确认收到。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 12 — Error Scrubbing Policy

## Goal

集中定义 error/log scrub 规则。

## Deliverable

```text
src/lib/security/redact.ts + docs
```

## Acceptance Criteria

- email、phone、token、source code、raw interview、hidden test/provider payload 按策略处理。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 13 — Analytics Event Model

## Goal

定义 V1 产品事件。

## Deliverable

```text
docs/product-analytics.md
```

## Acceptance Criteria

- page_view/sign_up/knowledge_view/interview_view/company_view/coding_run/coding_submit/coding_accepted/interview_submission_created 等命名一致且不带 PII。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 14 — Analytics Integration

## Goal

接入轻量 product analytics。

## Deliverable

```text
analytics client/server wrapper
```

## Acceptance Criteria

- 仅发送定义好的事件；不阻塞渲染；生产环境可控。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 15 — Launch Funnel Definitions

## Goal

定义首月关键 funnel。

## Deliverable

```text
docs/product-analytics.md
```

## Acceptance Criteria

- Landing→Knowledge；Coding→Run→Submit→Accepted；Interview→Company→Prepare 等可计算。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 16 — SEO Metadata Audit

## Goal

审计所有公开 route 的 title/description。

## Deliverable

```text
metadata updates
```

## Acceptance Criteria

- 首页、Knowledge、Interview、Coding、Company/Role 页面都有唯一且真实的 metadata。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 17 — Canonical URL Audit

## Goal

为核心公开详情页设置 canonical，处理过滤 URL。

## Deliverable

```text
metadata/canonical config
```

## Acceptance Criteria

- 避免同一内容被多个 filter URL 重复索引。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 18 — robots.txt

## Goal

配置生产 robots 与 preview noindex 策略。

## Deliverable

```text
app/robots.ts 或 robots.txt
```

## Acceptance Criteria

- 允许公共内容；禁止 admin/api/private submission 页面。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 19 — Dynamic Sitemap

## Goal

从发布数据生成 sitemap。

## Deliverable

```text
app/sitemap.ts
```

## Acceptance Criteria

- 包含 published Knowledge/Interview/Coding/Company/Role；排除 draft/admin/dev-only。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 20 — Open Graph Metadata

## Goal

统一 OG/Twitter metadata。

## Deliverable

```text
metadata helper
```

## Acceptance Criteria

- 分享标题/描述/图正确；无私有内容。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 21 — Default Share Image

## Goal

准备静态 RoboPrep 社交分享图。

## Deliverable

```text
public/og-*
```

## Acceptance Criteria

- 轻量、品牌一致、适配常见社交尺寸。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 22 — JSON-LD Audit

## Goal

只对语义合理页面添加 WebSite/Breadcrumb 等 structured data。

## Deliverable

```text
JSON-LD helpers
```

## Acceptance Criteria

- schema 有效；禁止伪造 JobPosting 或不真实结构化数据。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 23 — Search Engine Indexability Audit

## Goal

检查 SSR、404、分页、canonical、robots、sitemap。

## Deliverable

```text
docs/seo-audit.md
```

## Acceptance Criteria

- 核心公开内容无需登录即可被抓取；重要页面不是纯客户端空壳。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 24 — Global Search Architecture Audit

## Goal

统一 Knowledge/Interview/Coding/Companies/Topics 搜索入口。

## Deliverable

```text
src/lib/search/*
```

## Acceptance Criteria

- 复用 Postgres 搜索，不在 launch week 引入 Elasticsearch。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 25 — Cmd+K Global Search

## Goal

实现 ⌘K / Ctrl+K 全局搜索。

## Deliverable

```text
src/components/search/global-search.tsx
```

## Acceptance Criteria

- 结果按 Knowledge/Interviews/Coding/Companies/Topics 分组；键盘与移动端可用。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 26 — Global Search API

## Goal

提供 typed grouped server search。

## Deliverable

```text
/api/search 或 server query
```

## Acceptance Criteria

- 限制 query 长度与每组数量；不把全库加载到浏览器。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 27 — Global Search Ranking

## Goal

定义 deterministic ranking。

## Deliverable

```text
search ranking helper
```

## Acceptance Criteria

- exact > prefix > text similarity > evidence/frequency；GRPO 搜索首屏命中正确实体。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 28 — Search Empty/Error UX

## Goal

打磨全局搜索短 query、无结果、网络异常。

## Deliverable

```text
search states
```

## Acceptance Criteria

- 简洁、可恢复、不出现原始 DB 错误。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 29 — Search Performance Audit

## Goal

测试 GRPO/VLA/attention/ByteDance/quaternion 等真实 query。

## Deliverable

```text
docs/search-performance.md
```

## Acceptance Criteria

- 必要索引完善；无明显慢查询。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 30 — Landing IA Audit

## Goal

重新审视首页信息架构。

## Deliverable

```text
homepage audit/fixes
```

## Acceptance Criteria

- 第一屏能回答 What/Who/Why/What next；删除 Week1 placeholder/fake stats。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 31 — Landing Hero Polish

## Goal

完成 Apple-inspired hero。

## Deliverable

```text
src/app/page.tsx
```

## Acceptance Criteria

- 清晰主标题、简洁副标题、Start Practicing + Explore Interviews；移动端良好。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 32 — Landing Product Pillars

## Goal

展示 Real Interviews / Knowledge / Coding / Company Intelligence。

## Deliverable

```text
homepage sections
```

## Acceptance Criteria

- 每个 pillar 直达真实功能；无 marketing 空话。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 33 — Landing Latest Interviews

## Goal

首页接真实最新 published interviews。

## Deliverable

```text
homepage data section
```

## Acceptance Criteria

- 排除 development seed；复用 Interview 组件。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 34 — Landing Trending Topics

## Goal

数据足够时展示真实全局趋势，否则不渲染。

## Deliverable

```text
homepage trend section
```

## Acceptance Criteria

- 遵循小样本策略；绝不假造百分比。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 35 — Landing Coding Preview

## Goal

首页展示代表性具身/ML coding problems。

## Deliverable

```text
homepage coding preview
```

## Acceptance Criteria

- 不加载 Monaco；链接正确。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 36 — Landing Bundle Audit

## Goal

确保首页不引入 Monaco、Judge、Admin、LLM SDK。

## Deliverable

```text
bundle review
```

## Acceptance Criteria

- 首页 JS 保持轻量。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 37 — Onboarding Flow

## Goal

首次注册后增加可跳过 onboarding。

## Deliverable

```text
/onboarding
```

## Acceptance Criteria

- 只问 target role / target company optional / Knowledge-Coding focus。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 38 — Onboarding Schema

## Goal

必要时添加 target_role_category、primary_focus、onboarding_completed。

## Deliverable

```text
migration
```

## Acceptance Criteria

- 字段最小化；不重复 company target 结构。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 39 — Onboarding Start Recommendation

## Goal

完成 onboarding 后跳到确定性的起始内容。

## Deliverable

```text
routing helper
```

## Acceptance Criteria

- 不依赖 LLM；skip 有合理默认。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 40 — First-Run Empty State Audit

## Goal

新账号无 coding/submission/target 时提供下一步 CTA。

## Deliverable

```text
empty states
```

## Acceptance Criteria

- 不出现空 dashboard。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 41 — Authentication UX Audit

## Goal

审计 signup/signin/signout/session expiry/return URL。

## Deliverable

```text
auth fixes
```

## Acceptance Criteria

- 无 redirect loop；登录后尽量回原页面。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 42 — Password Reset

## Goal

若未完成则补 forgot/reset password。

## Deliverable

```text
/forgot-password /reset-password
```

## Acceptance Criteria

- 安全 token 流；生产 email link 正确。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 43 — Account Settings

## Goal

提供最小 /settings。

## Deliverable

```text
/settings
```

## Acceptance Criteria

- display name、avatar optional、target preference、sign out。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 44 — Account Deletion Workflow

## Goal

设计删除/匿名化用户数据流程。

## Deliverable

```text
settings action + docs
```

## Acceptance Criteria

- 不暴露 public provenance 身份；submission/coding/profile 处理规则明确。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 45 — Mobile Navigation Audit

## Goal

审计 320/375/430/768 宽度导航。

## Deliverable

```text
nav fixes
```

## Acceptance Criteria

- Interview/Knowledge/Coding/Companies/Search/Account 均可达。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 46 — Mobile Menu Polish

## Goal

完善移动抽屉菜单。

## Deliverable

```text
mobile nav component
```

## Acceptance Criteria

- focus 正确、route change 关闭、动画克制。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 47 — Responsive Typography Audit

## Goal

统一全站标题/正文/metadata/code 的响应式字号。

## Deliverable

```text
design token/component fixes
```

## Acceptance Criteria

- 无极小 metadata；手机无超大 hero。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 48 — Long Content Layout Audit

## Goal

审计长 Knowledge、Interview、Coding、Admin raw text。

## Deliverable

```text
layout fixes
```

## Acceptance Criteria

- line length 舒适；code overflow 正确；sticky 不遮挡。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 49 — Core Web Vitals Baseline

## Goal

记录 /、Knowledge detail、Interview detail、Coding detail、Company detail 的 LCP/CLS/INP/TTFB。

## Deliverable

```text
docs/performance-baseline.md
```

## Acceptance Criteria

- 有真实 baseline 与 P0/P1 性能问题。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 50 — Performance Budget

## Goal

制定路由 JS、图片、API 延迟预算。

## Deliverable

```text
docs/performance-budget.md
```

## Acceptance Criteria

- 目标现实且可追踪。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 51 — Bundle Analysis

## Goal

运行 bundle analyzer，定位 Monaco/markdown/chart/admin SDK 等大依赖。

## Deliverable

```text
bundle report
```

## Acceptance Criteria

- Monaco 只存在 coding workspace；server SDK 不进 client。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 52 — Dynamic Import Audit

## Goal

按需 lazy-load Monaco 和重 admin 组件。

## Deliverable

```text
code changes
```

## Acceptance Criteria

- 非 Coding 页面无 Monaco bundle。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 53 — Image Optimization Audit

## Goal

审计 company logo/avatar/OG 等。

## Deliverable

```text
image fixes
```

## Acceptance Criteria

- 合理尺寸、Next Image、避免 layout shift。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 54 — Database Index Audit

## Goal

审计 Knowledge search、Interview filters、Coding filters、Company stats、Ingestion review、submission history。

## Deliverable

```text
new migration if needed
```

## Acceptance Criteria

- 索引有真实 query 依据，不盲目堆索引。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 55 — Slow Query Audit

## Goal

对主要 SQL 做 explain/analyze。

## Deliverable

```text
docs/database-performance.md
```

## Acceptance Criteria

- 最慢 P0/P1 query 修复或有明确说明。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 56 — Server Cache Audit

## Goal

识别可缓存的 public data 与绝不能共享缓存的 user data。

## Deliverable

```text
cache strategy
```

## Acceptance Criteria

- 无跨用户数据泄露。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 57 — Cache Invalidation

## Goal

publish 后 revalidate interviews/knowledge provenance/company/home 等。

## Deliverable

```text
publish hooks
```

## Acceptance Criteria

- 新内容在可预测时间内可见。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 58 — Judge Production Architecture Audit

## Goal

确认生产 Judge 隔离、timeout、network/filesystem/secrets/resource limit。

## Deliverable

```text
docs/judge-production-readiness.md
```

## Acceptance Criteria

- 若不安全，使用更安全 provider 或默认 feature flag off。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 59 — Judge Abuse Tests

## Goal

测试 infinite loop、output flood、memory、process/network/filesystem 行为。

## Deliverable

```text
security test notes
```

## Acceptance Criteria

- 危险能力受限或明确禁用。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 60 — Judge Rate Limit Production Audit

## Goal

确认多实例部署下 rate limit 有效。

## Deliverable

```text
rate-limit implementation
```

## Acceptance Criteria

- 生产不能依赖失效的单实例 memory limiter。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 61 — Judge Cost Controls

## Goal

限制每用户运行/提交、source size、test count、timeout、concurrency。

## Deliverable

```text
judge guards
```

## Acceptance Criteria

- 成本和资源有上界。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 62 — Ingestion Production Audit

## Goal

审计 LLM key、prompt injection、size/rate/retry/idempotency/privacy/moderation/cost。

## Deliverable

```text
docs/ingestion-production-readiness.md
```

## Acceptance Criteria

- 所有 P0 在 launch 前关闭。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 63 — LLM Cost Guardrails

## Goal

限制最大输入、重试、timeout、用户提交频率。

## Deliverable

```text
ingestion guards
```

## Acceptance Criteria

- provider runaway cost 有硬限制。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 64 — Admin Review Polish

## Goal

优化真实审核工作流：status/priority/retry/claim。

## Deliverable

```text
admin review fixes
```

## Acceptance Criteria

- reviewer 可高效日常处理。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 65 — Moderation Queue Polish

## Goal

突出 PII、duplicate、source risk、low confidence。

## Deliverable

```text
admin moderation UI
```

## Acceptance Criteria

- critical flag 未处理不能 publish。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 66 — Admin Audit Log Viewer

## Goal

增加 /admin/audit。

## Deliverable

```text
admin audit route
```

## Acceptance Criteria

- 可查看 publish/reject/reparse/retry/canonical create；admin-only。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 67 — Admin Operations Dashboard Lite

## Goal

增加 /admin 运营首页。

## Deliverable

```text
admin dashboard
```

## Acceptance Criteria

- open reviews、failed jobs、judge failures、stats freshness 等 action-oriented 信息。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 68 — Full RLS Audit

## Goal

逐表审计 profiles/companies/interviews/questions/topics/coding/submissions/ingestion/admin/stats。

## Deliverable

```text
docs/rls-audit.md
```

## Acceptance Criteria

- 每张 exposed table 的 public/owner/admin 权限明确且验证。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 69 — Authorization Route Audit

## Goal

测试 admin、submission detail、settings、review/publish mutation。

## Deliverable

```text
auth tests/fixes
```

## Acceptance Criteria

- 不能仅靠前端隐藏按钮实现授权。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 70 — Mutation Security Audit

## Goal

检查 server actions/API 的 mutation method、origin/CSRF 防护。

## Deliverable

```text
security fixes
```

## Acceptance Criteria

- 无 GET mutation；遵循框架安全模式。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 71 — Input Validation Audit

## Goal

所有用户输入服务端 Zod 校验。

## Deliverable

```text
validation fixes
```

## Acceptance Criteria

- auth/search/filter/interview submit/admin edit/coding/settings 均 server-authoritative。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 72 — XSS/Markdown Audit

## Goal

审计 Knowledge、Interview、problem statement、admin raw text。

## Deliverable

```text
renderer/security fixes
```

## Acceptance Criteria

- 默认禁 raw HTML 或安全 sanitize；无脚本注入。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 73 — Outbound URL Safety Audit

## Goal

审计 source/company/avatar URL。

## Deliverable

```text
URL validator
```

## Acceptance Criteria

- 拒绝 javascript:/data: 等危险 scheme。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 74 — Dependency Security Audit

## Goal

审计依赖漏洞，重点 Next/Auth/Judge。

## Deliverable

```text
dependency report/fixes
```

## Acceptance Criteria

- Critical/High 处理或记录；不盲升 major。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 75 — Dependency Cleanup

## Goal

删除 unused/duplicate packages。

## Deliverable

```text
package cleanup
```

## Acceptance Criteria

- build/test 通过，bundle 不增大。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 76 — Database Backup Policy

## Goal

定义 DB/Storage backup frequency、retention、restore owner。

## Deliverable

```text
docs/backup-recovery.md
```

## Acceptance Criteria

- 有具体恢复路径，不写空泛说明。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 77 — Backup Verification

## Goal

确认生产 backup 实际开启。

## Deliverable

```text
ops checklist
```

## Acceptance Criteria

- 知道 retention 和恢复能力。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 78 — Restore Drill

## Goal

在非生产环境执行一次 restore。

## Deliverable

```text
restore report
```

## Acceptance Criteria

- schema + interviews + questions + coding + ingestion + stats 恢复成功。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 79 — Incident Runbook

## Goal

覆盖 DB corruption、bad migration、Judge outage、LLM outage、bad deploy、accidental publish。

## Deliverable

```text
docs/incident-runbook.md
```

## Acceptance Criteria

- 有 disable/rollback/restore 的明确命令或步骤。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 80 — Migration Audit

## Goal

审计 Week1–7 migration 顺序、destructive ops、RLS、constraints。

## Deliverable

```text
migration fixes/docs
```

## Acceptance Criteria

- fresh DB 和 upgrade path 都能跑。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 81 — Fresh Install Test

## Goal

从空环境按 README 安装、env、migrate、seed、build、run。

## Deliverable

```text
fresh install report
```

## Acceptance Criteria

- 不存在隐性人工步骤。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 82 — Production Build Audit

## Goal

production-like env 下 pnpm build。

## Deliverable

```text
build fixes
```

## Acceptance Criteria

- 无关键 warning/error；client/server boundary 正确。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 83 — Preview Deployment

## Goal

部署 staging/preview 完整测试。

## Deliverable

```text
preview env
```

## Acceptance Criteria

- 与 production 数据隔离；外部付费能力限流。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 84 — Production Deployment Config

## Goal

配置 build、env、domain、HTTPS、redirect、headers。

## Deliverable

```text
deployment config
```

## Acceptance Criteria

- 无 localhost/本地路径假设。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 85 — Security Headers

## Goal

配置 CSP、X-Content-Type-Options、Referrer-Policy、Permissions-Policy、frame protection。

## Deliverable

```text
headers config
```

## Acceptance Criteria

- Monaco/analytics/error tracking 正常；策略有记录。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 86 — CSP Audit

## Goal

针对 Monaco worker、Supabase、analytics 等调 CSP。

## Deliverable

```text
docs/csp.md
```

## Acceptance Criteria

- 不使用无解释的宽松策略。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 87 — Domain Redirect Audit

## Goal

确定 canonical domain 和 http→https、www 策略。

## Deliverable

```text
redirect config
```

## Acceptance Criteria

- 只有一个 canonical origin。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 88 — Auth Email Delivery Audit

## Goal

验证验证邮件/密码重置生产链接与品牌。

## Deliverable

```text
auth email checklist
```

## Acceptance Criteria

- 不出现 localhost。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 89 — Privacy Policy

## Goal

增加 /privacy。

## Deliverable

```text
public legal page
```

## Acceptance Criteria

- 实际覆盖 account、coding source、interview submission、analytics、LLM、retention、deletion。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 90 — Terms of Use

## Goal

增加 /terms。

## Deliverable

```text
public legal page
```

## Acceptance Criteria

- 覆盖 user submission、acceptable use、judge abuse、content accuracy、third-party source。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 91 — Content & Source Policy

## Goal

增加 /content-policy。

## Deliverable

```text
public policy page
```

## Acceptance Criteria

- 解释 community/public source、canonicalization、verification、removal/correction。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 92 — Submission Consent Copy

## Goal

投稿前明确内容会被 review/structured/anonymized/published。

## Deliverable

```text
submission form copy
```

## Acceptance Criteria

- 用户不会误以为私密草稿或即时公开。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 93 — Removal/Correction Request

## Goal

提供内容纠错/隐私/source concern 联系路径。

## Deliverable

```text
report/contact route
```

## Acceptance Criteria

- 无需完整 ticket system，但必须可操作。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 94 — Report Content Action

## Goal

公共内容增加可选 Report issue。

## Deliverable

```text
report UI/API
```

## Acceptance Criteria

- 原因结构化，服务端限流，reporter 不公开。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 95 — Global 404

## Goal

建立品牌一致的 404。

## Deliverable

```text
not-found.tsx
```

## Acceptance Criteria

- 链接 Knowledge/Interviews/Coding/Companies。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 96 — Disabled Feature States

## Goal

Judge/Ingestion 被 feature flag 关闭时有友好降级。

## Deliverable

```text
shared disabled state
```

## Acceptance Criteria

- 浏览内容仍可用，无 500。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 97 — Monitoring Documentation

## Goal

定义 uptime monitor 目标和 alert 条件。

## Deliverable

```text
docs/monitoring.md
```

## Acceptance Criteria

- 至少监控 / 和 /api/health。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 98 — Background Job Monitoring

## Goal

检测 stuck ingestion、failed jobs、stale stats、long judge。

## Deliverable

```text
admin queries/monitor
```

## Acceptance Criteria

- 运营问题在用户投诉前可见。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 99 — Stuck Job Recovery Script

## Goal

新增 scripts/recover-stuck-jobs.ts。

## Deliverable

```text
maintenance script
```

## Acceptance Criteria

- 支持 dry-run；保守恢复，不重复 publish。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 100 — Data Retention Policy

## Goal

定义 raw interview、source code、logs、analytics、provider payload retention。

## Deliverable

```text
docs/data-retention.md
```

## Acceptance Criteria

- 敏感数据不无限保存。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 101 — Log Retention Audit

## Goal

确认日志不是敏感数据影子仓库。

## Deliverable

```text
log policy
```

## Acceptance Criteria

- raw interview/hidden test/secrets 不记录。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 102 — Accessibility Full-Site Audit

## Goal

审计 Landing/Auth/Knowledge/Interview/Coding/Companies/Submission/Admin critical flow。

## Deliverable

```text
a11y report/fixes
```

## Acceptance Criteria

- 键盘、heading、label、focus、contrast、status、reduced-motion 达标。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 103 — Reduced Motion

## Goal

尊重 prefers-reduced-motion。

## Deliverable

```text
CSS/components
```

## Acceptance Criteria

- 核心交互不依赖动画。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 104 — Browser Compatibility Audit

## Goal

测试 Chrome/Edge/Safari/Firefox。

## Deliverable

```text
browser QA doc
```

## Acceptance Criteria

- Auth/Monaco/forms/sticky layout 核心流程可用。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 105 — Coding Workspace Browser Audit

## Goal

专测 Monaco + Judge 跨浏览器。

## Deliverable

```text
coding browser QA
```

## Acceptance Criteria

- 编辑、Run、Submit、Result 无 blocker。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 106 — Production Seed Policy

## Goal

开发 seed 与生产 bootstrap 完全分离。

## Deliverable

```text
seed scripts/docs
```

## Acceptance Criteria

- 生产不会误导入 fake interview。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 107 — Production Content Bootstrap

## Goal

定义 V1 真实内容最低目标。

## Deliverable

```text
docs/content-launch-target.md
```

## Acceptance Criteria

- 建议 Knowledge 150–200+、Coding 50+、Company 10–20+；不为数量造假。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 108 — Content Quality Spot Audit

## Goal

抽查 30 Knowledge、15 Interview、20 Coding、7 Company。

## Deliverable

```text
docs/content-quality-audit.md
```

## Acceptance Criteria

- accuracy、format、topics、difficulty、provenance、link 问题修复。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 109 — Broken Link Audit

## Goal

扫描内部 link。

## Deliverable

```text
script/report
```

## Acceptance Criteria

- question relation/company role/interview provenance/coding/legal/footer 无已知 broken link。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 110 — Slug Integrity Audit

## Goal

检查 duplicate/invalid/renamed slug。

## Deliverable

```text
integrity script
```

## Acceptance Criteria

- 公开 route 稳定；必要时建立 redirect。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 111 — Search Quality Benchmark

## Goal

建立 GRPO/KV Cache/Diffusion Policy/ByteDance/VLA/quaternion/数据采集/world model 的 expected top results。

## Deliverable

```text
docs/search-quality-benchmark.md
```

## Acceptance Criteria

- 可重复用于回归。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 112 — Search Ranking Tuning

## Goal

针对 benchmark 调 ranking。

## Deliverable

```text
search changes
```

## Acceptance Criteria

- canonical exact matches 排名合理。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 113 — Bilingual Search Normalization

## Goal

支持中英常见术语 alias。

## Deliverable

```text
search aliases
```

## Acceptance Criteria

- 字节↔ByteDance、注意力↔Attention、世界模型↔world model 等。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 114 — Company Alias Infrastructure

## Goal

统一 company alias，供 Search + Ingestion matching 共用。

## Deliverable

```text
company alias table/config
```

## Acceptance Criteria

- 不出现多套 alias source。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 115 — Topic Alias Infrastructure

## Goal

统一 Topic 缩写/全称 alias。

## Deliverable

```text
topic alias config
```

## Acceptance Criteria

- GRPO/VLA 等搜索可命中 canonical topic。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 116 — User Feedback Form

## Goal

增加 /feedback。

## Deliverable

```text
feedback form/API
```

## Acceptance Criteria

- bug/content error/feature suggestion/other；服务端限流。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 117 — Launch Metrics Definition

## Goal

定义首 30 天 WAU、Knowledge views、coding submit/accept、interview submissions/published、search、company prep 等。

## Deliverable

```text
docs/launch-metrics.md
```

## Acceptance Criteria

- 指标均能由已实现 analytics 得到。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 118 — Launch Dashboard Lite

## Goal

可选 admin launch dashboard。

## Deliverable

```text
/admin/launch
```

## Acceptance Criteria

- 展示 signups、coding submits、interview submissions、errors、failed jobs，不做 BI 平台。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 119 — Launch Checklist

## Goal

创建全量上线 checklist。

## Deliverable

```text
docs/launch-checklist.md
```

## Acceptance Criteria

- Code/DB/Security/Content/SEO/Analytics/Monitoring/Backup/Legal/Auth/Judge/Ingestion/Admin/Mobile 可逐项勾选。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 120 — Rollback Plan

## Goal

定义 app deploy、feature flag、bad migration、Judge/Ingestion disable 的 rollback。

## Deliverable

```text
docs/rollback-plan.md
```

## Acceptance Criteria

- 高压场景可执行，不是泛泛而谈。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 121 — Release Versioning

## Goal

准备 v1.0.0 与 CHANGELOG。

## Deliverable

```text
CHANGELOG.md
```

## Acceptance Criteria

- 公开 V1 scope 与 known limitations 明确。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 122 — Production Smoke Test Script

## Goal

非破坏式检查 homepage/Knowledge/Interview/Coding fetch/Company/health。

## Deliverable

```text
scripts/production-smoke-test.ts
```

## Acceptance Criteria

- 可安全针对生产运行，不默认调用付费 Judge/LLM。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 123 — Auth Production Smoke Test

## Goal

生产环境手测 signup/signin/reset/signout/protected route。

## Deliverable

```text
launch checklist evidence
```

## Acceptance Criteria

- 邮件回调 URL 正确。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 124 — Judge Production Smoke Test

## Goal

用专用 test account/problem 验证 Run、correct Submit、wrong Submit。

## Deliverable

```text
ops smoke checklist
```

## Acceptance Criteria

- 状态正确，无 hidden test 泄露。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 125 — Ingestion Production Smoke Test

## Goal

用受控投稿测试 submit→parse→review。

## Deliverable

```text
ops smoke checklist
```

## Acceptance Criteria

- pipeline 正常；provider usage 安全记录。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 126 — Company Stats Smoke Test

## Goal

验证 publish→refresh→company page。

## Deliverable

```text
smoke test
```

## Acceptance Criteria

- cache 与 source graph 一致。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 127 — Final Mobile E2E

## Goal

真实/仿真手机跑 Landing→Knowledge→Interview→Company→Submission→Auth。

## Deliverable

```text
QA report
```

## Acceptance Criteria

- 无 launch blocker。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 128 — Final Desktop E2E

## Goal

桌面跑 Search→Interview→Knowledge→Coding→Company Prep。

## Deliverable

```text
QA report
```

## Acceptance Criteria

- 导航和工作流连贯。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 129 — Launch Content Freeze

## Goal

最终 QA 前短期冻结非必要核心内容改动。

## Deliverable

```text
release process
```

## Acceptance Criteria

- 严重 factual/privacy 修复仍允许。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 130 — Production Migration Rehearsal

## Goal

在 staging copy 演练 migrate + stats rebuild。

## Deliverable

```text
migration rehearsal doc
```

## Acceptance Criteria

- 时间、锁、失败回滚明确。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 131 — Launch-Day Runbook

## Goal

按顺序列 deploy→migrate→health→smoke→analytics→judge→ingestion→stats→domain→sitemap。

## Deliverable

```text
docs/launch-day-runbook.md
```

## Acceptance Criteria

- 可逐项执行。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 132 — Post-Launch Incident Checklist

## Goal

覆盖 500 spike、Judge outage、LLM cost spike、spam、DB issue、privacy report。

## Deliverable

```text
docs/post-launch-incidents.md
```

## Acceptance Criteria

- 与 feature flags/runbooks 联动。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 133 — First 7-Day Review Template

## Goal

准备发布后一周复盘模板。

## Deliverable

```text
docs/post-launch-review-template.md
```

## Acceptance Criteria

- traffic/errors/search failures/top content/judge failures/submission quality/moderation load/feedback。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 134 — README Production Update

## Goal

把 README 从开发初期状态更新到完整 V1。

## Deliverable

```text
README.md
```

## Acceptance Criteria

- 架构、本地/生产、Judge、Ingestion、stats refresh、tests、deployment、ops 都准确。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 135 — Architecture Overview

## Goal

创建最终架构文档。

## Deliverable

```text
docs/architecture.md
```

## Acceptance Criteria

- 清楚表达 Next.js/Supabase/Knowledge/Interview/Coding/Judge/Ingestion/Company Intelligence/Observability。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 136 — Technical Debt Register

## Goal

记录 launch 后技术债。

## Deliverable

```text
docs/technical-debt.md
```

## Acceptance Criteria

- 区分 P1/P2/intentional MVP limitation；无隐藏 P0。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 137 — Final Security Sign-Off

## Goal

集中检查 RLS、secrets、admin auth、judge isolation、hidden tests、LLM keys、PII。

## Deliverable

```text
docs/security-signoff.md
```

## Acceptance Criteria

- 所有 launch blocker closed 或明确决定禁用相关 feature。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Task 138 — Week 8 Final Integration Audit

## Goal

完成 RoboPrep V1 全链路验收。

## Deliverable

```text
docs/week8-status.md
```

## Acceptance Criteria

- 所有主用户流、Admin、Search、Failure Mode、Ops 通过；pnpm lint/typecheck/test/build 全绿。
- Preserve existing Week 1–7 behavior unless the task explicitly fixes a defect.
- Run the relevant lint/typecheck/test/build checks for changed code.

---

# Recommended Priority Order

Do **not** treat every task as equal priority.

## P0 — Launch Blockers

Execute first:

```text
Production Readiness Audit
Environment / Secret audits
Feature Flags
Health + Logging + Error Tracking
RLS / Authorization / Input / XSS audits
Judge Production Audit
Ingestion Production Audit
Database Backup + Restore Drill
Migration Audit
Preview Deployment
Production Build
Privacy / Terms / Content Policy
Final Security Sign-Off
```

## P1 — Strongly Recommended Before Public Launch

```text
SEO / Sitemap / Robots
Cmd+K Global Search
Landing polish
Onboarding/Auth polish
Performance / Bundle / DB audits
Monitoring
Admin operations polish
Mobile / Accessibility / Browser QA
Production Content Audit
Smoke tests
Launch / Rollback / Incident runbooks
```

## P2 — Can Slip Slightly After Launch

```text
Launch Dashboard Lite
User data export lite
Optional feedback admin view
Additional social metadata polish
Non-critical analytics refinements
```

---

# Recommended Commit Groups

```text
chore(prod): establish production environments and feature flags
feat(observability): add health logging and error tracking
feat(analytics): add launch event tracking
feat(seo): add metadata sitemap robots and social metadata
feat(search): add global command search
feat(home): polish launch landing page
feat(onboarding): add first-run flow and account polish
perf: optimize bundles queries caching and images
security: harden rls auth validation xss and secrets
security(judge): complete production judge hardening
security(ingestion): add production llm guardrails
ops: add backup restore monitoring and incident runbooks
feat(legal): add privacy terms and source policy
fix(a11y): complete mobile browser and accessibility polish
chore(content): prepare production content
test(prod): add production smoke tests
docs: finalize architecture operations and technical debt
chore(release): prepare RoboPrep v1.0.0
```

---

# Codex Global Instruction — Week 8

Paste this before individual Week 8 tasks in a fresh Codex session:

```text
You are implementing Week 8 of RoboPrep.

RoboPrep is a production-oriented Embodied AI interview preparation platform.

Existing product:

Week 1
- Next.js App Router
- TypeScript
- Supabase
- authentication
- Apple-inspired design system

Week 2
- Knowledge System
- canonical questions
- topics
- question graph

Week 3
- Interview System
- structured rounds
- interview question occurrences
- provenance

Week 4
- Python Coding MVP
- Monaco
- Run / Submit
- hidden tests
- judge abstraction
- submissions

Week 5
- ML / PyTorch function evaluator
- shape / numerical / gradient checks
- coding collections and progress

Week 6
- Interview submission
- LLM ingestion
- canonicalization
- moderation/review
- publish pipeline

Week 7
- Company Intelligence
- role analytics
- trends
- preparation guides

Week 8 goal:

Make RoboPrep production-ready and launch V1.

Priorities:

1. security
2. reliability
3. production operations
4. performance
5. discoverability
6. observability
7. mobile/accessibility
8. launch QA

Engineering rules:

1. Inspect the real repository before modifying anything.
2. Do not invent repository state.
3. Preserve all working Week 1–7 functionality.
4. Fix P0 launch blockers before cosmetic improvements.
5. Never expose secrets in client bundles, logs, docs, analytics, or error tracking.
6. Never expose hidden coding tests or reference implementations.
7. Never execute arbitrary user code directly in the Next.js server process.
8. Keep admin authorization server-side.
9. Audit every exposed Supabase table for RLS.
10. Validate every mutation server-side.
11. Treat interview submission text as untrusted content.
12. Keep private/raw interview text out of analytics and error tracking.
13. Do not fabricate platform or interview statistics.
14. Exclude development seed interview data from production analytics.
15. Maintain feature flags for Judge and Ingestion.
16. Avoid large architectural rewrites during launch week.
17. Avoid unnecessary major dependency upgrades.
18. Keep server/client boundaries strict.
19. Optimize from measured evidence.
20. Keep global search on the current PostgreSQL stack unless evidence proves insufficient.
21. Legal/privacy copy must match actual implemented behavior.
22. Use strict TypeScript.
23. Use Server Components by default.
24. Reuse existing UI and query layers.
25. External provider calls need timeout and failure handling.
26. Important workflows should emit structured logs with correlation IDs.
27. Operational procedures must be documented.
28. After every change run relevant lint/typecheck/test/build checks.
29. Fix regressions introduced by the task.
30. Summarize files changed, risk addressed, commands run, and remaining limitations.

Visual direction:

RoboPrep should remain Apple-inspired and content-first.

Do not turn launch polish into:
- a chart-heavy SaaS dashboard
- neon AI branding
- excessive glassmorphism
- animation-heavy marketing
```

---

# Final Public Route Map

```text
/

/knowledge
/knowledge/[slug]
/knowledge/topics
/knowledge/topics/[slug]

/interviews
/interviews/[slug]
/interviews/submit
/interviews/submissions/[id]

/coding
/coding/[slug]
/coding/collections
/coding/collections/[slug]
/coding/progress
/coding/submissions/[id]

/companies
/companies/[slug]
/companies/[companySlug]/roles/[positionSlug]
/companies/[slug]/prepare

/sign-in
/sign-up
/forgot-password
/reset-password

/settings

/privacy
/terms
/content-policy
/feedback
```

Private:

```text
/admin
/admin/interviews/review
/admin/interviews/review/[id]
/admin/companies/[slug]/quality
/admin/audit
```

---

# Final RoboPrep V1 Architecture

```text
                   RoboPrep / Next.js
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
 Knowledge System   Interview System   Coding System
        │                │                │
        ▼                ▼                ▼
 Canonical Qs       Occurrences        Problems/Judge
 Topics/Graph       Rounds/Source      Submissions
        │                │                │
        └──────────┬─────┴───────┬────────┘
                   ▼             ▼
          Company Intelligence  Ingestion
                   │             │
                   ▼             ▼
            Preparation Guide  Human Review
                                 │
                                 ▼
                               Publish
```

Infrastructure:

```text
Supabase PostgreSQL
Supabase Auth
Next.js Server
Judge Provider
LLM Parser Provider
Analytics
Error Tracking
Monitoring
Backup / Recovery
```

---

# V1 Launch Principle

Do not delay V1 merely to add more features once these are true:

```text
Knowledge is useful
Interview graph is trustworthy
Coding Judge works safely
Company preparation is useful
Interview submissions can be reviewed
Security is acceptable
Operations and rollback are understood
```

After launch, use real usage to determine Week 9+ rather than automatically expanding scope.

Likely later candidates:

```text
Knowledge progress / spaced repetition
better bilingual semantic search
AI mock interview
company comparison
advanced personalized roadmap
more scalable ML judge infrastructure
community reputation
jobs / referrals
```
