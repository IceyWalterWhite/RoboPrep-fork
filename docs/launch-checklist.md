# Launch checklist (Week 8 Task 119)

## Code / DB
- [x] `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm exec next build --webpack` green
- [x] Migrations `0001`–`0024` apply on a fresh DB (`supabase db reset`)
- [ ] `supabase db push` reviewed + executed against production (Task 130 rehearsal)
- [ ] `pnpm refresh:companies` after first production seed

## Security (Task 137 sign-off)
- [x] RLS audit (docs/rls-audit.md), secret audit (docs/week8-secret-audit.md)
- [x] Security headers (next.config.ts) + CSP documentation (docs/csp.md)
- [x] Feature flags for judge/ingestion (Task 5)
- [ ] Production auth smoke test (Task 123: signup/reset/signout/callback URLs)
- [ ] Judge smoke test with a test account (Task 124: run, correct, wrong)
- [ ] Ingestion smoke test with a controlled submission (Task 125)

## Content
- [x] Development seed labeled `source_type = "development"` (Task 106 policy)
- [ ] Production content targets met (Task 107: content-launch-target guidance)
- [ ] Content quality spot audit (Task 108)

## SEO / Analytics / Monitoring
- [x] robots.ts, sitemap.ts, metadata/canonical/OG (Tasks 16–23)
- [ ] Domain + `NEXT_PUBLIC_SITE_URL` set; verify canonical URLs in production
- [ ] Analytics + error tracking providers configured (Tasks 11, 14)
- [ ] Uptime monitors on `/` and `/api/health` (Task 97)

## Ops / Legal
- [x] Backup policy + restore runbook (docs/backup-recovery.md)
- [ ] Backup verification + restore drill on staging (Tasks 77, 78)
- [x] Privacy / Terms / Content policy pages (Tasks 89–91)
- [x] Rollback plan + incident runbook + launch-day runbook
- [ ] Preview deployment validated (Task 83), production deploy (Task 84)

## QA
- [ ] Mobile E2E (Task 127), desktop E2E (Task 128) on the deployed URL
- [ ] `node --experimental-strip-types scripts/production-smoke-test.ts <prod-url>` all green
