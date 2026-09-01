# RoboPrep — Week 4 Codex Implementation Tasks

> Goal: implement the complete **Coding MVP** for RoboPrep.
>
> Week 4 should make RoboPrep support a true LeetCode-style coding workflow for Embodied AI / ML / Robotics interview preparation.
>
> Core loop:
>
> ```text
> Coding Problem
> → Edit Code
> → Run
> → Submit
> → Judge
> → Result
> → Submission History
> ```
>
> Week 4 should support **Python only**.
>
> Do not build custom Firecracker / Kubernetes / GPU sandbox infrastructure yet.

---

# Week 4 Definition of Done

By the end of Week 4, users should be able to:

```text
open /coding
→ browse coding problems
→ filter by difficulty / topic / status
→ open a coding problem
→ edit Python code in Monaco
→ run against visible examples
→ submit against hidden tests
→ receive Accepted / Wrong Answer / Runtime Error / TLE
→ inspect runtime and memory when available
→ view previous submissions
```

The system should preserve a clean separation:

```text
Problem Definition
        │
        ├── starter code
        ├── examples
        ├── hidden tests
        └── limits

User Submission
        │
        ▼
Judge Service
        │
        ▼
Execution Backend
        │
        ▼
Judge Result
```

Week 4 must prioritize:

```text
correctness
security boundary
clean judge abstraction
deterministic test execution
simple Python-first workflow
```

over multi-language support.

---

# Week 4 Scope

Implement:

```text
Coding problem schema
Coding problem list
Coding filters
Problem detail page
Monaco editor
Starter code
Run action
Submit action
Judge service abstraction
Judge0 integration or equivalent
Visible test cases
Hidden test cases
Submission states
Submission history
Runtime / memory metadata
Accepted / WA / RE / TLE
Basic rate limiting
Seed robotics / ML coding problems
```

Do not implement:

```text
C++
Java
GPU execution
PyTorch gradient judge
Custom microVM sandbox
Contest mode
Leaderboards
Discussion comments
AI-generated solutions
Plagiarism detection
```

---

# Task 1 — Coding Schema

## Goal

Add the core relational schema for coding problems and submissions.

Create migration:

```text
supabase/migrations/0008_coding_schema.sql
```

## Add `coding_problems`

Fields:

```text
id uuid primary key
title text not null
slug text unique not null
difficulty text not null
category text
description text not null
constraints text
starter_code text
solution_code text
function_name text
language text default 'python'
time_limit_ms integer default 3000
memory_limit_mb integer default 256
is_published boolean default true
is_featured boolean default false
created_at timestamptz
updated_at timestamptz
```

Initial difficulty:

```text
easy
medium
hard
```

Initial categories:

```text
python
transformer
rl
diffusion
robotics
robot_learning
algorithms
```

---

## Add `coding_problem_topics`

Fields:

```text
problem_id uuid not null
topic_id uuid not null
weight numeric default 1
created_at timestamptz
```

Composite primary key:

```text
(problem_id, topic_id)
```

Reuse Week 2 `topics`.

---

## Add `coding_test_cases`

Fields:

```text
id uuid primary key
problem_id uuid not null
name text
input_data text
expected_output text
is_hidden boolean default true
weight numeric default 1
order_index integer
created_at timestamptz
```

Do not expose hidden test content through normal public queries.

---

## Add `coding_submissions`

Fields:

```text
id uuid primary key
user_id uuid not null
problem_id uuid not null
language text not null
source_code text not null
status text not null
score numeric
runtime_ms integer
memory_kb integer
judge_token text
error_message text
created_at timestamptz
completed_at timestamptz
```

Initial status values:

```text
queued
running
accepted
wrong_answer
runtime_error
time_limit_exceeded
memory_limit_exceeded
compile_error
internal_error
```

---

## Add `coding_submission_cases`

Fields:

```text
id uuid primary key
submission_id uuid not null
test_case_id uuid
status text
runtime_ms integer
memory_kb integer
stdout text
stderr text
created_at timestamptz
```

Do not expose hidden expected output publicly.

---

## Indexes

Add indexes for:

```text
coding_problems.slug
coding_problems.difficulty
coding_problems.category
coding_problems.is_published
coding_problem_topics.topic_id
coding_test_cases.problem_id
coding_submissions.user_id
coding_submissions.problem_id
coding_submissions.status
coding_submissions.created_at
coding_submission_cases.submission_id
```

---

## Acceptance Criteria

- Migration works on Week 3 database
- Public problem metadata can be queried independently of hidden tests
- Submission schema supports asynchronous judge status
- Hidden tests are not stored in problem JSON blobs
- Topics reuse existing taxonomy

## Do Not

- Do not store all test cases as one JSON array
- Do not expose solution code publicly
- Do not use browser-side judge logic

---

# Task 2 — Coding RLS

## Goal

Protect coding problem internals and submission data.

Create:

```text
supabase/migrations/0009_coding_rls.sql
```

## Public Read

Anonymous users may read:

```text
published coding problem metadata
public problem-topic relations
visible test cases only
```

## Authenticated User Read

Authenticated users may read:

```text
their own submissions
their own submission case results
```

## Hidden Data

Normal client users must not be able to read:

```text
hidden test inputs
hidden expected outputs
solution code
other users' source code
judge tokens
internal errors
```

## Mutation

Normal users should not directly insert completed submissions with arbitrary status.

Submission creation should go through a server route / server action.

## Acceptance Criteria

- Hidden tests inaccessible from browser Supabase client
- Solution code inaccessible from public client
- User A cannot read User B submissions
- Public problem pages still work

---

# Task 3 — Coding Domain Types

## Goal

Create explicit TypeScript domain types.

Create:

```text
src/types/coding.ts
```

Define:

```text
CodingProblemSummary
CodingProblemDetail
CodingExample
CodingTestCase
CodingSubmission
CodingSubmissionResult
CodingSubmissionCaseResult
CodingFilters
CodingSort
JudgeStatus
JudgeRequest
JudgeResponse
```

Recommended filters:

```ts
type CodingFilters = {
  query?: string;
  difficulty?: "easy" | "medium" | "hard";
  category?: string;
  topic?: string;
  status?: "solved" | "attempted" | "unsolved";
};
```

Recommended sort:

```text
recommended
difficulty
acceptance
newest
```

Do not expose hidden DB fields through public-facing types.

## Acceptance Criteria

- UI never receives solution code
- Public problem type excludes hidden tests
- Judge-specific types are separated from page props
- No broad `any`

---

# Task 4 — Coding Query Layer

## Goal

Centralize read queries for Coding pages.

Create:

```text
src/lib/coding/
├── queries.ts
├── filters.ts
├── mappers.ts
├── constants.ts
└── helpers.ts
```

Implement:

```ts
getCodingProblems(...)
getCodingProblemBySlug(...)
getVisibleExamples(...)
getCodingTopics(...)
getUserProblemStatus(...)
getUserSubmissions(...)
getSubmissionById(...)
getCodingFilterOptions(...)
```

All database reads should go through this layer.

## Acceptance Criteria

- No direct Supabase queries inside problem cards
- Hidden tests are never fetched by public query helpers
- Auth-aware solved status works
- Pagination supported

---

# Task 5 — Coding URL Filters

## Goal

Make `/coding` filters URL-driven.

Examples:

```text
/coding
/coding?difficulty=medium
/coding?category=robotics
/coding?topic=grpo
/coding?status=solved
/coding?q=attention
```

Validate:

```text
difficulty
category
topic
status
sort
page
```

## Acceptance Criteria

- Shareable URLs
- Refresh preserves filters
- Browser back/forward works
- Invalid params degrade safely

---

# Task 6 — Coding List Page

## Goal

Implement the main coding problem discovery page.

Route:

```text
/coding
```

Suggested layout:

```text
Coding

Practice the implementation skills
that appear in Embodied AI interviews.

[ Search problems... ]

Difficulty
Category
Topic
Status

Sort: Recommended

────────────────────────

Problem List
```

Problem row/card example:

```text
Medium

Implement Multi-Head Attention

Transformer · Attention
Python

Acceptance 61%
Solved
```

Only show acceptance if real data exists.

## Acceptance Criteria

- DB-backed list
- Responsive
- Filters work
- Empty state polished
- Auth status optional

---

# Task 7 — Coding Search

## Goal

Support practical search.

Search across:

```text
title
description
category
topic
```

Use Postgres search / ILIKE / pg_trgm.

Do not add external search engine.

Search examples:

```text
attention
grpo
quaternion
diffusion
replay buffer
```

## Acceptance Criteria

- Case-insensitive
- URL-driven
- No client-side full database loading

---

# Task 8 — Coding Problem Detail Route

## Goal

Implement:

```text
/coding/[slug]
```

Recommended desktop layout:

```text
┌───────────────────────────────┬──────────────────────────────┐
│ Problem                       │ Editor                       │
│                               │                              │
│ Title                         │ Python                       │
│ Difficulty                    │                              │
│ Description                   │ starter code                 │
│ Examples                      │                              │
│ Constraints                   │                              │
│                               │                              │
├───────────────────────────────┴──────────────────────────────┤
│ Test / Console / Submission Result                           │
└──────────────────────────────────────────────────────────────┘

                         Run    Submit
```

Mobile may stack vertically.

## Acceptance Criteria

- Unknown slug returns 404
- Hidden tests not serialized into page
- Starter code loaded
- Editor usable
- Run / Submit actions present

---

# Task 9 — Monaco Editor Integration

## Goal

Integrate Monaco Editor.

Recommended dependency:

```text
@monaco-editor/react
```

Create:

```text
src/components/coding/code-editor.tsx
```

Support:

```text
Python syntax highlighting
line numbers
basic editor resizing
starter code
controlled source code
keyboard input
```

Store source code locally in component state.

Optional local draft persistence:

```text
localStorage
```

scoped by problem slug.

## Acceptance Criteria

- Editor loads client-side safely
- No SSR crash
- Starter code appears
- Reload can restore draft if implemented
- Monaco does not dominate initial bundle unnecessarily

---

# Task 10 — Coding Workspace Layout

## Goal

Build a reusable coding workspace shell.

Create:

```text
src/components/coding/coding-workspace.tsx
```

Responsibilities:

```text
problem panel
editor panel
console panel
Run button
Submit button
resizable layout if simple
```

Do not build complex IDE tabs yet.

## Acceptance Criteria

- Desktop split layout works
- Mobile stacked layout works
- Run / Submit disabled appropriately while judging
- UI remains clean and Apple-inspired

---

# Task 11 — Problem Statement Component

## Goal

Create a structured problem statement.

Create:

```text
src/components/coding/problem-statement.tsx
```

Render:

```text
title
difficulty
topics
description
examples
constraints
function signature
```

Do not render arbitrary raw HTML.

Use Markdown safely if needed.

## Acceptance Criteria

- Code blocks readable
- Long constraints readable
- No hidden data leaks
- Typography consistent with Knowledge pages

---

# Task 12 — Visible Example Test Cases

## Goal

Render visible examples separately from hidden judge tests.

Create:

```text
src/components/coding/example-cases.tsx
```

Example:

```text
Example 1

Input
...

Output
...

Explanation
...
```

If schema lacks explanation, do not invent it.

## Acceptance Criteria

- Only non-hidden test cases visible
- Order preserved
- Input/output copyable if useful

---

# Task 13 — Judge Service Abstraction

## Goal

Create a judge interface independent of execution backend.

Create:

```text
src/lib/judge/
├── types.ts
├── service.ts
├── adapters/
│   └── judge0.ts
└── normalize.ts
```

Define interface similar to:

```ts
interface JudgeService {
  submit(request: JudgeRequest): Promise<JudgeSubmission>;
  getResult(token: string): Promise<JudgeResult>;
}
```

The rest of the application must not call Judge0 directly.

## Acceptance Criteria

- Backend can be replaced later
- Judge0 details isolated in adapter
- Status normalized into RoboPrep status enum
- Timeouts handled

---

# Task 14 — Judge Environment Configuration

## Goal

Add server-only judge configuration.

Update:

```text
.env.example
```

Example variables:

```bash
JUDGE_PROVIDER=judge0
JUDGE0_BASE_URL=
JUDGE0_API_KEY=
```

Use server-only env validation.

Never expose judge API keys to client.

## Acceptance Criteria

- Missing judge config produces readable server error
- Secrets never use `NEXT_PUBLIC_`
- README updated

---

# Task 15 — Judge0 Adapter

## Goal

Implement Judge0 adapter for Python execution.

Support:

```text
source code
stdin
expected output when needed
CPU limit
memory limit
Python language id
```

Normalize Judge0 statuses to:

```text
queued
running
accepted
wrong_answer
runtime_error
time_limit_exceeded
memory_limit_exceeded
compile_error
internal_error
```

Do not leak raw provider errors to users.

## Acceptance Criteria

- Basic Python program can execute
- Timeout handled
- Runtime error handled
- Wrong answer handled
- Adapter failures mapped safely

---

# Task 16 — Server-Side Code Execution API

## Goal

Create server route(s) for Run and Submit.

Possible routes:

```text
POST /api/coding/run
POST /api/coding/submit
GET  /api/coding/submissions/[id]
```

or equivalent server actions.

Do not accept hidden expected outputs from the client.

Server determines:

```text
problem
test cases
limits
language
```

from DB.

## Acceptance Criteria

- Client sends only:
  - problem ID/slug
  - source code
- Hidden tests loaded server-side
- Rate limit hooks possible
- Auth required for Submit
- Run may optionally allow anonymous users

---

# Task 17 — Run Action

## Goal

Implement fast local-style execution against visible examples.

Flow:

```text
source code
→ visible test cases
→ judge
→ results
→ console
```

Run should not create a permanent submission unless intentionally designed.

Recommended:

```text
anonymous allowed
authenticated allowed
visible tests only
```

## Acceptance Criteria

- Run uses only public examples
- Result shown per example
- Does not expose hidden tests
- Button disabled while running

---

# Task 18 — Submit Action

## Goal

Implement real judged submission against hidden tests.

Flow:

```text
authenticated user
→ create queued submission
→ load hidden tests server-side
→ execute
→ aggregate result
→ update submission
→ return final status
```

Submission should persist.

## Acceptance Criteria

- Auth required
- Submission record created server-side
- Hidden tests never sent to client
- Final status persisted
- Source code persisted for owner only

---

# Task 19 — Submission Status Aggregation

## Goal

Define deterministic rules for final submission status.

Suggested precedence:

```text
internal_error
compile_error
runtime_error
time_limit_exceeded
memory_limit_exceeded
wrong_answer
accepted
```

If any required test fails, submission is not accepted.

Score may be:

```text
passed_weight / total_weight * 100
```

For Week 4, binary Accepted is sufficient for most problems.

## Acceptance Criteria

- Deterministic status
- No "Accepted" if hidden test failed
- Weighted score optional but correct

---

# Task 20 — Judge Result Component

## Goal

Create reusable result UI.

Create:

```text
src/components/coding/judge-result.tsx
```

Support:

```text
Accepted
Wrong Answer
Runtime Error
Time Limit Exceeded
Memory Limit Exceeded
Internal Error
```

Display when available:

```text
runtime
memory
passed tests
```

Avoid giant celebratory animations.

## Acceptance Criteria

- Status visually distinct
- Error copy readable
- No hidden expected output displayed

---

# Task 21 — Console Panel

## Goal

Create a console/test result area.

Create:

```text
src/components/coding/console-panel.tsx
```

Tabs may include:

```text
Test Result
Console
Submission
```

Keep initial implementation simple.

Show:

```text
stdout
stderr
case status
runtime
```

For visible Run results only.

## Acceptance Criteria

- Long output scrolls
- Error stack does not break layout
- Hidden tests remain anonymized

---

# Task 22 — Submission History

## Goal

Allow authenticated users to inspect previous attempts.

Route or panel:

```text
/coding/[slug]/submissions
```

or integrated tab.

Display:

```text
status
language
runtime
memory
submitted_at
```

Clicking submission may open:

```text
/coding/submissions/[id]
```

## Acceptance Criteria

- User sees only own submissions
- Sorted newest first
- Source code visible only to owner
- Pagination if needed

---

# Task 23 — Submission Detail Page

## Goal

Implement:

```text
/coding/submissions/[id]
```

Display:

```text
problem
status
source code
runtime
memory
submitted_at
visible failure context if safe
```

Do not display hidden test input/output.

## Acceptance Criteria

- Owner-only
- 404 or unauthorized handling correct
- Monaco read-only optional
- No hidden judge secrets

---

# Task 24 — Solved / Attempted Problem State

## Goal

Derive user-specific problem status.

Statuses:

```text
solved
attempted
unsolved
```

Rules:

```text
solved:
at least one accepted submission

attempted:
at least one submission but no accepted

unsolved:
no submissions
```

Show on `/coding`.

## Acceptance Criteria

- Correct across multiple submissions
- Anonymous user sees no fake status
- Efficient query

---

# Task 25 — Acceptance Rate Helper

## Goal

Compute real acceptance statistics.

Possible metric:

```text
accepted submissions / total completed submissions
```

Do not count queued/running.

Do not display acceptance rate until enough submissions exist if desired.

Create helper/query.

## Acceptance Criteria

- No division by zero
- No fake percentage
- Correct aggregation

---

# Task 26 — Basic Judge Rate Limiting

## Goal

Prevent obvious execution abuse.

Implement simple server-side rate limiting abstraction.

Initial policy example:

```text
Run:
20 requests / 5 min / user or IP

Submit:
10 requests / 5 min / user
```

Exact values can be adjusted.

Do not introduce Redis if unnecessary for MVP.

A simple in-memory limiter is acceptable for local/dev but document production limitations.

If infrastructure already supports durable rate limiting, use it.

## Acceptance Criteria

- Endpoint can reject abusive bursts
- User gets readable 429 response
- Limits documented
- No client-only throttling

---

# Task 27 — Source Code Size Limits

## Goal

Add explicit execution safety limits.

Reject overly large submissions.

Example:

```text
max source length: 50 KB
```

Also validate:

```text
language must be python
problem must exist
problem must be published
```

## Acceptance Criteria

- Oversized source rejected before judge
- Unsupported language rejected
- Clear user error

---

# Task 28 — Judge Timeout / Failure Handling

## Goal

Handle provider failures gracefully.

Cases:

```text
judge API unavailable
network timeout
invalid provider response
submission stuck
```

Map these to:

```text
internal_error
```

with user-friendly copy:

```text
Judge temporarily unavailable. Please try again.
```

Do not expose stack traces.

## Acceptance Criteria

- Application does not hang indefinitely
- Timeout exists
- Failed submission gets terminal state
- Server logs preserve useful diagnostics

---

# Task 29 — Seed 20 Coding Problems

## Goal

Create a meaningful Python-first coding problem set.

Target:

```text
20 problems
```

Distribution:

```text
Transformer        5
RL                 4
Robotics           4
Diffusion          3
Robot Learning     2
Python / Algo      2
```

Suggested problems:

```text
Implement Softmax
Implement LayerNorm
Implement Scaled Dot-Product Attention
Implement Multi-Head Attention
Implement Causal Mask

Compute Discounted Returns
Implement GAE
Implement PPO Clip Objective
Normalize GRPO Group Advantages

Euler to Quaternion
Quaternion Multiplication
Quaternion SLERP
SE(3) Point Transform

DDPM Forward Noise Step
Linear Noise Schedule
Flow Matching Target

Replay Buffer
Action Chunking

Sliding Window
Top-K Frequency
```

Each problem should include:

```text
title
slug
difficulty
description
starter_code
visible examples
hidden tests
topics
```

Do not include solution code in client-accessible seed paths if deployment tooling could expose it.

## Acceptance Criteria

- 20 problems seed successfully
- At least 3 hidden tests per non-trivial problem
- Edge cases included
- Problems are non-duplicative

---

# Task 30 — Seed Test Case Quality Audit

## Goal

Audit hidden tests for correctness.

Check:

```text
normal case
edge case
empty/minimal case where valid
shape/length boundary
numerical tolerance if needed
```

For float problems, define tolerance behavior explicitly.

Do not compare raw floating output strings naively if numerical tolerance is required.

## Acceptance Criteria

- Deterministic expected outputs
- Hidden tests catch naive incorrect solutions
- No invalid constraints

---

# Task 31 — Output Comparison Helper

## Goal

Implement normalized output comparison.

For Week 4 support:

```text
exact text
trimmed text
numeric tolerance
```

Problem configuration may define comparison mode.

If adding schema:

```text
comparison_mode text
tolerance numeric
```

keep it minimal.

## Acceptance Criteria

- Whitespace differences handled intentionally
- Float tasks can use tolerance
- Hidden judge logic remains server-side

---

# Task 32 — Coding Topic Integration

## Goal

Connect Coding problems to Week 2 topics.

Example:

```text
Implement GRPO Advantage
→ RL
→ GRPO

Quaternion SLERP
→ Robotics
→ Quaternion
```

Topic chips should link to Knowledge topic pages where appropriate.

## Acceptance Criteria

- Topic relations reused
- No duplicate coding-only taxonomy unless necessary
- Broken topic does not crash

---

# Task 33 — Interview → Coding Problem Linking Preparation

## Goal

Prepare schema for Week 5+ linking interview coding occurrences to canonical coding problems.

Do not build full feature yet.

Add optional field to `interview_questions` if appropriate:

```text
coding_problem_id uuid
```

or create a relation table if cleaner.

Use migration only if not already modeled.

Important:

```text
canonical knowledge question
and
canonical coding problem
```

are distinct entities.

## Acceptance Criteria

- Existing interview question rows remain valid
- An interview question can link to either Knowledge or Coding entity
- No forced polymorphic JSON

---

# Task 34 — Coding Mobile UX Audit

## Goal

Make coding usable on mobile without pretending phone coding is primary.

Test:

```text
375px
430px
768px
```

Recommended mobile behavior:

```text
Problem tab
Code tab
Result tab
```

rather than horizontal split.

## Acceptance Criteria

- Monaco usable
- Buttons reachable
- No horizontal page overflow
- Console scrolls independently

---

# Task 35 — Coding Desktop UX Audit

## Goal

Optimize for laptop/desktop usage.

Test:

```text
1024px
1280px
1440px
1728px
```

Review:

```text
problem/editor split
editor height
console height
Run/Submit placement
resizing
line length
```

## Acceptance Criteria

- Comfortable editor area
- Problem statement not too narrow
- Console does not permanently consume excessive space

---

# Task 36 — Coding Accessibility Audit

## Goal

Ensure keyboard and semantic accessibility.

Check:

```text
Run button
Submit button
tabs
editor labels
problem headings
status announcements
focus states
filter controls
```

Use live region for judge status only if appropriate.

## Acceptance Criteria

- Keyboard users can operate page chrome
- Buttons have meaningful labels
- Status not conveyed by color alone

---

# Task 37 — Coding Performance Audit

## Goal

Keep Monaco isolated from non-coding pages and avoid unnecessary JS.

Review:

```text
dynamic import Monaco
client component boundaries
server-side problem fetch
submission polling
bundle size
```

Do not load Monaco on:

```text
/
knowledge
interviews
companies
```

## Acceptance Criteria

- Monaco only loaded on coding workspace
- Problem metadata fetched server-side
- No excessive polling
- Build size reviewed

---

# Task 38 — Submission Polling Strategy

## Goal

Implement a safe client update mechanism if judge completion is asynchronous.

Use:

```text
short polling
```

for MVP.

Example:

```text
poll every 1–2 seconds
stop on terminal status
stop after max duration
```

Do not use realtime infrastructure unless it clearly simplifies existing architecture.

## Acceptance Criteria

- Polling stops
- No infinite requests
- Terminal state handled
- Browser refresh can recover submission status

---

# Task 39 — Coding Utility Tests

## Goal

Add focused automated tests.

Test:

```text
filter parsing
status normalization
submission aggregation
output comparison
solved-state derivation
acceptance-rate calculation
rate-limit helper
```

Judge adapter external calls should be mocked.

## Acceptance Criteria

- Tests run offline
- No real judge API required
- Core logic covered

---

# Task 40 — Judge Adapter Integration Test

## Goal

Add an optional integration script for development.

Create:

```text
scripts/test-judge.ts
```

Run a small Python program through configured judge provider:

```python
print(1 + 1)
```

Verify:

```text
status accepted
stdout = 2
```

Do not run this automatically in CI unless judge service is available.

## Acceptance Criteria

- Readable success/failure output
- No secret logging
- Documented command

---

# Task 41 — Coding Integrity Script

## Goal

Detect bad coding problem data.

Create:

```text
scripts/check-coding-integrity.ts
```

Check:

```text
published problem has starter code
published problem has at least one visible example
published problem has hidden tests
slug unique
difficulty valid
time limit > 0
memory limit > 0
topic links valid
```

## Acceptance Criteria

- Clean seed passes
- Broken fixture fails
- Non-zero exit on violation

---

# Task 42 — README Coding Setup

## Goal

Document local coding/judge setup.

README section should include:

```text
Judge provider
Environment variables
How to run a problem
How to seed coding problems
How to test judge
Security limitations
Production notes
```

Clearly document:

```text
Python-only in Week 4
Judge0 or configured backend
No GPU support
```

## Acceptance Criteria

A developer can configure the judge without reading source code.

---

# Task 43 — Coding Security Audit

## Goal

Perform a focused security review.

Check:

```text
hidden test leakage
solution leakage
service-role leakage
judge API key leakage
other-user submission leakage
source size limits
rate limits
server-only test loading
error sanitization
```

Document findings:

```text
docs/week4-security.md
```

## Acceptance Criteria

- No hidden test accessible through browser client
- No provider secret in client bundle
- RLS verified
- Known MVP limitations documented

---

# Task 44 — Coding Integration Audit

## Goal

Perform final Week 4 end-to-end audit.

Do not add major features here.

## Flow A — Browse

```text
/coding
→ filter Robotics
→ open Quaternion SLERP
```

## Flow B — Run

```text
edit code
→ Run
→ visible tests
→ inspect output
```

## Flow C — Wrong Submit

```text
Submit incorrect code
→ hidden tests
→ Wrong Answer
```

## Flow D — Accepted Submit

```text
Submit correct code
→ Accepted
→ solved state updates
```

## Flow E — Runtime Error

```text
submit crashing code
→ Runtime Error
```

## Flow F — Timeout

```text
submit infinite loop
→ TLE
```

## Flow G — Submission History

```text
problem
→ previous submissions
→ submission detail
```

## Flow H — Security

```text
anonymous browser
→ attempt hidden test query
→ denied
```

---

## Run

Use existing repository scripts:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run optional judge integration test if environment is configured.

Fix all Week 4 regressions.

---

## Deliverable

Create:

```text
docs/week4-status.md
```

Include:

```text
Implemented
Routes
Database migrations
Judge architecture
Provider configuration
Security model
Seed problems
Known limitations
Deferred to Week 5
```

---

# Recommended Execution Order

Give Codex tasks in this order:

```text
01 Coding Schema
02 Coding RLS
03 Coding Domain Types
04 Coding Query Layer
05 Coding URL Filters
06 Coding List Page
07 Coding Search
08 Coding Problem Detail Route
09 Monaco Editor Integration
10 Coding Workspace Layout
11 Problem Statement Component
12 Visible Example Test Cases
13 Judge Service Abstraction
14 Judge Environment Configuration
15 Judge0 Adapter
16 Server-Side Code Execution API
17 Run Action
18 Submit Action
19 Submission Status Aggregation
20 Judge Result Component
21 Console Panel
22 Submission History
23 Submission Detail Page
24 Solved / Attempted Problem State
25 Acceptance Rate Helper
26 Basic Judge Rate Limiting
27 Source Code Size Limits
28 Judge Timeout / Failure Handling
29 Seed 20 Coding Problems
30 Seed Test Case Quality Audit
31 Output Comparison Helper
32 Coding Topic Integration
33 Interview → Coding Problem Linking Preparation
34 Coding Mobile UX Audit
35 Coding Desktop UX Audit
36 Coding Accessibility Audit
37 Coding Performance Audit
38 Submission Polling Strategy
39 Coding Utility Tests
40 Judge Adapter Integration Test
41 Coding Integrity Script
42 README Coding Setup
43 Coding Security Audit
44 Coding Integration Audit
```

Do not give all 44 tasks to Codex in one prompt.

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
feat(db): add coding problem and submission schema
feat(coding): add typed query and filtering layer
feat(coding): build problem discovery page
feat(coding): add problem workspace and Monaco editor
feat(judge): add execution service abstraction
feat(judge): integrate Python judge provider
feat(coding): add run and submit flows
feat(coding): add submission history and solved state
content: seed coding problem set
test(coding): add judge and utility tests
security: harden coding execution boundary
chore: complete week 4 audit
```

---

# Codex Global Instruction — Week 4

Paste this at the beginning of a fresh Codex session:

```text
You are implementing Week 4 of RoboPrep, a production-oriented Embodied AI interview preparation platform.

Week 1 established:
- Next.js App Router
- TypeScript
- Supabase
- authentication
- Apple-inspired design system

Week 2 established:
- Knowledge System
- topic hierarchy
- canonical questions
- question relations

Week 3 established:
- Interview System
- interview rounds
- question occurrences
- provenance
- canonical question linking

Week 4 goal:
Build the complete Python-only Coding MVP.

Core coding flow:

Coding Problem
→ Code Editor
→ Run
→ Submit
→ Judge
→ Result
→ Submission History

Engineering rules:

1. Inspect the existing repository before modifying code.
2. Preserve working Week 1–3 functionality.
3. Use Python only in Week 4.
4. Do not implement C++, Java, GPU, CUDA, or PyTorch execution yet.
5. Keep judge provider behind an abstraction.
6. Do not let page components call Judge0 directly.
7. Never send hidden tests to the browser.
8. Never expose solution code to public clients.
9. Never expose judge API keys to client code.
10. Judge routes must load hidden tests server-side.
11. Submission status must be server-authoritative.
12. Use strict TypeScript.
13. Reuse existing UI primitives, topic taxonomy, filters, pagination, and auth.
14. Use Server Components by default.
15. Monaco should only load inside coding routes.
16. Add client components only where interactive behavior requires them.
17. Do not build custom Firecracker / Docker / Kubernetes infrastructure this week.
18. Do not add AI-generated solutions.
19. Do not add leaderboards or contests.
20. After each task, run relevant lint/typecheck/test/build checks.
21. Fix issues introduced by your changes.
22. Summarize:
    - files changed
    - schema changes
    - judge architecture
    - commands run
    - security implications
    - limitations

Security model:

Browser
→ RoboPrep server
→ hidden tests + limits
→ Judge Service
→ execution provider

The browser must never receive:
- hidden test input
- hidden expected output
- solution code
- provider API keys
- service-role keys

Visual direction:

The Coding page can be denser than Knowledge and Interview pages.

Use:
- clean split workspace
- restrained borders
- clear code/editor hierarchy
- compact metadata
- minimal color
- obvious Run / Submit actions

Avoid:
- neon IDE themes
- cyberpunk UI
- excessive animation
- cluttered toolbars
- copying LeetCode visual styling exactly

RoboPrep should feel like an Apple-designed technical coding workspace.
```

---

# Week 4 Suggested Route Map

At the end of Week 4:

```text
/coding

/coding?difficulty=medium
/coding?category=robotics
/coding?topic=grpo
/coding?status=solved
/coding?q=attention

/coding/[slug]

/coding/submissions/[id]
```

Examples:

```text
/coding/implement-multi-head-attention
/coding/quaternion-slerp
/coding/grpo-group-advantage
```

---

# Suggested Component Structure

```text
src/components/coding/

coding-search.tsx
coding-filters.tsx
coding-problem-card.tsx
coding-problem-list.tsx

coding-workspace.tsx
problem-statement.tsx
example-cases.tsx

code-editor.tsx
console-panel.tsx
judge-result.tsx

submission-history.tsx
submission-status.tsx
```

Do not force this exact split if a smaller cleaner structure is better.

---

# Suggested Judge Architecture

```text
Browser
   │
   │ Run / Submit
   ▼
Next.js Server Route
   │
   ├── validate auth
   ├── validate problem
   ├── load test cases
   ├── load limits
   │
   ▼
JudgeService
   │
   ▼
Judge0Adapter
   │
   ▼
Execution Provider
```

Later:

```text
JudgeService
├── Judge0Adapter
└── RoboPrepSandboxAdapter
```

This is why provider isolation matters in Week 4.

---

# Coding Problem Design Principle

RoboPrep coding should not become:

```text
generic LeetCode clone
```

The long-term differentiation should be:

```text
ML implementation
Transformer implementation
RL implementation
Robotics math
Robot learning utilities
Diffusion implementation
```

Example progression:

```text
Easy
Implement Softmax

Medium
Implement Multi-Head Attention

Medium
Quaternion SLERP

Medium
Compute GAE

Hard
Implement GRPO Loss

Hard
Implement Diffusion Policy Training Step
```

Week 4 lays the judge foundation for this.

---

# Judge Security Principle

Never trust:

```text
client source metadata
client expected output
client time limit
client test cases
client final status
```

The server owns all judge configuration.

The client provides only:

```text
problem identifier
source code
```

plus language if multi-language support is added later.

---

# Week 5 Handoff

Once Week 4 is accepted, Week 5 should focus on:

```text
Embodied / ML Coding Expansion
```

Recommended Week 5 scope:

```text
50+ high-quality coding problems
PyTorch-oriented evaluator
shape checks
numerical checks
gradient checks
custom function harness
better submission analytics
coding progress
problem completion state
problem collections
```

Do not jump to GPU execution immediately.

A CPU-only PyTorch evaluator can cover a large portion of ML interview coding tasks first.
