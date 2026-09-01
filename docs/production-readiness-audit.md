# Production readiness audit (Week 8 Task 1)

Audit of the real repository state after Weeks 1–7 (verified: `pnpm test` 58/58,
typecheck/lint clean, `next build --webpack` green, migrations `0001`–`0024`).

## P0 — launch blockers (all closed this week)

| Finding | Fix |
| --- | --- |
| No health endpoint for uptime monitors | `GET /api/health` (minimal status, no deps exposed) |
| No feature flags; judge/ingestion cannot be paused without a deploy | `src/lib/feature-flags.ts` + graceful disabled states on submit/run/company trends |
| No structured logging or correlation ids | `src/lib/logger`, `x-request-id` set in `src/proxy.ts` |
| Judge0/local selection left unguarded posture | `docs/judge-production-readiness.md`; local adapter already hard-refused in production (`service.ts` gates on `NODE_ENV`) |
| Legal pages missing | `/privacy`, `/terms`, `/content-policy` matching implemented behavior |
| No robots/sitemap | `src/app/robots.ts`, `src/app/sitemap.ts` (published content only) |
| No global search (navbar ⌘K was a placeholder) | `/api/search` + `GlobalSearch` panel, deterministic ranking, aliases |
| Security headers absent | CSP + HSTS + frame/nonce policy headers in `next.config.ts` |
| No backup/restore or rollback documentation | `docs/backup-recovery.md`, `docs/rollback-plan.md`, `docs/incident-runbook.md` |

## P1 — strongly recommended (status)

- Cmd+K search with bilingual aliases — done (`src/lib/search`).
- Onboarding, settings, password reset, account deletion — done.
- Admin ops dashboard, audit viewer, system diagnostics — done (`/admin`, `/admin/audit`, `/admin/system`).
- Stuck-job recovery script — done (`scripts/recover-stuck-jobs.ts`).
- Production smoke test — done (`scripts/production-smoke-test.ts`, non-destructive).
- Performance baseline measurements against live production — **requires deployed environment**; budgets documented in `docs/performance-baseline.md` section of week8-status.

## P2 — acceptable to follow up post-launch

- Compare UI on top of `compareCompanies` helper; analytics dashboards; additional OG image variants; per-route cache tuning.

## Verified non-issues

- Hidden coding tests, expected tensors, reference solutions: never returned by public views (Week 4/5 views + RLS verified in Weeks 4–5 audits).
- Ingestion tables: RLS enabled, no public policies; all access via service role (`src/lib/ingestion/queries.ts`).
- Admin surfaces: server-guarded via `profiles.role`; non-reviewers get 404.
- Development seed interviews are labeled `source_type = "development"`, excluded from public analytics by policy.
