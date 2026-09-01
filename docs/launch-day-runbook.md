# Launch-day runbook (Week 8 Task 131)

Execute in order; stop on any red step.

1. `supabase db push` (or rehearsed migration apply) against production.
2. `pnpm refresh:companies` (stats caches) — verify `/admin` freshness card.
3. Set production env: `NEXT_PUBLIC_SITE_URL`, Supabase keys, judge provider,
   `INGESTION_LLM_*`, feature flags on, `FLAG_ROBOTS_INDEX` unset.
4. Deploy the production build; verify hosting rollback target exists.
5. Health: `GET /api/health` → ok; uptime monitors green.
6. Smoke: `node --experimental-strip-types scripts/production-smoke-test.ts <prod-url>` all green.
7. Auth spot check (Task 123): signup → confirmation email (production links,
   no localhost) → sign in → sign out → password reset.
8. Judge spot check (Task 124): run + correct submit + wrong submit on the
   designated test problem; verify statuses and no hidden-test leakage.
9. Ingestion spot check (Task 125): controlled submission → parse → review →
   publish; provider usage recorded on the job.
10. Company stats (Task 126): publish refresh reflected on the company page.
11. Verify `/sitemap.xml`, `/robots.txt`, canonical URLs on the real domain.
12. Announce. Watch `/admin` + error tracking for the first hour.
