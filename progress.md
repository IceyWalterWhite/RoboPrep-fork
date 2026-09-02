# Progress log

## 2026-09-01

- Read the `planning-with-files` skill and initialized persistent planning files.
- Ran session catch-up; no unsynced previous planning context was reported.
- Confirmed the project is not detected as a Git worktree.
- Began reading Week 3 and Week 4 requirements and the installed Next.js App Router documentation.
- Completed the requirements review: Week 3 contains 33 tasks and Week 4 contains 44 tasks.
- Confirmed the installed framework is Next.js 16.3.3; current App Router `params` and `searchParams` are promise-based.
- Confirmed no Monaco/editor or judge SDK dependency is installed and no `pnpm test` script currently exists.
- Confirmed current schema ends at migration `0004`; the existing interview question relation requires a Week 3 extension for nullable/unlinked occurrences and round entities.
- Added `0005_interview_schema.sql`, `0006_interview_rls.sql`, and `0007_interview_search.sql`.
- Added the Interview domain types, URL filter parser, normalization helpers, mappers, and server query layer.
- Updated the database mirror and Knowledge provenance types for slugs and round metadata.
- `pnpm typecheck` passes after the data-layer changes; the original lint issues were also corrected.
- Added the Week 3 interview list/detail UI, URL filters, search, breadcrumbs, source/verification display, rounds, related records, loading/error/404 states, and interview integrity checks.
- Connected `/knowledge` to its typed query/filter layer so Interview and Coding topic links resolve to a working filtered page.
- Added the Week 4 coding schema, public-safe projections/RLS, Python-only domain/query layer, Monaco editor, run/submit/history routes, judge service, local adapter, Judge0 adapter, rate limiting, validation, seed data, and integrity checks.
- Installed `@monaco-editor/react` as the only new runtime dependency required by the Week 4 editor.
- Local `supabase db reset --yes` now passes all migrations and seed data. Local integrity checks pass: 20 interviews / 50 rounds / 85 occurrences and 20 coding problems / 100 cases / 20 topic links.
- Anonymous RLS verification passes for public coding views and denies direct sensitive problem-table access. The first view check exposed a missing invoker-view column grant; migration `0009` now grants only safe projection columns.
- `pnpm test` passes 8/8; `pnpm test:judge` passes the local Python smoke test; `pnpm typecheck` and `pnpm lint` pass (lint clean after replacing script success logs with `process.stdout.write`).
- Added `docs/week3-status.md`, `docs/week4-status.md`, and `docs/week4-security.md`; updated README for the current Week 3/4 implementation and production limitations.
- Standard `pnpm build` remains blocked by the environment's Turbopack CSS process/port permission panic; the official `pnpm exec next build --webpack` fallback passes and reports all 13 application/API route groups.
- Recursively set `/Users/oplisty/Desktop/homepage/Embodied_Interview_Trends` to `a+rwX`; verification found all regular files world-readable/world-writable and all directories world-searchable/world-writable.

## 2026-09-02

- Continued the Week 5 plan: audited the existing ML-judge implementation (migrations 0012–0016, harness/comparators/adapters, collections, progress) against all 58 tasks; only the `docs/week5-status.md` deliverable was missing.
- Fixed three stale failures surfaced by re-verification: unused `VALID_EVALUATION_MODES` in `scripts/tests/integrity-logic.test.mjs` (now used to validate evaluation_mode), missing `requires_grad`/`forward` fields in gradient expected values in `scripts/test-ml-judge.ts` and `scripts/audit-ml-judge-performance.ts` (types require both).
- Re-ran the full verification: `pnpm test` 24/24, `pnpm typecheck` clean, `pnpm lint` clean of errors, `pnpm exec next build --webpack` passes all routes, and `pnpm test:ml-judge` passes 10/10 scenarios (the smoke test needs `PYTHON_EXECUTABLE` pointing at the numpy+torch env; the default `/usr/bin/python3` lacks numpy and is not a code regression).
- Confirmed Task 34 acceptance: 53 published problems (20 program + 33 function/class), 10 PyTorch, 164 structured test cases, 6 seeded collections.
- Wrote `docs/week5-status.md` covering implemented scope, DB changes, evaluator architecture, frameworks, checks, problem/collection/progress features, security limitations, and the Week 6 handoff.

## 2026-09-02 (Week 6)

- Implemented the full Week 6 Interview Submission + Content Ingestion Pipeline (82 tasks): migrations 0017–0022, ingestion service/parser/matching libraries, submission API + form + status pages, admin review queue/detail/preview with server actions, and the publish-interview-draft SQL transaction with idempotency + provenance + question_stats refresh.
- Key design decisions: all Week 6 tables are service-role-only (RLS on, no public policies); submissions get own-row RLS; reviewer auth via one profiles.role column; publish is a security-definer RPC gated on approved draft + resolved company + ≥1 accepted question, idempotent via interviews.source_submission_id unique index; PII is redacted before any LLM call and moderation flags store counts only; canonical matching is deterministic lexical scoring, reviewer-authoritative.
- Verification: pnpm test 44/44 (20 new offline ingestion tests), typecheck/lint clean, next build --webpack includes all Week 6 routes. DB-dependent checks (check:ingestion, test:ingestion) are written and documented but need a reachable Supabase (Docker unavailable in this environment, same as Week 5).
- Docs added: docs/ingestion-architecture.md, docs/ingestion-worker.md, docs/question-extraction-guidelines.md, docs/interview-submission-privacy.md, docs/week6-status.md; README and .env.example updated.

## 2026-09-02 (Week 7)

- Implemented the Week 7 Company Intelligence MVP (84 tasks): migration 0023 with eight rebuildable cache tables + idempotent refresh_company_stats SQL function + publish trigger; centralized src/lib/companies query layer; company directory/detail/role/prepare pages; admin data-quality view; company+position filters in /coding and /knowledge; refresh script, integrity script, fixture smoke test, and 14 offline metric unit tests.
- Metric/copy principles enforced: everything derived from published interviews only, sample size always visible (limited <3 / counts 3–9 / percentage ≥10), volume-normalized 90-day trend scores, conservative emerging/declining thresholds, evidence-based copy ("appeared in 7 of 18 records"), no prestige ranking.
- Verification: pnpm test 58/58, typecheck/lint clean, build --webpack passes all routes. DB-dependent scripts (refresh:companies, check:companies, test:companies) documented and need a reachable Supabase.
- Docs added: docs/company-metrics.md, docs/company-intelligence-architecture.md, docs/week7-status.md; README updated.

## 2026-09-02 (Week 8)

- Implemented the Week 8 Productization + Launch scope (P0 + P1): feature flags with graceful disabled states; structured logger + redaction policy + x-request-id correlation; /api/health; admin operations/audit/system pages; global ⌘K search (API + grouped UI + bilingual aliases + shared company_aliases table); robots/sitemap/metadata+OG; onboarding/settings/password reset/account deletion; legal pages + feedback + content reports; global 404; security headers; recover-stuck-jobs and production smoke test scripts; migration 0024.
- Wrote the ops/security documentation set (production readiness audit, environments, secret audit, analytics events, SEO audit, judge/ingestion readiness, RLS audit, backup/recovery, incident runbook, monitoring, data retention, launch checklist, rollback plan, launch-day runbook, CSP, security sign-off, architecture, technical debt, CHANGELOG, week8-status).
- Verification: pnpm test 58/58, typecheck/lint clean, next build --webpack green with the full V1 route surface.

## 2026-09-02 (Chinese UI localization)

- Started a full Chinese localization pass for all user-visible web copy while preserving technical names such as Coding, VLA, Transformer, Supabase, and Vercel.
- Created task_plan.md and findings.md for the localization scope; existing README, package.json, loader, and contributions changes remain untouched.
- Completed localization across the public pages, shared layout, Auth, onboarding/settings, Knowledge, Interview, Coding, Companies, submission flow, Admin, legal/feedback pages, API-facing errors, dynamic enum fallbacks, and seed display data.
- Kept route names, slugs, database enums, API fields, code samples, commands, URLs, and technical/product names unchanged; updated the two affected unit-test assertions to match the intentionally translated user-facing messages.
- Verification after localization: `pnpm test` 58/58, `pnpm typecheck` passes, `pnpm lint` passes with the project's existing 51 warnings and 0 errors, changed TypeScript/TSX files pass Prettier check, `git diff --check` passes, and `pnpm exec next build --webpack` passes all routes.
- 补充检查发现独立的 `supabase/seed_week5_function_problems.sql` 也会在手动导入后提供网页题目数据；已为其中 33 道结构化 Coding 题、6 个题单和 65 个可见测试名称追加中文展示更新，并保留 slug、UUID、代码和技术公式。
- 最终验证：`pnpm test` 58/58、`pnpm typecheck`、TypeScript/TSX Prettier 检查、`git diff --check` 和 `pnpm exec next build --webpack` 全部通过；`pnpm lint` 仍为 0 errors / 51 个项目既有 warnings。
- 进一步收紧未知状态、枚举、地区、评测分组、导入事件和任务错误的中文兜底，并隐藏审核页可能出现的原始英文内部错误；改动后再次通过全部上述检查。
