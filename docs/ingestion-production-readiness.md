# Ingestion production readiness (Week 8 Task 62)

P0 posture from the Week 6 build, re-verified:

- **Keys**: server-only via env; never logged (redaction policy).
- **Prompt injection**: user content delimited by BEGIN/END markers; strict
  Zod output validation regardless of model output.
- **PII**: contact info redacted *before* any provider call; moderation flags
  store counts, never content.
- **Size/rate/retry/idempotency**: 50–50k chars, 5/h/user, max 3 attempts,
  idempotent draft resets, publish idempotent via unique
  `interviews.source_submission_id`.
- **Cost guardrails (Task 63)**: input capped at 50k chars, temperature 0 +
  bounded output schema, retry cap, `FLAG_LLM_INGESTION=off` hard pause
  (parser falls back to the deterministic mock), per-job token/cost usage
  recorded on `ingestion_jobs`.
- **Human review**: LLM output can never publish directly; reviewer actions
  are the only path (audited in `ingestion_events`).
- **Monitoring (Task 98)**: stuck-job detection via `/admin` dashboard +
  `scripts/recover-stuck-jobs.ts` (dry-run default, conservative).

Remaining known limitation: parse runs inline in the request path (documented
in `docs/ingestion-worker.md`); acceptable at V1 volume.
