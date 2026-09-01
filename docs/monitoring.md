# Monitoring (Week 8 Tasks 97, 98)

## Uptime monitors (minimum)

| Monitor | Target | Alert |
| --- | --- | --- |
| Homepage | `GET /` → 200 | 2 consecutive failures within 5 min |
| Health | `GET /api/health` → 200 `{"status":"ok"}` | any failure > 1 min |

## Application health signals (in-product)

- `/admin` dashboard: open reviews, failed jobs, stuck jobs (>30 min
  `running`), company-stats freshness.
- Background jobs (Task 98): failed ingestion jobs + stuck `running` jobs
  surface in the dashboard; `scripts/recover-stuck-jobs.ts` (dry-run first)
  recovers them conservatively — it never auto-publishes.
- Long judge runs: provider-side timeout metrics; judge failures counted per
  submission status in `coding_submissions`.
- Error tracking (Task 11): client + server errors, scrubbed via
  `src/lib/security/redact.ts`; alert on any new error class above 5/minute.

## Log retention (Task 101)

JSON-line logs carry `event`, `level`, `requestId`, route/job ids, and
scrubbed metadata only. Raw interview text, source code, hidden tests,
tokens, and provider payloads are never logged (enforced by
`redactMetadata`). Platform log retention: 14–30 days per hosting plan.
