# RoboPrep — Week 6 Codex Implementation Tasks

> Goal: build the complete **Interview Submission + Content Ingestion Pipeline MVP**.
>
> Week 6 should make RoboPrep capable of continuously growing from new interview data instead of relying on manually seeded content.
>
> Core pipeline:
>
> ```text
> User Submission
> → Raw Interview Record
> → Parse / Extract
> → Candidate Questions
> → Canonicalization
> → Topic Classification
> → Duplicate Detection
> → Human Review
> → Publish
> ```
>
> The system must preserve provenance and distinguish:
>
> ```text
> raw source
> parsed structure
> canonical entity
> published content
> ```
>
> Do not let LLM output directly publish content without review.

---

# Week 6 Definition of Done

By the end of Week 6, RoboPrep should support:

```text
authenticated user
→ submit an interview experience
→ raw submission stored safely
→ ingestion job created
→ interview metadata parsed
→ rounds extracted
→ questions extracted
→ candidate canonical question matches suggested
→ topics suggested
→ duplicates flagged
→ admin/reviewer opens review queue
→ edits / accepts / rejects parsed content
→ publishes interview
→ published interview appears in /interviews
→ Knowledge provenance updates
```

The ingestion system should make this distinction explicit:

```text
Raw Submission
      │
      ▼
Parsed Draft
      │
      ▼
Reviewed Structured Interview
      │
      ▼
Published Interview
```

Week 6 must prioritize:

```text
data integrity
provenance
human-in-the-loop review
idempotency
safe LLM usage
auditable state transitions
```

over automation speed.

---

# Week 6 Scope

Implement:

```text
Interview submission form
Raw submission storage
Submission status tracking
Ingestion job model
LLM extraction adapter
Structured parser schema
Round extraction
Question extraction
Canonical question matching
Duplicate detection
Topic suggestion
Source provenance
Admin review queue
Review detail page
Accept / edit / reject
Publish workflow
Moderation notes
Ingestion retry
Ingestion logs
Data integrity checks
```

Do not implement:

```text
automatic public publishing without review
community voting
comments
full moderation team roles
complex workflow engine
vector database if simple matching works
web-scale scraping
automatic crawling of external platforms
resume / referral features
AI mock interview
```

---

# Task 1 — Submission Schema

## Goal

Add a first-class raw interview submission entity.

Create migration:

```text
supabase/migrations/0012_interview_submissions.sql
```

Create table:

```text
interview_submissions
```

Fields:

```text
id uuid primary key
user_id uuid
submission_type text not null
raw_text text not null
source_url text
company_hint text
position_hint text
year_hint integer
season_hint text
location_hint text
language text default 'zh-CN'
status text not null default 'submitted'
created_at timestamptz
updated_at timestamptz
processed_at timestamptz
```

Initial `submission_type` values:

```text
user_text
public_source
editorial
development
```

Initial status values:

```text
submitted
processing
parsed
needs_review
approved
rejected
failed
published
```

## Acceptance Criteria

- Raw text is preserved exactly
- Submission status is separate from published interview status
- User ID may be nullable for editorial/public-source ingestion
- Source URL optional
- Migration succeeds on Week 5 DB

## Do Not

- Do not overwrite raw text with parsed content
- Do not directly insert into `interviews` from the client form

---

# Task 2 — Submission RLS

## Goal

Secure user submissions.

Create:

```text
supabase/migrations/0013_interview_submission_rls.sql
```

Rules:

Authenticated users may:

```text
create own submission
read own submission
```

Users may not:

```text
approve
publish
modify parsed admin fields
read other users' submissions
```

Reviewers/admin operations should happen through server-authorized routes.

## Acceptance Criteria

- User A cannot read User B submission
- Anonymous mutation denied
- Public users cannot read raw submissions
- Service-role remains server-only

---

# Task 3 — Parsed Interview Draft Schema

## Goal

Store machine-extracted structured drafts separately from canonical published data.

Create table:

```text
interview_drafts
```

Fields:

```text
id uuid primary key
submission_id uuid not null unique
company_name text
position_title text
year integer
season text
location text
employment_type text
experience_level text
summary text
confidence numeric
parser_version text
status text default 'parsed'
created_at timestamptz
updated_at timestamptz
```

Do not create a final `interviews` row until review/publish.

## Acceptance Criteria

- One active parsed draft per submission
- Parser output is editable before publish
- Draft confidence stored
- Submission raw text remains separate

---

# Task 4 — Parsed Round Draft Schema

## Goal

Represent extracted rounds before publication.

Create:

```text
interview_round_drafts
```

Fields:

```text
id uuid primary key
draft_id uuid not null
round_number integer
title text
round_type text
duration_minutes integer
interviewer_role text
summary text
confidence numeric
order_index integer
created_at timestamptz
updated_at timestamptz
```

## Acceptance Criteria

- Multiple rounds supported
- Ordering deterministic
- Missing round metadata allowed
- Draft rounds independent from published `interview_rounds`

---

# Task 5 — Parsed Question Draft Schema

## Goal

Represent extracted question occurrences before canonical linking.

Create:

```text
interview_question_drafts
```

Fields:

```text
id uuid primary key
draft_id uuid not null
round_draft_id uuid
original_wording text not null
normalized_text text
question_type text
difficulty text
candidate_question_id uuid
candidate_coding_problem_id uuid
match_confidence numeric
topic_suggestions jsonb
order_index integer
review_status text default 'pending'
review_notes text
created_at timestamptz
updated_at timestamptz
```

Initial review status:

```text
pending
accepted
edited
rejected
new_canonical
```

## Acceptance Criteria

- Original wording always preserved
- Canonical match is optional
- Coding problem match is optional
- Topic suggestions stored separately from final topic mapping
- Review state per question supported

---

# Task 6 — Ingestion Job Schema

## Goal

Track parsing jobs independently of submissions.

Create:

```text
ingestion_jobs
```

Fields:

```text
id uuid primary key
submission_id uuid not null
job_type text not null
status text not null
attempt_count integer default 0
max_attempts integer default 3
provider text
model text
parser_version text
error_code text
error_message text
started_at timestamptz
finished_at timestamptz
created_at timestamptz
updated_at timestamptz
```

Initial job type:

```text
parse_interview
canonicalize_questions
classify_topics
duplicate_check
```

Initial status:

```text
queued
running
succeeded
failed
cancelled
```

## Acceptance Criteria

- Jobs can be retried
- Error info retained
- Job history auditable
- Submission status is not overloaded to act as job log

---

# Task 7 — Ingestion Event Log

## Goal

Create an append-only ingestion audit log.

Create:

```text
ingestion_events
```

Fields:

```text
id uuid primary key
submission_id uuid not null
job_id uuid
event_type text not null
message text
metadata jsonb
created_at timestamptz
```

Example event types:

```text
submission_created
parse_started
parse_succeeded
parse_failed
canonicalization_started
review_opened
question_accepted
question_rejected
draft_edited
publish_started
publish_succeeded
publish_failed
```

## Acceptance Criteria

- Events append-only through application logic
- Useful metadata stored without secrets
- Admin can inspect event timeline later

---

# Task 8 — Ingestion Domain Types

## Goal

Create strong TypeScript domain types.

Create:

```text
src/types/ingestion.ts
```

Define:

```text
InterviewSubmission
InterviewDraft
InterviewRoundDraft
InterviewQuestionDraft
IngestionJob
IngestionEvent
ParsedInterviewPayload
ParsedRoundPayload
ParsedQuestionPayload
CanonicalMatchCandidate
TopicSuggestion
ReviewDecision
```

## Acceptance Criteria

- No `any`
- Draft types distinct from published Interview types
- Parser payload types serializable
- Provider raw response type not leaked into UI

---

# Task 9 — Submission Form Route

## Goal

Create user-facing submission route:

```text
/interviews/submit
```

Form fields:

```text
Company
Position
Year
Season
Location
Interview Experience
Source URL optional
```

The only required field besides auth should be:

```text
Interview Experience
```

Hints may be optional.

## Acceptance Criteria

- Auth required
- Form validates with Zod
- Large text input supported
- Clear success state
- Submission stored as raw data only

---

# Task 10 — Submission Form Component

## Goal

Build polished submission UI.

Create:

```text
src/components/interviews/submission-form.tsx
```

Suggested flow:

```text
Tell us about your interview

Company
Position
Season
Location

Interview experience
[large textarea]

Source URL (optional)

[Submit for Review]
```

Do not make form feel like a long enterprise CRM form.

## Acceptance Criteria

- Mobile friendly
- Field labels accessible
- Character count optional
- Error messages readable
- No auto-publication language

---

# Task 11 — Submission Confirmation Page

## Goal

After submit, show:

```text
/interviews/submissions/[id]
```

User-facing information:

```text
Submission received
Status
Submitted at
Processing state
```

Do not expose parser internals unless useful.

## Acceptance Criteria

- User can only access own submission
- Status updates visible
- Rejected/failed state explained safely

---

# Task 12 — Ingestion Service Abstraction

## Goal

Create an application service layer for ingestion.

Create:

```text
src/lib/ingestion/
├── service.ts
├── queries.ts
├── mappers.ts
├── constants.ts
└── errors.ts
```

Responsibilities:

```text
create submission
enqueue parse job
update status
persist draft
record events
retry failed job
publish reviewed draft
```

## Acceptance Criteria

- Page components do not directly orchestrate DB state transitions
- Ingestion business logic centralized
- State transitions validated

---

# Task 13 — Parser Provider Abstraction

## Goal

Create provider-independent parser interface.

Create:

```text
src/lib/ingestion/parser/
├── types.ts
├── service.ts
├── schema.ts
└── adapters/
```

Interface concept:

```ts
interface InterviewParser {
  parse(input: ParseInterviewInput): Promise<ParsedInterviewPayload>;
}
```

## Acceptance Criteria

- LLM provider-specific logic isolated
- Parser output must pass Zod validation
- Raw provider text not trusted

---

# Task 14 — Parser Output Schema

## Goal

Define strict structured parser output.

Create Zod schema covering:

```text
company
position
year
season
location
employment_type
experience_level
summary
rounds[]
questions[]
```

Question fields:

```text
original_wording
normalized_text
question_type
round_number
order_index
difficulty
topic_hints[]
```

## Acceptance Criteria

- Invalid provider output rejected
- Missing optional metadata tolerated
- Original wording required per extracted question
- Unknown values normalized

---

# Task 15 — LLM Parser Prompt

## Goal

Create deterministic parser prompt template.

Create:

```text
src/lib/ingestion/parser/prompts.ts
```

Prompt rules:

```text
extract only information present
do not invent company/role/year
preserve question wording
normalize structure
separate rounds
do not answer questions
do not create canonical IDs
return strict JSON
```

## Acceptance Criteria

- Prompt versioned
- Explicit anti-hallucination rules
- No user-facing answer generation

---

# Task 16 — LLM Provider Configuration

## Goal

Add server-only parser provider configuration.

Update:

```text
.env.example
```

Example:

```bash
INGESTION_LLM_PROVIDER=
INGESTION_LLM_MODEL=
INGESTION_LLM_API_KEY=
```

Do not hardcode provider keys.

## Acceptance Criteria

- Server-only secrets
- Missing config handled cleanly
- README updated

---

# Task 17 — Parse Job Runner

## Goal

Implement execution flow:

```text
queued job
→ mark running
→ load raw submission
→ call parser
→ validate payload
→ persist draft
→ persist rounds
→ persist question drafts
→ mark succeeded
→ submission → parsed/needs_review
```

Use transaction where appropriate.

## Acceptance Criteria

- Partial failed parse does not leave inconsistent graph
- Job idempotent or safely retryable
- Events recorded

---

# Task 18 — Parse Retry

## Goal

Allow failed jobs to be retried safely.

Rules:

```text
attempt_count increments
max attempts enforced
same submission retained
new events appended
```

Do not create duplicate draft graphs accidentally.

## Acceptance Criteria

- Retry idempotent
- Max attempts respected
- Failure message retained

---

# Task 19 — Company Matching

## Goal

Map parsed company name to canonical `companies`.

Matching strategy:

```text
exact normalized match
slug match
known aliases
fuzzy fallback
```

Create:

```text
src/lib/ingestion/matching/company.ts
```

Do not auto-create company from low-confidence match.

## Acceptance Criteria

- ByteDance / 字节跳动 aliases can map correctly if configured
- Low confidence returns unresolved
- Match confidence returned

---

# Task 20 — Position Matching

## Goal

Map parsed role text to existing `positions` where possible.

Use:

```text
company context
normalized title
category similarity
```

Do not force match if ambiguous.

## Acceptance Criteria

- Position mismatch across companies avoided
- Unresolved role can remain draft text
- Match confidence exposed to reviewer

---

# Task 21 — Canonical Question Candidate Retrieval

## Goal

For each extracted question, retrieve candidate canonical Knowledge questions.

Initial strategy:

```text
normalized exact match
trigram similarity
keyword overlap
topic overlap
```

Do not add vector DB unless necessary.

Return top:

```text
3–5 candidates
```

## Acceptance Criteria

- Fast enough for 50–5000 questions
- Current question text not blindly inserted as canonical
- Candidate scores documented

---

# Task 22 — Canonical Question Matching Score

## Goal

Create deterministic baseline scoring.

Possible weighted score:

```text
0.45 text similarity
0.25 keyword overlap
0.20 topic overlap
0.10 question type match
```

Document formula.

Do not claim ML-level semantic accuracy.

## Acceptance Criteria

- Same input yields same ranking
- Score in normalized range
- Thresholds configurable

---

# Task 23 — Canonical Match Suggestions UI

## Goal

In admin review, display candidate canonical questions for each extracted question.

Example:

```text
Original
为什么 GRPO 不需要 value model？

Suggested match

1. Why does GRPO not require a critic?   0.91
2. GRPO vs PPO                           0.64
3. What is group advantage?              0.48
```

Actions:

```text
Accept
Choose another
Create new canonical question
Reject occurrence
```

## Acceptance Criteria

- Reviewer remains authoritative
- Match confidence visible
- No auto-link on weak match

---

# Task 24 — New Canonical Question Draft

## Goal

If no good canonical match exists, allow reviewer to create a new canonical question from occurrence.

Fields:

```text
title
slug
question_type
difficulty
summary optional
topics
```

Do not require full Knowledge answer during interview ingestion.

## Acceptance Criteria

- New question can be created minimal-first
- Original occurrence links to it
- Knowledge content can be enriched later

---

# Task 25 — Topic Suggestion Service

## Goal

Suggest topics for extracted questions.

Initial strategy:

```text
keyword rules
canonical match topics
LLM classifier optional
```

Prefer reusing canonical topics when candidate match is strong.

Return:

```text
topic_id
topic_name
confidence
source
```

## Acceptance Criteria

- Suggestions are editable
- No new arbitrary topic names silently created
- Existing taxonomy reused

---

# Task 26 — Topic Classification Prompt

## Goal

If using LLM classification, constrain it to existing topic taxonomy.

Input:

```text
question
allowed topics
```

Output:

```text
topic slugs + confidence
```

Do not allow free-form topic creation.

## Acceptance Criteria

- Unknown topic output rejected
- Taxonomy IDs/slugs validated
- LLM optional fallback

---

# Task 27 — Duplicate Interview Detection

## Goal

Flag likely duplicate submissions.

Signals:

```text
same company
same position
same year/season
high raw text similarity
high question set overlap
same source URL
```

Create:

```text
src/lib/ingestion/matching/interview-duplicates.ts
```

Return:

```text
candidate interview IDs
scores
reasons
```

## Acceptance Criteria

- Duplicate detection does not auto-delete
- Reviewer sees explanation
- Source URL exact duplicate flagged strongly

---

# Task 28 — Duplicate Question Occurrence Detection

## Goal

Detect repeated extracted questions within the same submission.

Normalize:

```text
punctuation
case
whitespace
common filler phrases
```

Collapse exact duplicates where safe or flag for reviewer.

## Acceptance Criteria

- Repeated mention does not create accidental duplicates
- Distinct follow-up questions preserved

---

# Task 29 — Review Queue Schema

## Goal

Add lightweight review ownership/status.

Either extend draft or create:

```text
review_tasks
```

Fields:

```text
id uuid primary key
submission_id uuid not null
draft_id uuid
status text default 'open'
assigned_to uuid
priority integer default 0
review_notes text
created_at timestamptz
updated_at timestamptz
completed_at timestamptz
```

Status:

```text
open
in_review
approved
rejected
blocked
```

## Acceptance Criteria

- Reviewer can claim/complete task
- Review status separate from ingestion job status

---

# Task 30 — Reviewer Authorization

## Goal

Implement minimal admin/reviewer authorization.

Use one simple model:

```text
profiles.role
```

or equivalent existing auth metadata.

Roles:

```text
user
reviewer
admin
```

Do not build full RBAC framework.

## Acceptance Criteria

- `/admin` protected server-side
- Normal users cannot call review mutation routes
- Role checks centralized

---

# Task 31 — Admin Review Queue Page

## Goal

Create:

```text
/admin/interviews/review
```

Display:

```text
submission date
company hint
position hint
status
parser confidence
duplicate flag
question count
assigned reviewer
```

Filters:

```text
open
in review
failed
high priority
```

## Acceptance Criteria

- Server-side protected
- Queue paginated
- No raw full text in list view
- Clean dense UI

---

# Task 32 — Review Detail Page

## Goal

Create:

```text
/admin/interviews/review/[id]
```

Layout:

```text
Raw Submission
Parsed Metadata
Duplicate Candidates
Rounds
Question Drafts
Canonical Match Suggestions
Topics
Review Notes
Publish Controls
```

Use split view if useful.

## Acceptance Criteria

- Raw and parsed data visible side by side
- Reviewer can edit draft
- Question-level decisions supported
- No direct browser access to service-role secrets

---

# Task 33 — Draft Metadata Editing

## Goal

Allow reviewer to edit:

```text
company
position
year
season
location
summary
round titles
round types
question wording normalization
difficulty
```

Preserve original raw submission.

## Acceptance Criteria

- Edits audited
- Raw data immutable
- Updated draft remains valid

---

# Task 34 — Review Decision Actions

## Goal

Implement explicit actions:

```text
Approve draft
Reject submission
Mark blocked
Return to review
```

Question-level:

```text
accept match
select different match
create canonical
reject question
```

## Acceptance Criteria

- State transitions validated
- Rejection requires optional/required note as appropriate
- Actions recorded in event log

---

# Task 35 — Publish Transaction

## Goal

Implement server-side publish operation converting reviewed draft into canonical published graph.

Publish should create:

```text
interviews
interview_rounds
interview_questions
topic links where needed
```

and update:

```text
submission status
review task status
events
```

Use transaction if supported through DB function/RPC or safe equivalent.

## Acceptance Criteria

- No half-published interview
- Original wording preserved
- Canonical links preserved
- Unresolved rejected questions excluded
- Published slug unique

---

# Task 36 — Publish Idempotency

## Goal

Ensure publish cannot accidentally duplicate data.

Possible mechanisms:

```text
published_interview_id on submission/draft
unique submission→published relation
idempotency key
```

## Acceptance Criteria

- Clicking publish twice does not create two interviews
- Retry after network error safe

---

# Task 37 — Published Interview Back-Reference

## Goal

Store provenance from published interview back to originating submission.

Add if needed:

```text
source_submission_id uuid
```

to `interviews`.

## Acceptance Criteria

- Admin can trace published content to raw source
- Public API does not expose private submitter identity

---

# Task 38 — Submitter Privacy

## Goal

Ensure public interview pages do not expose:

```text
user_id
email
account identity
private notes
raw moderation notes
```

Public interview may show:

```text
Community submission
Anonymous contributor
```

if appropriate.

## Acceptance Criteria

- Privacy reviewed
- Source provenance retained internally
- Public UI safe

---

# Task 39 — Source URL Handling

## Goal

Normalize and safely display source URLs.

Store raw URL internally.

Public display only if:

```text
source_type permits
reviewer approves
URL passes validation
```

## Acceptance Criteria

- javascript/data URLs rejected
- malformed URL rejected
- plain URL not dumped unnecessarily

---

# Task 40 — Content Moderation Checks

## Goal

Add basic moderation before review/publish.

Check raw submission for:

```text
emails
phone numbers
personal names where likely private
account IDs
obvious spam
very short garbage
URLs
```

Do not build aggressive automatic censorship.

Flag for reviewer.

## Acceptance Criteria

- Flags do not auto-delete
- Reviewer can inspect reasons
- PII flags stored privately

---

# Task 41 — PII Redaction Helper

## Goal

Create optional helper to redact common contact info from public-facing text.

Support:

```text
email
phone number
messaging handle patterns
```

Do not mutate raw source.

## Acceptance Criteria

- Raw preserved
- Published text can use redacted version
- Redaction logged

---

# Task 42 — Ingestion Status UI

## Goal

User submission status page should map internal states to simple user-facing states.

Example:

```text
Received
Processing
Under review
Published
Needs attention
Not published
```

Do not expose:

```text
canonicalization failed
provider 429
model timeout
```

directly to user.

## Acceptance Criteria

- Friendly state mapping
- Admin retains detailed internal errors

---

# Task 43 — Ingestion Failure Recovery

## Goal

Provide admin actions:

```text
Retry parsing
Retry canonicalization
Reset to review
```

Do not let normal users trigger arbitrary expensive retries.

## Acceptance Criteria

- Failed job retry safe
- Job attempts logged
- Max attempt behavior clear

---

# Task 44 — Parser Versioning

## Goal

Track parser version.

Use:

```text
parser_version
prompt_version
model
provider
```

Store on job/draft.

## Acceptance Criteria

- Old drafts remain auditable
- Future parser upgrades possible
- No destructive silent reparsing

---

# Task 45 — Reparse Workflow

## Goal

Allow admin to intentionally reparse a submission.

Behavior:

```text
raw submission
→ new parse job
→ replace/branch parsed draft
```

Prefer archiving previous draft rather than destroying it.

## Acceptance Criteria

- Previous parser result recoverable
- Reparse explicit
- Published interview not silently overwritten

---

# Task 46 — Canonicalization Review Metrics

## Goal

Add simple metrics for ingestion quality.

Track:

```text
question count
auto-match candidate count
high-confidence matches
manual new canonicals
rejected questions
unresolved questions
```

Do not build dashboard yet.

## Acceptance Criteria

- Metrics queryable
- Useful for tuning matching threshold later

---

# Task 47 — Parser Confidence Policy

## Goal

Define confidence usage.

Example:

```text
>= 0.85
high

0.60–0.85
medium

< 0.60
low
```

Confidence should affect review highlighting only.

Do not auto-publish based on confidence.

## Acceptance Criteria

- Thresholds centralized
- UI labels consistent

---

# Task 48 — Canonical Match Threshold Policy

## Goal

Define suggestions:

```text
>= 0.90
strong suggestion

0.70–0.90
possible match

< 0.70
weak / no suggestion
```

Use only as reviewer aid.

## Acceptance Criteria

- No automatic irreversible match
- Thresholds configurable

---

# Task 49 — Ingestion Queue Worker Strategy

## Goal

Define how jobs are executed in MVP.

Recommended options:

```text
server-triggered job execution
or
simple background worker process
```

Do not introduce Kafka/Celery/Temporal unless already justified.

Create documentation:

```text
docs/ingestion-worker.md
```

## Acceptance Criteria

- Development flow works
- Production limitations documented
- Retry behavior defined

---

# Task 50 — Ingestion Job API

## Goal

Create internal/server endpoints or actions for:

```text
start parse
retry job
get job status
```

Protect admin-only operations.

User submission should automatically enqueue initial parse.

## Acceptance Criteria

- No arbitrary provider prompt injection via admin endpoint
- Submission ID validated
- Authorization checked

---

# Task 51 — Prompt Injection Mitigation

## Goal

Treat submission text as untrusted content.

Parser prompt must clearly delimit user content.

Do not allow raw text to override parser instructions.

Example pattern:

```text
SYSTEM RULES...
BEGIN INTERVIEW CONTENT
...
END INTERVIEW CONTENT
```

## Acceptance Criteria

- Parser instructions explicit
- User text treated as data
- Output schema still enforced

---

# Task 52 — Provider Failure Handling

## Goal

Handle:

```text
rate limit
timeout
invalid JSON
empty response
provider outage
schema mismatch
```

Map into safe job error codes.

## Acceptance Criteria

- No stuck processing state
- Retry classification sensible
- Secrets not logged

---

# Task 53 — Raw Submission Size Limits

## Goal

Define practical limits.

Example:

```text
minimum 50 chars
maximum 50k–100k chars
```

Exact value configurable.

Reject pathological payloads before LLM call.

## Acceptance Criteria

- Large abuse blocked
- User sees clear message
- Server-side validation authoritative

---

# Task 54 — Submission Rate Limiting

## Goal

Prevent spam/LLM abuse.

Example:

```text
5 submissions / hour / user
```

or configurable.

Use existing Week 4 rate-limit abstraction if possible.

## Acceptance Criteria

- Server-side
- 429 friendly
- Limits documented

---

# Task 55 — Admin Bulk Review Actions

## Goal

Add only lightweight bulk operations:

```text
assign reviewer
mark priority
retry failed parse
```

Do not bulk publish interviews.

## Acceptance Criteria

- No destructive bulk publish
- Selected IDs validated

---

# Task 56 — Review Keyboard Workflow

## Goal

Optimize repetitive review work.

Optional shortcuts:

```text
A accept candidate
N create new canonical
R reject question
```

Only implement if accessible and non-conflicting.

## Acceptance Criteria

- Keyboard shortcuts documented
- Buttons remain available
- No hidden-only interaction

---

# Task 57 — Review Diff View

## Goal

Help reviewer compare:

```text
raw wording
normalized wording
canonical title
```

Example:

```text
Raw:
GRPO为啥没有critic

Normalized:
为什么 GRPO 不需要 critic？

Canonical:
Why does GRPO not require a critic?
```

## Acceptance Criteria

- Distinctions obvious
- Original always visible

---

# Task 58 — Round Reconstruction Audit

## Goal

Validate parser round reconstruction.

Cases:

```text
explicit Round 1/2 headings
unstructured chronological text
single-round interview
mixed coding/research round
missing round info
```

If uncertain:

```text
one unknown/mixed round
```

is preferable to hallucinating round structure.

## Acceptance Criteria

- No invented round numbers when unsupported
- Confidence lowered when ambiguous

---

# Task 59 — Question Extraction Quality Rules

## Goal

Document extraction rules.

Create:

```text
docs/question-extraction-guidelines.md
```

Rules:

```text
extract actual questions
do not turn candidate answers into questions
preserve follow-ups
separate distinct technical questions
avoid splitting trivial conversational fragments
mark coding tasks distinctly
```

## Acceptance Criteria

- Guidelines usable by prompt and reviewers

---

# Task 60 — Coding Question Detection

## Goal

Detect whether extracted occurrence maps better to:

```text
Knowledge Question
or
Coding Problem
```

Signals:

```text
implement
write code
手搓
coding
algorithm
function/class
```

Store suggested entity type.

## Acceptance Criteria

- Reviewer can override
- No forced Knowledge link for coding tasks

---

# Task 61 — Interview Type Classification

## Goal

Classify interview emphasis:

```text
research-heavy
coding-heavy
mixed
behavioral-heavy
```

Use deterministic counts from extracted question types.

Do not rely on LLM prose alone.

## Acceptance Criteria

- Derived from structured data
- Useful for future Company Intelligence

---

# Task 62 — Publication Stats Refresh Hooks

## Goal

After successful publish, refresh relevant:

```text
question_stats
interview counts
topic occurrence metadata
coding problem occurrence metadata if linked
```

Reuse Week 2/4 refresh logic.

## Acceptance Criteria

- New published interview becomes visible in stats
- Draft/rejected submission does not affect public stats

---

# Task 63 — Search Index Refresh Hooks

## Goal

Ensure newly published interview/questions become searchable.

If using Postgres indexes only, no special action may be required.

Document behavior.

## Acceptance Criteria

- Publish → searchable immediately or predictably
- No manual reindex step unless documented

---

# Task 64 — Ingestion Data Integrity Script

## Goal

Create:

```text
scripts/check-ingestion-integrity.ts
```

Check:

```text
submission has valid status
draft belongs to submission
round drafts belong to draft
question drafts belong to draft
candidate question IDs valid
published submission points to published interview
review task state consistent
successful job has finished_at
failed job has error info
```

## Acceptance Criteria

- Broken fixtures detected
- Non-zero exit on violation
- No DB mutation

---

# Task 65 — Ingestion Utility Tests

## Goal

Add unit tests for:

```text
parser schema
status transitions
company matching
position matching
question normalization
canonical scoring
duplicate scoring
topic validation
redaction
confidence thresholds
```

## Acceptance Criteria

- Offline
- Deterministic
- No live LLM required

---

# Task 66 — Parser Adapter Mock

## Goal

Create deterministic mock parser for tests/dev.

Input fixture:

```text
raw interview text
```

Output:

```text
fixed structured JSON
```

Use for CI.

## Acceptance Criteria

- CI independent of LLM provider
- Parser pipeline testable end-to-end

---

# Task 67 — End-to-End Ingestion Smoke Test

## Goal

Create:

```text
scripts/test-ingestion-pipeline.ts
```

Flow:

```text
create development submission
→ run mock parser
→ persist draft
→ canonical suggestions
→ review approve
→ publish
→ verify interview graph
```

## Acceptance Criteria

- No live LLM required
- Idempotency checked
- Cleanup or isolated fixture strategy documented

---

# Task 68 — Live Parser Integration Test

## Goal

Create optional development script:

```text
scripts/test-live-parser.ts
```

Only runs with configured provider.

Use a short safe example interview.

Do not run in CI.

## Acceptance Criteria

- Provider secrets never printed
- Parsed payload validated
- Clear pass/fail

---

# Task 69 — Review UI Mobile Audit

## Goal

Admin review is desktop-first but should remain usable on tablet/mobile.

Test:

```text
768px
1024px
1440px
```

Mobile phone support can be basic.

## Acceptance Criteria

- No broken layout
- Raw/parsed panes stack safely
- Review controls accessible

---

# Task 70 — Submission UX Audit

## Goal

Audit user-facing submission flow.

Test:

```text
empty form
very long text
mobile
network error
duplicate warning
processing
published
rejected
```

## Acceptance Criteria

- No misleading status
- Submission process understandable
- User never thinks content was instantly public

---

# Task 71 — Admin Accessibility Audit

## Goal

Check review queue/detail accessibility.

Review:

```text
table/list semantics
form labels
buttons
status badges
keyboard navigation
modal focus
```

## Acceptance Criteria

- Review actions keyboard accessible
- Confidence not color-only

---

# Task 72 — Ingestion Performance Audit

## Goal

Measure:

```text
parse latency
canonical matching latency
duplicate detection latency
DB write count
review page query count
```

Do not optimize prematurely.

## Acceptance Criteria

- N+1 issues identified/fixed
- Candidate retrieval reasonably fast
- Metrics documented

---

# Task 73 — LLM Cost Tracking

## Goal

Track approximate parser usage per job.

Add fields if provider supplies:

```text
input_tokens
output_tokens
estimated_cost
```

Keep optional.

Do not expose to users.

## Acceptance Criteria

- Provider-independent storage
- Missing usage supported
- Useful for future scaling decisions

---

# Task 74 — Review Queue Prioritization

## Goal

Compute simple priority score.

Signals:

```text
recent submission
high-confidence parse
duplicate risk
failed canonicalization
company popularity optional
```

Do not build ML ranking.

## Acceptance Criteria

- Deterministic
- Reviewer can override priority

---

# Task 75 — Reviewer Notes

## Goal

Support internal notes at:

```text
submission
draft
question draft
```

Do not expose publicly.

## Acceptance Criteria

- Notes private
- Timestamp/user attribution if practical

---

# Task 76 — Publication Preview

## Goal

Before publish, allow reviewer to preview exactly how interview page will look.

Route concept:

```text
/admin/interviews/review/[id]/preview
```

Reuse published Interview components with draft data adapter.

## Acceptance Criteria

- Preview not publicly indexable
- Reuses production UI
- No duplicate styling implementation

---

# Task 77 — Publish Validation Gate

## Goal

Block publish unless minimum integrity requirements pass.

Required:

```text
company resolved or explicitly created
position title present
year valid if present
at least one accepted question
round/question ordering valid
source provenance present
PII flags reviewed
duplicate warning acknowledged if high
```

## Acceptance Criteria

- Clear validation errors
- No invalid public interview graph

---

# Task 78 — Rejection Workflow

## Goal

Support rejection reasons:

```text
spam
duplicate
insufficient detail
privacy concern
unverifiable
off-topic
other
```

User-facing message should be neutral.

## Acceptance Criteria

- Internal reason stored
- User does not see sensitive moderator notes

---

# Task 79 — Duplicate Merge Workflow

## Goal

For duplicate interview submissions, allow reviewer to:

```text
reject as duplicate
or
merge useful new question occurrences into existing interview
```

Keep merge MVP simple.

## Acceptance Criteria

- Existing interview not overwritten blindly
- Provenance of merged occurrence retained

---

# Task 80 — Ingestion Documentation

## Goal

Create:

```text
docs/ingestion-architecture.md
```

Include:

```text
entities
state machine
job flow
parser contract
canonicalization
review process
publish transaction
failure handling
security/privacy
```

## Acceptance Criteria

- New developer can understand pipeline without reading all source code

---

# Task 81 — Submission Privacy Documentation

## Goal

Create:

```text
docs/interview-submission-privacy.md
```

Cover:

```text
raw submission storage
public vs private fields
PII handling
source URL policy
submitter anonymity
moderation notes
```

## Acceptance Criteria

- Product/privacy behavior explicit

---

# Task 82 — Week 6 Integration Audit

## Goal

Perform final Week 6 end-to-end review.

Do not add major new features here.

## Flow A — User Submission

```text
sign in
→ /interviews/submit
→ submit raw experience
→ confirmation/status page
```

## Flow B — Parse

```text
submission
→ ingestion job
→ parsed draft
→ rounds
→ question drafts
```

## Flow C — Canonicalization

```text
question draft
→ candidate matches
→ reviewer accepts canonical question
```

## Flow D — New Canonical

```text
no strong match
→ create new canonical question
→ link occurrence
```

## Flow E — Duplicate

```text
duplicate submission
→ review warning
→ reject or merge
```

## Flow F — Review

```text
review queue
→ edit metadata
→ review questions
→ preview
→ publish
```

## Flow G — Publish

```text
publish
→ /interviews/[slug]
→ question links work
→ Knowledge provenance updates
```

## Flow H — Failure

```text
parser failure
→ failed job
→ retry
→ succeeds
```

## Flow I — Privacy

```text
public page
→ no submitter PII
→ no moderation notes
→ no raw private submission
```

---

## Run

Use repository scripts:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Also run:

```text
ingestion integrity check
mock ingestion smoke test
live parser test if configured
```

Fix all Week 6 regressions.

---

## Deliverables

Create:

```text
docs/week6-status.md
docs/ingestion-architecture.md
docs/ingestion-worker.md
docs/question-extraction-guidelines.md
docs/interview-submission-privacy.md
```

`week6-status.md` should include:

```text
Implemented
Database migrations
Submission flow
Parser architecture
Canonicalization approach
Duplicate detection
Review workflow
Publish workflow
Security/privacy
Known limitations
Deferred to Week 7
```

---

# Recommended Execution Order

Give Codex tasks in this order:

```text
01 Submission Schema
02 Submission RLS
03 Parsed Interview Draft Schema
04 Parsed Round Draft Schema
05 Parsed Question Draft Schema
06 Ingestion Job Schema
07 Ingestion Event Log
08 Ingestion Domain Types
09 Submission Form Route
10 Submission Form Component
11 Submission Confirmation Page
12 Ingestion Service Abstraction
13 Parser Provider Abstraction
14 Parser Output Schema
15 LLM Parser Prompt
16 LLM Provider Configuration
17 Parse Job Runner
18 Parse Retry
19 Company Matching
20 Position Matching
21 Canonical Question Candidate Retrieval
22 Canonical Question Matching Score
23 Canonical Match Suggestions UI
24 New Canonical Question Draft
25 Topic Suggestion Service
26 Topic Classification Prompt
27 Duplicate Interview Detection
28 Duplicate Question Occurrence Detection
29 Review Queue Schema
30 Reviewer Authorization
31 Admin Review Queue Page
32 Review Detail Page
33 Draft Metadata Editing
34 Review Decision Actions
35 Publish Transaction
36 Publish Idempotency
37 Published Interview Back-Reference
38 Submitter Privacy
39 Source URL Handling
40 Content Moderation Checks
41 PII Redaction Helper
42 Ingestion Status UI
43 Ingestion Failure Recovery
44 Parser Versioning
45 Reparse Workflow
46 Canonicalization Review Metrics
47 Parser Confidence Policy
48 Canonical Match Threshold Policy
49 Ingestion Queue Worker Strategy
50 Ingestion Job API
51 Prompt Injection Mitigation
52 Provider Failure Handling
53 Raw Submission Size Limits
54 Submission Rate Limiting
55 Admin Bulk Review Actions
56 Review Keyboard Workflow
57 Review Diff View
58 Round Reconstruction Audit
59 Question Extraction Quality Rules
60 Coding Question Detection
61 Interview Type Classification
62 Publication Stats Refresh Hooks
63 Search Index Refresh Hooks
64 Ingestion Data Integrity Script
65 Ingestion Utility Tests
66 Parser Adapter Mock
67 End-to-End Ingestion Smoke Test
68 Live Parser Integration Test
69 Review UI Mobile Audit
70 Submission UX Audit
71 Admin Accessibility Audit
72 Ingestion Performance Audit
73 LLM Cost Tracking
74 Review Queue Prioritization
75 Reviewer Notes
76 Publication Preview
77 Publish Validation Gate
78 Rejection Workflow
79 Duplicate Merge Workflow
80 Ingestion Documentation
81 Submission Privacy Documentation
82 Week 6 Integration Audit
```

Do not give all 82 tasks to Codex in one prompt.

Recommended workflow:

```text
one task
→ inspect repository
→ implement
→ run checks
→ inspect diff
→ commit
→ next task
```

---

# Recommended Commit Groups

```text
feat(db): add interview submission and draft schema
feat(ingestion): add parser service and job model
feat(ingestion): add structured interview extraction
feat(ingestion): add canonical question matching
feat(ingestion): add topic and duplicate detection
feat(admin): add interview review queue
feat(admin): add review detail and canonicalization workflow
feat(ingestion): add publish transaction and provenance
security: add submission privacy and moderation safeguards
test(ingestion): add mock parser and pipeline tests
docs: document ingestion and privacy architecture
chore: complete week 6 audit
```

---

# Codex Global Instruction — Week 6

Paste this at the beginning of a fresh Codex session:

```text
You are implementing Week 6 of RoboPrep, a production-oriented Embodied AI interview preparation platform.

Week 1 established:
- Next.js App Router
- TypeScript
- Supabase
- authentication
- Apple-inspired design system

Week 2 established:
- Knowledge System
- canonical questions
- topics
- question relations

Week 3 established:
- Interview System
- structured rounds
- interview question occurrences
- provenance

Week 4 established:
- Python Coding MVP
- Monaco
- Run / Submit
- judge abstraction
- hidden tests
- submissions

Week 5 established:
- ML / PyTorch function judge
- structured evaluator
- Shape / Numerical / Gradient checks
- coding collections
- progress

Week 6 goal:
Build the complete Interview Submission + Content Ingestion Pipeline.

Core pipeline:

User Submission
→ Raw Submission
→ Parser
→ Draft Interview
→ Draft Rounds
→ Draft Questions
→ Canonical Match Suggestions
→ Topic Suggestions
→ Duplicate Detection
→ Human Review
→ Publish

Critical product rule:

LLM output must never directly publish public interview content.

Engineering rules:

1. Inspect the existing repository before modifying code.
2. Preserve all Week 1–5 functionality.
3. Raw submissions are immutable source records.
4. Parsed drafts are separate from published interview entities.
5. Original question wording must always be preserved.
6. Canonical questions are reusable entities, not copies of raw wording.
7. Do not auto-publish LLM output.
8. Reviewer decisions are authoritative.
9. All parser output must pass strict schema validation.
10. Treat user-submitted text as untrusted data.
11. Preserve parser/provider/version metadata.
12. Make retries idempotent.
13. Make publish idempotent.
14. Preserve provenance from published interview back to source submission.
15. Never expose submitter identity publicly unless explicitly intended.
16. Never expose moderation notes publicly.
17. Keep LLM keys server-only.
18. Avoid vector DB unless simple matching is insufficient.
19. Avoid workflow-engine overengineering.
20. Use strict TypeScript.
21. Use Server Components by default.
22. Keep admin routes server-authorized.
23. Record important state transitions in an audit log.
24. Reuse Week 2 Knowledge and Week 3 Interview components.
25. Reuse Week 4/5 coding canonical entities when interview coding questions are matched.
26. After each task, run relevant lint/typecheck/test/build checks.
27. Fix issues introduced by your changes.
28. Summarize:
    - files changed
    - schema changes
    - ingestion architecture
    - parser behavior
    - canonicalization decisions
    - security/privacy implications
    - commands run
    - limitations

Data model distinction:

Raw Submission
!=
Parsed Draft
!=
Canonical Question
!=
Published Interview

Never collapse these concepts into one table.

Visual direction:

User submission UI:
- simple
- trustworthy
- low friction
- clear review expectation

Admin review UI:
- denser
- structured
- provenance-first
- confidence visible
- raw vs parsed easy to compare

Avoid:
- auto-generated flashy AI UI
- unclear publish states
- hiding provenance
- giant forms
- overly complex moderation workflow
```

---

# Week 6 Suggested Route Map

At the end of Week 6:

```text
/interviews/submit

/interviews/submissions/[id]

/admin/interviews/review

/admin/interviews/review/[id]

/admin/interviews/review/[id]/preview
```

Published routes remain:

```text
/interviews
/interviews/[slug]
```

---

# Suggested Component Structure

```text
src/components/interviews/

submission-form.tsx
submission-status.tsx

src/components/admin/interviews/

review-queue.tsx
review-card.tsx
review-detail.tsx
raw-submission-panel.tsx
parsed-metadata-editor.tsx
round-draft-editor.tsx
question-draft-review.tsx
canonical-match-candidates.tsx
duplicate-warning.tsx
topic-suggestions.tsx
review-actions.tsx
publication-preview.tsx
```

Do not force exact file count if consolidation is cleaner.

---

# Suggested Ingestion Architecture

```text
User
 │
 ▼
Submission API
 │
 ▼
interview_submissions
 │
 ▼
ingestion_jobs
 │
 ▼
InterviewParser
 │
 ▼
Strict Zod Validation
 │
 ▼
interview_drafts
 ├── interview_round_drafts
 └── interview_question_drafts
           │
           ├── canonical candidate search
           ├── topic suggestions
           └── duplicate detection
                     │
                     ▼
                Review Queue
                     │
                     ▼
               Publish Service
                     │
                     ▼
               Canonical Tables
```

---

# Canonicalization Principle

Do not do:

```text
every extracted question
→ create new canonical question
```

Prefer:

```text
extracted question
→ retrieve candidates
→ reviewer selects
→ only create new canonical when needed
```

This prevents Knowledge fragmentation.

---

# Provenance Principle

Every published interview should be traceable internally to:

```text
source submission
parser version
review decision
published entities
```

But public pages should expose only appropriate source metadata.

---

# Human-in-the-Loop Principle

Automation should reduce reviewer effort, not remove reviewer authority.

LLM can suggest:

```text
round structure
question extraction
normalized wording
topic candidates
canonical candidates
```

Reviewer decides:

```text
what is correct
what is duplicate
what maps to canonical
what gets published
```

---

# Week 7 Handoff

Once Week 6 is accepted, Week 7 should focus on:

```text
Company Intelligence
```

Recommended Week 7 scope:

```text
Company pages
role breakdown
most-asked topics
question frequency
season comparison
trending questions
coding vs research emphasis
interview difficulty
recent interview feed
company-specific preparation guide
```

Week 7 should build entirely from the structured interview/question graph created in Weeks 2, 3, and 6.
