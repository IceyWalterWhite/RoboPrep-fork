# Week 7 status — Company Intelligence MVP

Date: 2026-09-02

Week 7 turns the structured Interview + Knowledge + Coding graph into
company-specific preparation intelligence, answering: *"If I am interviewing
for this company and role, what should I prepare first?"* — always with the
sample size the answer is based on.

## Implemented

- Eight rebuildable company statistics caches (summary, roles, topics,
  knowledge questions, coding problems, seasons, difficulty, round types)
  recomputed by an idempotent, set-based SQL function
  (`refresh_company_stats`, migration `0023`).
- Refresh triggers: a DB trigger after publish (Week 6 → Week 7 hook), a
  best-effort service call in the Week 6 publish path, and a full-rebuild
  script (`pnpm refresh:companies`).
- Centralized query layer (`src/lib/companies/`): batched reads with no N+1,
  pure offline-testable metric helpers, URL-driven directory filters, and
  presentation mappers.
- Company directory (`/companies`) with case-insensitive search and
  real-data filters (has interviews / has coding evidence / recently active
  = published within 180 days). No prestige ranking.
- Company detail (`/companies/[slug]`) in preparation-first reading order:
  roles, most-asked topics/questions/coding problems, emphasis, structure,
  difficulty, season comparison, trends, recent changes, recent interviews,
  and a preparation guide. 404 for unknown slugs; honest empty states.
- Role-specific pages (`/companies/[slug]/roles/[positionSlug]`) with
  role-scoped stats computed from the published graph; wrong
  company/position combinations 404; explicit labeled fallback to
  company-wide stats below 3 role interviews.
- Preparation guide + study-set route (`/companies/[slug]/prepare`):
  deterministic ranking (0.5 share + 0.3 trend + 0.2 role relevance for
  topics; 0.6 frequency + 0.3 trend + 0.1 recency for questions/coding),
  direct links into Knowledge/Coding, limited-data fallback.
- Evidence-based copy throughout ("appeared in 7 of 18 published interview
  records"), sample-size notes on every metric, conservative trend rules
  (no single-record overclaims).
- Company/position filters wired into `/coding` and `/knowledge` query
  layers (evidence-backed canonical links only, position validated against
  the company).
- Admin-only data-quality view (`/admin/companies/[slug]/quality`) with
  unlinked-occurrence rate, source mix, role/season coverage, and an
  internal confidence score (not exposed publicly).
- Offline unit tests (14 company-logic tests), DB integrity script
  (`check:companies`), end-to-end fixture smoke test (`test:companies`).

## Routes

```text
/companies
/companies?q=…&filter=…
/companies/[slug]
/companies/[slug]/prepare
/companies/[slug]/roles/[positionSlug]
/admin/companies/[slug]/quality        (admin-guarded, noindex)
/interviews?company=…   /knowledge?company=…&position=…   /coding?company=…&position=…
```

Optional routes from the plan were skipped deliberately: no `/trends` route
(detail page is not dense enough to justify fragmenting) and no
`/companies/compare` UI (only the pure `compareCompanies` helper exists for
future use). No sitemap exists yet, so sitemap integration is deferred to
Week 8 productization; the homepage already shows real latest interviews.

## Database migrations

- `0023_company_intelligence.sql` — eight cache tables (composite primary
  keys, FK cascades, share constraints), `refresh_company_stats(p_company_id)`
  security-definer refresh function, publish trigger, RLS with public read
  only.

## Stats caches

All eight caches are rebuildable accelerators, never truth sources. The
refresh deletes and re-inserts per company, so re-running produces identical
rows. Cache reads are public aggregates; writes are service-role/definer
only.

## Metric definitions

Documented in [`docs/company-metrics.md`](./company-metrics.md): topic share
(denominator = published interviews), question frequency (occurrence vs
distinct-interview counts), coding share (unclassified occurrences in the
denominator), difficulty distribution (unknown excluded from the 1–3
average), round-type share (denominator = published rounds), medians for
structure, season normalization ('fall' → 'autumn'; missing year/season
excluded), volume-normalized trend score, emerging/declining thresholds, and
the sample-size policy (n < 3 limited / 3–9 counts / ≥ 10 percentage).

## Sample-size policy

Centralized in `src/lib/companies/constants.ts` and `sampleBand()`, applied
by every component via `SampleSizeNote`; trend lists require ≥ 3 occurrences,
emerging requires ≥ 2 recent occurrences plus a ≥ 0.25 trend.

## Company page architecture

See [`docs/company-intelligence-architecture.md`](./company-intelligence-architecture.md)
for the source tables, cache tables, refresh triggers, and query layer.

## Role-specific intelligence

Role pages reuse the shared components and analytics service; role-scoped
topics/questions/coding/difficulty/seasons are computed from the published
graph for the company+position pair, and the preparation guide falls back to
company-wide stats with an explicit label below 3 role interviews.

## Verification

```bash
pnpm test            # 58/58 (14 company-logic tests included)
pnpm typecheck       # clean
pnpm lint            # 0 errors
pnpm exec next build --webpack   # all routes incl. /companies/* + admin quality
pnpm check:companies && pnpm test:companies && pnpm refresh:companies
                     # need a reachable Supabase with migration 0023 applied
```

As in Weeks 5–6, Docker/Supabase is not reachable in this environment, so
the DB-dependent scripts are written, wired into package.json, and
documented; all offline checks pass.

## Known limitations

- Caches update on publish and via script; direct edits to published
  interviews (outside the ingestion pipeline) require a manual
  `refresh:companies`.
- Role-scoped stats are computed at request time from the graph (fine at
  current scale, no caching layer yet).
- Trend windows are fixed at 90 days; season comparison is table-based with
  no charts by design.
- Development-seed interviews are labeled `source_type = "development"`;
  production analytics should exclude them when real data lands (policy
  documented, not yet enforced by a flag).

## Deferred to Week 8

- Productization + launch: SEO/sitemap, performance, error tracking,
  security review, moderation/mobile polish, landing page refinement,
  onboarding, production deployment, backup/recovery, privacy/terms pages.
