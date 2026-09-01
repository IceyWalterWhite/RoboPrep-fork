# Incident runbook (Week 8 Task 79)

Symptom → action. Every "disable" refers to feature flags (`FLAG_*` env vars
on the hosting platform, then redeploy/restart — no code change).

## 500 spike / bad deploy
1. Check error tracking + `pnpm` deploy logs (correlate via `x-request-id`).
2. Roll back to the previous deployment (hosting rollback).
3. If caused by a schema change, see "bad migration".

## Judge outage or abuse
1. `FLAG_CODING_JUDGE=off` → users see a friendly judge-offline state;
   browsing is unaffected.
2. Inspect judge provider dashboard; rotate `JUDGE0_API_KEY` if leaked.

## LLM cost spike / provider outage
1. `FLAG_LLM_INGESTION=off` → parser falls back to the mock parser; the
   review pipeline keeps working.
2. If provider is down, submissions stay `submitted`/`failed` — reviewers
   retry from `/admin/interviews/review` after recovery.

## Spam submissions
1. `FLAG_INTERVIEW_SUBMISSION=off` (temporarily pauses user submissions).
2. Reject spam from the review queue (audited).

## DB corruption / accidental mass publish
1. Freeze writes (maintenance mode on the host).
2. Restore per `docs/backup-recovery.md` into a fresh project.
3. Accidental publish: unpublish via review detail (reject) — never edit rows
   by hand; events keep the audit trail.

## Privacy report (content removal)
1. Locate the interview via `/admin/audit` or the report entity id.
2. Reject/unpublish from the review detail; raw submission stays immutable.
3. Respond to the reporter through the feedback channel.

## Bad migration
1. Stop deploys. Check `supabase migration list`.
2. If additive: roll forward with a fix-up migration.
3. If destructive/broken: restore from backup into a new project (above).
