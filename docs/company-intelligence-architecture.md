# Company intelligence architecture

Week 7 turns the structured Interview + Knowledge + Coding graph into
company-specific preparation intelligence.

```text
Published Interview Graph (source of truth)
         │
         ▼
refresh_company_stats()  — SQL, set-based, idempotent
         │
         ├── company_stats              (summary counts)
         ├── company_position_stats     (role counts)
         ├── company_topic_stats        (topic share + trend)
         ├── company_question_stats     (canonical question frequency)
         ├── company_coding_problem_stats
         ├── company_season_stats       (year × season)
         ├── company_difficulty_stats   (distribution + 1–3 average)
         └── company_round_type_stats   (structure)
                 │
                 ▼
        src/lib/companies query layer
        (queries / intelligence / helpers / filters / mappers)
                 │
                 ▼
        Company pages + preparation guidance
```

## Source tables

`companies`, `positions`, `interviews (status = 'published')`,
`interview_rounds`, `interview_questions` (occurrences),
`questions` (canonical knowledge), `coding_problems` (canonical coding),
`topics` + `question_topics`.

## Cache tables

Migration `0023_company_intelligence.sql` creates the eight caches. All:

- derive exclusively from published interviews (Task 63),
- are replaced wholesale per company on refresh (idempotent),
- carry `updated_at` timestamps,
- have RLS with public `select` only; writes happen only via the
  security-definer refresh function.

Role-scoped topic/question/coding/difficulty/season analytics (Task 22) are
computed on demand from the published graph (`getRoleIntelligence`) instead
of per-role cache rows — role pairs are small and this avoids a second cache
family to keep in sync.

## Refresh triggers

1. **DB trigger** (`refresh_company_stats_after_publish`) — after insert or
   status update on `interviews`, the company's cache is refreshed. This is
   the primary Week 6 → Week 7 hook (Task 13, Flow H).
2. **Application call** — the Week 6 publish service also invokes
   `refreshCompanyStats(companyId)` best-effort; both paths are idempotent
   and a failure is recoverable by re-running.
3. **Full rebuild** — `pnpm refresh:companies [companySlug]` recomputes one
   or all companies (Task 12).

The refresh function is a single SQL `plpgsql` routine: it deletes the
target companies' cache rows, then re-inserts from set-based aggregates of
the published graph. Running twice yields identical rows.

## Metric definitions

See [`docs/company-metrics.md`](./company-metrics.md). Implementation lives
in `src/lib/companies/helpers.ts` (pure, offline-tested) and the SQL refresh.

## Limited-sample policy

Centralized in `src/lib/companies/constants.ts` +
`sampleBand()`:

- n < 3 → "Limited data"; percentages suppressed across all components.
- 3–9 → counts primary.
- ≥ 10 → percentage may lead.
- Trend lists require ≥ 3 total occurrences; emerging requires ≥ 2 recent
  occurrences and |trend| ≥ 0.25; declining requires evidence on both sides
  of the 90-day window.

Role pages fall back to company-wide statistics (labeled, never silent)
below 3 role interviews.

## Query layer

`src/lib/companies/` is the only place that reads company analytics:

- `queries.ts` — batched reads (directory, stats, top lists, emphasis,
  structure, seasons, recent feed, role intelligence). No N+1: the company
  detail page issues ~11 fixed queries regardless of data size; related
  entity names are fetched with one `in` query per entity type and stitched
  in-process.
- `intelligence.ts` — pure ranking/orchestration (guide, trends, recent
  changes, compare helper); importable offline for tests.
- `helpers.ts` — pure metric functions (sample bands, trend score,
  medians, guide scores).
- `filters.ts` — URL-driven directory search/filter parsing with safe
  fallbacks.
- `mappers.ts` — cache rows → presentation types.
- `refresh.ts` — incremental refresh wrapper (service-role).

## Routes

```text
/companies                          directory (search + real-data filters)
/companies/[slug]                   company detail
/companies/[slug]/prepare           suggested study set
/companies/[slug]/roles/[positionSlug]  role-specific intelligence
/admin/companies/[slug]/quality     admin-only data-quality snapshot
```

Connected: `/interviews?company=…`, `/knowledge?company=…&position=…`,
`/coding?company=…&position=…` (company/position validated, evidence-backed
only).

## Verification

```bash
pnpm test               # offline unit tests incl. company-logic (14)
pnpm check:companies    # cache integrity (needs reachable Supabase)
pnpm test:companies     # end-to-end fixture smoke test (needs Supabase)
pnpm refresh:companies  # full cache rebuild (needs Supabase)
```

The smoke test builds a fixture company with three published interviews and
known distributions, refreshes, verifies top topic/question/coding
share/season grouping, publishes one more interview, verifies the
incremental refresh, then deletes the fixture.
