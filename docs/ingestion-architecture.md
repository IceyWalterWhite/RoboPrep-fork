# Ingestion architecture

Week 6: Interview Submission + Content Ingestion Pipeline.

The pipeline distinguishes — and never collapses — four concepts:

```text
Raw Submission  ≠  Parsed Draft  ≠  Canonical Question  ≠  Published Interview
```

## Entities

| Table | Purpose | Access |
| --- | --- | --- |
| `interview_submissions` | Immutable raw experience text + submitter hints + pipeline status | User: own rows via RLS. Reviewers: service-role only |
| `interview_drafts` | One parsed draft per submission (`submission_id` unique); editable before publish | Service-role only |
| `interview_round_drafts` | Extracted rounds, deterministic `order_index` | Service-role only |
| `interview_question_drafts` | Extracted occurrences; original wording always preserved; optional canonical match, topic suggestions, per-question review state | Service-role only |
| `ingestion_jobs` | Job tracking (`parse_interview`, …), attempts, provider metadata, token/cost usage | Service-role only |
| `ingestion_events` | Append-only audit timeline (`submission_created`, `parse_started`, `publish_succeeded`, …) | Service-role only |
| `review_tasks` | Review ownership/status, duplicate score, priority — separate from job status | Service-role only |
| `interviews` (+`source_submission_id`) | Published canonical graph with provenance back to the raw submission | Public (published only) |

All Week 6 tables have RLS enabled with **no public policies**; every read and
write goes through `src/lib/ingestion/queries.ts` behind the service-role
client, which is server-only.

## State machine

```text
submitted → processing → parsed → needs_review → approved → published
     \         \                          \
      → rejected (terminal)                → rejected
       → failed → processing (retry)       → blocked (review task only)
```

Transitions are validated against `SUBMISSION_TRANSITIONS`
(`src/lib/ingestion/constants.ts`) in the ingestion service; an invalid
transition raises instead of silently corrupting state.

## Job flow

```text
POST /api/interviews/submit (auth, rate limit 5/h, 50–50k chars, Zod)
→ createSubmission          (raw text stored; size/URL validated)
→ enqueueParseJob           (ingestion_jobs row, queued)
→ runParseJob               (server-triggered worker)
     mark running
     redact contact info from raw text (PII never reaches the provider)
     InterviewParser.parseWithUsage()
     strict Zod validation  → invalid output = schema_mismatch (retryable-aware)
     persist draft + rounds + question drafts (idempotent re-create)
     moderation flags stored privately on the submission
     mark succeeded; submission → parsed; review task opened
```

Failures map to safe error codes (`rate_limited`, `timeout`, `invalid_json`,
`empty_response`, `provider_outage`, `schema_mismatch`); retryable codes are
classified in `errors.ts`. Retries respect `max_attempts`, append events, and
never create duplicate draft graphs (the existing draft is reset in place and
archived rather than duplicated — `runParseJob`).

## Parser contract

```ts
interface InterviewParserWithUsage {
  provider: string;
  model: string;
  parseWithUsage(input: ParseInterviewInput): Promise<ParserResult>;
}
```

- `MockInterviewParser` — deterministic rule-based extraction for CI/dev.
- `OpenAICompatibleParser` — HTTP adapter for OpenAI-compatible endpoints;
  temperature 0, JSON response format, versioned prompt
  (`parser/prompts.ts`, `PARSER_PROMPT_VERSION`).

Provider selection is server-only via `INGESTION_LLM_PROVIDER` /
`INGESTION_LLM_MODEL` / `INGESTION_LLM_API_KEY` / `INGESTION_LLM_BASE_URL`.
Missing configuration degrades cleanly to the mock parser.

### Prompt-injection mitigation

User content is delimited data:

```text
BEGIN INTERVIEW CONTENT
…user text…
END INTERVIEW CONTENT
```

The system prompt states the content is untrusted and must not override
instructions; the output schema is enforced by Zod regardless of what the
model returns.

## Canonicalization

Suggestions, never auto-links:

1. Retrieve candidates: published canonical questions with their topic links
   (Postgres only — no vector DB).
2. Score deterministically
   (`src/lib/ingestion/matching/question-candidates.ts`):
   `0.45 × textSimilarity (bigram Dice) + 0.25 × keywordOverlap (token
   Jaccard) + 0.20 × topicOverlap (Jaccard) + 0.10 × questionTypeMatch`,
   clamped to [0, 1].
3. Bands (`confidence.ts`): ≥ 0.90 strong, 0.70–0.90 possible, < 0.70 weak
   (filtered from suggestions).
4. The reviewer accepts a match, picks another, drafts a new canonical
   (minimal-first: title/slug/type/summary/topic ids stored on the question
   draft), or rejects the occurrence. Original wording is immutable.

Parser confidence bands (≥ 0.85 high, 0.60–0.85 medium, < 0.60 low) affect
review highlighting and queue priority only — confidence never auto-publishes.

## Duplicates

- Interview level (`matching/interview-duplicates.ts`): same source URL, same
  company+position+year, raw-text bigram similarity, question-set overlap.
  Candidates + reasons surface in the review queue/detail; duplicates are
  flagged, never auto-deleted.
- Question level (`normalize.ts::groupDuplicateWording`): repeated mentions
  inside one submission normalize to the same key and collapse at publish
  time; distinct follow-ups are preserved.

## Review process

- `/admin` is server-guarded by `profiles.role` (`user` | `reviewer` |
  `admin`) — centralized in `src/lib/auth/reviewer.ts`. Non-reviewers get 404.
- Queue (`/admin/interviews/review`): dense list, no raw text, deterministic
  priority (recency + confidence + duplicate risk + failure).
- Detail (`/admin/interviews/review/[id]`): raw + parsed side by side,
  metadata/round/question editing (audited via `draft_edited` events),
  per-question canonical decisions, duplicate warning, job history, event
  timeline. Plain `<form>` server actions keep every action keyboard
  accessible.
- Preview (`/admin/interviews/review/[id]/preview`): production interview
  components rendering draft data; `noindex`.

## Publish transaction

`publish_interview_draft(p_draft_id, p_company_id, p_position_id, p_slug)`
(migration `0022`, security definer, execute revoked from public/anon/authenticated)
performs everything in one SQL transaction:

```text
gate: draft approved, company resolved, ≥1 accepted question, valid year
→ insert interviews (status published, source_submission_id provenance,
  is_anonymous true, unique slug)
→ insert interview_rounds
→ insert interview_questions (original wording preserved; canonical links
  from accepted matches; new canonical questions + topic links created from
  the reviewer's draft; repeated canonical links collapse)
→ refresh question_stats for affected questions
→ update draft (status published, published_interview_id)
→ update submission (status published)
→ complete review task; append publish_succeeded event
```

Idempotency: `interview_drafts.published_interview_id` plus a unique index on
`interviews.source_submission_id` — publishing twice returns the existing
interview instead of duplicating rows.

## Security & privacy

- LLM keys are server-only (`serverEnv` / env parsing); nothing is logged.
- The runner/provider payload contains redacted text only.
- Public pages expose no submitter identity, no moderation notes, no raw
  submission; source URLs render only http(s) links validated at intake
  (`javascript:`/`data:` rejected).
- Draft/rejected submissions never affect public stats.
- Integrity: `pnpm check:ingestion` (read-only, non-zero exit on violation);
  unit tests in `scripts/tests/ingestion-logic.test.mjs`; pipeline smoke test
  `pnpm test:ingestion` (requires DB).
