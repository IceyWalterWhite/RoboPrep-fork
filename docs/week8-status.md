# Week 8 status — Productization + Launch (V1)

Date: 2026-09-02

Week 8 turns the Week 1–7 product into a launchable V1: P0 hardening
complete, P1 productization implemented, operational runbooks written. All
checks green: `pnpm test` 58/58, `pnpm typecheck` and `pnpm lint` clean,
`pnpm exec next build --webpack` passes all routes.

## Implemented (code)

- Feature flags (`src/lib/feature-flags.ts`) with graceful disabled states
  for judge, interview submissions, LLM ingestion (mock parser fallback),
  and company trends.
- Observability: `/api/health`, structured JSON logger
  (`src/lib/logger`), `x-request-id` correlation in `src/proxy.ts`,
  redaction policy (`src/lib/security/redact.ts`).
- Admin operations: `/admin` dashboard (open reviews, failed/stuck jobs,
  stats freshness, flags, events), `/admin/audit` (event viewer),
  `/admin/system` (DB/judge/ingestion posture, no secret values).
- Global search: `/api/search` + `GlobalSearch` panel in the navbar ⌘K
  modal — grouped (Knowledge/Interviews/Coding/Companies/Topics),
  deterministic ranking (exact > prefix > substring), bilingual term
  aliases + shared company alias table (migration `0024`).
- SEO: `robots.ts` (admin/api/private disallowed; preview noindex switch),
  `sitemap.ts` (published content only), `buildMetadata` helper with
  canonical + OG/Twitter on public pages.
- Accounts: `/onboarding` (skippable, deterministic destination),
  `/settings` (profile, preferences, confirmed account deletion via
  service role), `/forgot-password` + `/reset-password`.
- Legal & feedback: `/privacy`, `/terms`, `/content-policy`, `/feedback`
  (+ API), `/api/report` for content reports (structured reasons, private
  reporter); explicit submission consent copy.
- Global 404 with recovery links; security headers (CSP, HSTS,
  frame-ancestors, nosniff, referrer/permissions policy) in
  `next.config.ts`.
- Scripts: `scripts/recover-stuck-jobs.ts` (dry-run default, conservative),
  `scripts/production-smoke-test.ts` (non-destructive production checks).
- Migration `0024`: onboarding profile fields, `company_aliases`
  (single alias source for search + ingestion), `content_reports`,
  `user_feedback` (RLS enforced).

## Documentation

production-readiness-audit, environments, week8-secret-audit,
product-analytics, seo-audit, judge-production-readiness,
ingestion-production-readiness, rls-audit, backup-recovery,
incident-runbook, monitoring, data-retention, launch-checklist,
rollback-plan, launch-day-runbook, csp, security-signoff, architecture,
technical-debt, CHANGELOG.md, and this file.

## Routes (final V1 public surface)

`/`, `/knowledge`, `/knowledge/[slug]`, `/interviews`, `/interviews/[slug]`,
`/interviews/submit`, `/interviews/submissions/[id]`, `/coding`,
`/coding/[slug]`, `/coding/collections`, `/coding/collections/[slug]`,
`/coding/progress`, `/coding/submissions/[id]`, `/companies`,
`/companies/[slug]`, `/companies/[slug]/prepare`,
`/companies/[slug]/roles/[positionSlug]`, `/sign-in`, `/sign-up`,
`/forgot-password`, `/reset-password`, `/settings`, `/onboarding`,
`/privacy`, `/terms`, `/content-policy`, `/feedback`.
Private: `/admin`, `/admin/interviews/review`, `/admin/audit`,
`/admin/system`, `/admin/companies/[slug]/quality`.

## Not executable in this environment (checklists provided)

Tasks requiring live infrastructure are documented as executable
checklists in the launch docs: backup verification/restore drill
(77–78), preview deployment (83), production deploy config (84),
auth/judge/ingestion production smoke tests (123–125), final mobile/
desktop E2E (127–128), migration rehearsal (130), content bootstrap
targets (107). Browser QA and analytics provider wiring are
provider/environment-specific; the code hooks and policies are in place.

## Known limitations

See `docs/technical-debt.md`: single-instance rate limiter, inline parse
jobs, request-time role analytics, CSP still allows inline scripts.

## Post-launch

Per the plan: use real usage data to choose Week 9+ (knowledge progress /
spaced repetition, semantic bilingual search, company comparison, judge
scaling) instead of expanding scope automatically.
