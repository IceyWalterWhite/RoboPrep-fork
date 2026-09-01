# Week 6 status — Interview Submission + Content Ingestion Pipeline

Date: 2026-09-02

Week 6 makes RoboPrep capable of growing from new interview data instead of
manually seeded content:

```text
User submission → Raw record → Parse (LLM/mock) → Parsed draft
→ Canonical suggestions → Topic suggestions → Duplicate flags
→ Human review → Publish → /interviews + Knowledge provenance
```

LLM output never publishes anything directly; reviewer decisions are
authoritative.

## Implemented

- Submission form (`/interviews/submit`, auth required, Zod-validated,
  50–50k chars, 5/hour/user rate limit) storing immutable raw records only.
- Submission status page (`/interviews/submissions/[id]`) with friendly state
  mapping (Received / Processing / Under review / Published / Needs attention /
  Not published) — internal error codes never reach users.
- Ingestion service layer (`src/lib/ingestion/`): submissions, jobs, drafts,
  events, review tasks, retry, publish — centralized state transitions with a
  validated state machine.
- Parser provider abstraction with a deterministic mock parser (CI/dev) and an
  OpenAI-compatible HTTP adapter; versioned, injection-delimited prompt; strict
  Zod output schema; provider failures mapped to safe, retryable-classified
  error codes; optional token/cost tracking per job.
- Canonicalization: candidate retrieval + deterministic weighted scoring
  (0.45 text / 0.25 keyword / 0.20 topic / 0.10 type), strong/possible/weak
  bands, reviewer-authoritative accept/choose/create-new/reject actions.
- Company matching (exact/slug/alias/fuzzy, no auto-create), topic suggestion
  over the existing taxonomy (no free-form topic creation), duplicate
  interview detection with human-readable reasons, duplicate question
  collapsing, coding-vs-knowledge detection, interview emphasis
  classification from structured counts.
- Admin review queue + detail + publication preview (`/admin/interviews/…`),
  server-guarded by `profiles.role` (user/reviewer/admin), plain-form server
  actions (keyboard accessible), PII/spam moderation flags, event timeline,
  job history with retry.
- Publish transaction (Postgres RPC) creating interviews/rounds/questions/
  topic links + question_stats refresh in one atomic operation, with
  idempotency enforced by a unique `interviews.source_submission_id` index.
- Offline unit tests (20 ingestion-logic tests), DB integrity script
  (`check:ingestion`), mock-parser pipeline smoke test (`test:ingestion`),
  optional live parser test (`test:live-parser`).

## Database migrations

- `0017_interview_submissions.sql` — raw submissions (status lifecycle,
  moderation flags, size constraints).
- `0018_interview_submission_rls.sql` — insert/select own only; no
  update/delete for users; anonymous denied.
- `0019_interview_drafts.sql` — draft / round draft / question draft tables
  (one draft per submission, original wording required, optional canonical
  links + topic suggestions + new-canonical payloads).
- `0020_ingestion_jobs.sql` — jobs (attempts, provider metadata, token/cost)
  + append-only event log.
- `0021_review_tasks.sql` — review tasks, `profiles.role`, and
  `interviews.source_submission_id` with a unique partial index (publish
  idempotency at the DB level).
- `0022_ingestion_rls_publish.sql` — RLS (no public policies) on all Week 6
  tables + the `publish_interview_draft` security-definer transaction.

## Submission flow

```text
POST /api/interviews/submit (auth, rate limit, Zod, size/URL checks)
→ raw row (status submitted) → enqueue parse job → server-triggered run
→ draft + rounds + question drafts → status parsed → review queue
```

## Parser architecture

`InterviewParserWithUsage` implementations behind `createParser()`; mock
parser is rule-based and deterministic; the LLM adapter uses temperature 0,
JSON mode, the BEGIN/END INTERVIEW CONTENT delimiters, and schema validation
of everything it returns. Provider selection and keys are server-only.

## Canonicalization approach

Postgres retrieval + in-process deterministic scoring (no vector DB).
Suggestions are reviewer aids; new canonical questions are created
minimal-first from the occurrence and enriched later in Knowledge.

## Review workflow

Queue filters (open / in review / failed / published / rejected), deterministic
priority, moderation flags, dense list without raw text. Detail: raw + parsed
side by side, metadata/round/question editing (audited), canonical suggestions
with scores, duplicate warning, jobs, events, approve/reject/block/return,
publish with company resolution. Preview reuses production interview
components with `noindex`.

## Publish workflow

Single SQL transaction; validation gate (company resolved, ≥1 accepted
question, valid year, approved draft); idempotent double-publish; published
graph preserves original wording and canonical links; question_stats
refreshed; provenance back to the submission.

## Verification

```bash
pnpm test            # 44/44 (20 Week 6 ingestion-logic tests included)
pnpm typecheck       # clean
pnpm lint            # 0 errors
pnpm exec next build --webpack   # all routes, incl. /admin + /interviews/submit
pnpm check:ingestion && pnpm test:ingestion   # need a reachable Supabase (migrations 0017–0022 applied)
pnpm test:live-parser # optional; no-op without INGESTION_LLM_*
```

Docker/Supabase is not reachable in this environment (same as the Week 5
audit), so DB-dependent checks are documented for a configured environment;
all offline checks pass. Offline coverage includes the parser schema, state
transitions, company matching, canonical scoring, duplicate scoring, topic
taxonomy enforcement, redaction, confidence thresholds, and prompt-injection
delimiting.

## Security/privacy

- Raw submissions immutable; user RLS own-rows only; Week 6 tables
  service-role-only.
- LLM keys server-only; PII redaction before any provider call; moderation
  flags store counts, never content.
- Published pages expose no submitter identity, no moderation notes, no raw
  text; source URLs validated to http(s) at intake.
- `/admin` 404s for non-reviewers; every server action re-checks role.

## Known limitations

- Parse runs inline in the request path; no staleness sweep for jobs stuck
  `running` after a crash (manual retry recovers). See
  [`docs/ingestion-worker.md`](./ingestion-worker.md).
- Canonical matching is lexical, not semantic; thresholds are reviewer aids
  and intentionally conservative.
- Duplicate merge is reject-as-duplicate or per-question acceptance into the
  next draft; no automated merge into an existing interview graph.
- The in-process rate limiter is single-instance only.

## Deferred to Week 7

- Company Intelligence: company pages, role breakdown, most-asked topics,
  question frequency, season comparison, trending questions, coding vs
  research emphasis, difficulty, recent interview feed — built on the
  structured interview/question graph from Weeks 2, 3, and 6.
