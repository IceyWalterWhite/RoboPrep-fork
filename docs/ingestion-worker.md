# Ingestion worker strategy

## MVP choice: server-triggered execution

Week 6 deliberately does **not** introduce Kafka/Celery/Temporal or a separate
worker process. Jobs are executed when triggered by trusted server code:

```text
POST /api/interviews/submit
  → createSubmission
  → enqueueParseJob        (ingestion_jobs row: queued)
  → runParseJob            (same request; mark running → parse → persist → succeeded)
```

Admin retries use the same primitives:

```text
/admin/interviews/review/[id]
  → Retry parse            (retryParseJob: attempt_count + 1, max_attempts enforced)
  → Reparse (new job)      (enqueueParseJob + runParseJob)
```

## Why this is acceptable for the MVP

- Submission volume is low (human-curated content platform).
- The parse path is already failure-isolated: a failed parse marks the job
  `failed` and the submission `failed` — the user's raw submission is intact
  and a reviewer can retry at any time.
- Everything is auditable through `ingestion_jobs` + `ingestion_events`.

## Retry behavior

| Aspect | Behavior |
| --- | --- |
| Attempt tracking | `attempt_count` increments per run; `max_attempts` (default 3) enforced |
| Idempotency | Re-running a parse resets the existing draft graph in place; it never duplicates drafts |
| Retryable errors | `rate_limited`, `timeout`, `provider_outage` (classified in `errors.ts`) |
| Non-retryable | `invalid_json`, `empty_response`, `schema_mismatch`, `size_limit` — need human/data fixes |
| Failure state | Job gets `error_code`/`error_message`; submission → `failed`; reviewer can retry or reparse |

## Production limitations (documented, deliberate)

- Parse work runs inside the Next.js server request path. A long provider
  timeout can hold a request slot; the HTTP adapter's own timeout (60 s
  default) bounds this.
- The in-process rate limiter is per-instance; a multi-instance deployment
  needs a shared limiter (e.g. Redis) before scaling submissions.
- No scheduled pickup of stale `queued`/`running` jobs — if the server dies
  mid-parse the job stays `running`. Recovery is a manual "Retry parse" in the
  review detail. A future version should add a staleness sweep.

## Upgrade path

When volume justifies it: replace the inline `runParseJob` call with a queue
push and run the same service functions in a standalone worker
(`runParseJob` is already a standalone function operating on job IDs). No
pipeline code changes are required — only the trigger moves.
