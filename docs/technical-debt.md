# Technical debt register (Week 8 Task 136)

## P1 (address first post-launch)

| Item | Why it exists | Trigger to fix |
| --- | --- | --- |
| Single-instance in-process rate limiter | MVP scale; no Redis dependency | Before scaling past one app instance |
| Ingestion parse runs inline in request | Volume is low; queue is over-engineering for V1 | Submissions > ~50/day or p95 submit > 5 s |
| Role-scoped analytics computed on request | Role pairs are small; avoids a second cache family | Any role page > ~500 ms in production |
| No automated restore drill | Requires live infra | Run once at launch, then quarterly |

## P2

- CSP nonce pipeline to drop `unsafe-inline`/`unsafe-eval`.
- Comparison UI on `compareCompanies`; trends route if detail gets dense.
- Bilingual semantic search beyond alias tables.
- OG image variants per section.

## Intentional MVP limitations (not debt)

- No GPU judge, no leaderboards, no AI code generation (product decisions).
- Synchronous judge calls (bounded by provider timeouts).
- Development seed labeled but not filtered by a runtime flag (policy documented; enforce when real data coexists with seed on one project).
