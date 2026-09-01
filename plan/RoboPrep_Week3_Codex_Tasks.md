# RoboPrep — Week 3 Codex Implementation Tasks

> Goal: implement the complete **Interview System MVP** for RoboPrep.
>
> Week 3 should turn RoboPrep from a structured knowledge base into a real interview intelligence product by connecting:
>
> ```text
> Company
> → Position
> → Interview
> → Round
> → Interview Question
> → Canonical Knowledge Question
> ```
>
> Reuse Week 2 Knowledge components wherever possible.
>
> Do not implement interview ingestion automation, Coding Judge, or Company Intelligence dashboards yet.

---

# Week 3 Definition of Done

By the end of Week 3, users should be able to:

```text
open /interviews
→ browse interview records
→ filter by company / role / year / season
→ open an interview detail page
→ inspect interview rounds
→ see questions in original interview order
→ open linked canonical Knowledge questions
→ understand source / verification status
→ navigate from canonical Knowledge question back to interview provenance
```

The Interview System should make this relationship explicit:

```text
Raw interview occurrence
        │
        ▼
Interview Question
        │
        ├── original wording
        ├── round
        ├── order
        └── canonical question
                │
                ▼
        Knowledge System
```

Week 3 must prioritize:

```text
source provenance
structured rounds
canonical linking
clear filtering
data quality state
reusable interview query layer
```

over social/community features.

---

# Week 3 Scope

Implement:

```text
Interview list
Interview detail
Interview filters
Company filter
Position filter
Year filter
Season filter
Interview round structure
Original question wording
Canonical question links
Source metadata
Verification state
Interview quality metadata
Interview stats
Interview breadcrumbs
Interview search
Related interviews
Knowledge ↔ Interview navigation refinement
```

Do not implement:

```text
User interview submission
LLM interview parsing
Admin moderation dashboard
Coding Judge
AI mock interview
Company analytics dashboard
Referral / jobs board
Comments / likes / social feed
```

---

# Task 1 — Interview Schema Audit and Extension

## Goal

Review the Week 1 `interviews` schema and extend it only where necessary for a complete Interview MVP.

Create migration:

```text
supabase/migrations/0005_interview_schema.sql
```

Do not duplicate existing columns.

## Review Existing `interviews`

Expected Week 1 fields may include:

```text
id
company_id
position_id
year
season
location
interview_type
source_type
source_url
status
created_by
created_at
updated_at
verified_at
```

## Add Fields If Missing

Recommended fields:

```text
title text
slug text unique
round_count integer
duration_minutes integer
experience_level text
employment_type text
application_stage text
summary text
difficulty_overall text
language text default 'zh-CN'
is_anonymous boolean default true
quality_score numeric
published_at timestamptz
```

Initial `experience_level` values:

```text
intern
new_grad
experienced
unknown
```

Initial `employment_type` values:

```text
internship
full_time
contract
unknown
```

Initial `application_stage` values:

```text
screening
technical
onsite
final
mixed
unknown
```

Initial difficulty:

```text
easy
medium
hard
unknown
```

---

## Add `interview_rounds`

Create:

```text
interview_rounds
```

Fields:

```text
id uuid primary key
interview_id uuid not null
round_number integer not null
title text
round_type text
duration_minutes integer
interviewer_role text
summary text
created_at timestamptz
updated_at timestamptz
```

Initial `round_type` values:

```text
recruiter
technical
coding
research
manager
behavioral
mixed
unknown
```

Unique constraint:

```text
(interview_id, round_number)
```

---

## Extend `interview_questions`

If Week 1 already has:

```text
round_number
order_index
original_wording
```

keep them.

Add:

```text
round_id uuid
notes text
question_context text
answer_summary text
difficulty text
```

Foreign key:

```text
round_id → interview_rounds.id
```

The canonical relation remains:

```text
question_id → questions.id
```

---

## Add `interview_tags`

Create if useful:

```text
interview_tags
```

Fields:

```text
interview_id uuid
tag text
created_at timestamptz
```

Composite primary key:

```text
(interview_id, tag)
```

Use only for light metadata such as:

```text
remote
onsite
english
coding-heavy
research-heavy
```

Do not use tags to duplicate company / topic / season fields.

---

## Acceptance Criteria

- Migration works on existing Week 2 database
- Interview rounds are first-class entities
- Questions may map to rounds
- Canonical question relationship remains intact
- Existing data remains readable
- No redundant JSON blobs for rounds/questions

## Do Not

- Do not store whole interviews as Markdown blobs only
- Do not store all rounds in one JSON column
- Do not remove `original_wording`
- Do not merge raw interview occurrences with canonical questions

---

# Task 2 — Interview RLS Update

## Goal

Update RLS for new Interview entities.

Create:

```text
supabase/migrations/0006_interview_rls.sql
```

## Public Read Rules

Anonymous users may read:

```text
published interviews
rounds belonging to published interviews
interview questions belonging to published interviews
public interview tags
```

## Private Rules

Do not allow anonymous mutation.

Do not allow normal users to publish or verify interviews directly.

## Acceptance Criteria

- Draft interview content is never publicly readable
- Public interview detail pages work without service-role key
- Round/question records respect parent interview status
- No hidden moderation fields leak unnecessarily

---

# Task 3 — Interview Domain Types

## Goal

Create explicit TypeScript types for Interview features.

## File

Create:

```text
src/types/interview.ts
```

## Define

```text
InterviewSummary
InterviewDetail
InterviewRound
InterviewQuestionOccurrence
InterviewFilters
InterviewSort
InterviewSource
InterviewVerificationState
RelatedInterview
```

Recommended filter shape:

```ts
type InterviewFilters = {
  query?: string;
  company?: string;
  position?: string;
  year?: number;
  season?: string;
  experienceLevel?: string;
  employmentType?: string;
  difficulty?: string;
};
```

Recommended sort:

```text
latest
most_questions
most_relevant
difficulty
```

Do not expose raw database rows directly to UI components if normalization is needed.

## Acceptance Criteria

- UI receives typed normalized data
- No `any`
- Question occurrence type includes canonical question summary when available
- Round types are explicit

---

# Task 4 — Interview Query Layer

## Goal

Centralize all Interview data fetching.

## Files

Create:

```text
src/lib/interviews/
├── queries.ts
├── filters.ts
├── mappers.ts
├── constants.ts
└── helpers.ts
```

## Required Query Functions

Implement server-side functions similar to:

```ts
getInterviews(...)
getInterviewBySlug(...)
getInterviewRounds(...)
getInterviewQuestions(...)
getInterviewFilterOptions(...)
getRelatedInterviews(...)
getRecentInterviews(...)
getInterviewCountByCompany(...)
```

All use the Supabase server client.

Do not query Supabase directly from page cards.

---

## `getInterviews`

Support:

```text
query
company
position
year
season
experience_level
employment_type
difficulty
sort
page
page_size
```

Return:

```text
items
page
page_size
total
total_pages
```

Default:

```text
page_size = 20
```

---

## Acceptance Criteria

- List/detail pages use the query layer
- No N+1 queries for company/position metadata
- Canonical question info can be loaded efficiently
- Draft content is excluded
- Pagination total is correct

---

# Task 5 — Interview URL Filter State

## Goal

Make interview discovery shareable and reproducible through URLs.

Example:

```text
/interviews
/interviews?company=bytedance
/interviews?year=2027&season=spring
/interviews?position=vla-research-intern
/interviews?difficulty=hard
/interviews?q=grpo
```

## Requirements

Search parameters are the source of truth.

Validate and normalize:

```text
year
season
difficulty
experienceLevel
employmentType
sort
page
```

Unknown values should degrade safely.

## Acceptance Criteria

- Back/forward navigation works
- Refresh preserves filters
- Invalid params do not crash rendering
- Changing filters resets page to 1

---

# Task 6 — Interview List Page

## Goal

Turn `/interviews` into a polished real interview discovery page.

## Route

```text
src/app/interviews/page.tsx
```

## Suggested Layout

```text
Interviews

Real Embodied AI interview experiences,
organized by company, role, and question.

[ Search interviews... ]

Company
Role
Year
Season
Difficulty

Sort: Latest

────────────────────────

Interview Cards
```

## Card

Create:

```text
src/components/interviews/interview-card.tsx
```

Suggested content:

```text
ByteDance

VLA Research Intern
2027 Spring · Beijing

3 rounds · 11 questions
Medium

Topics:
VLA · GRPO · Diffusion Policy

Updated 2 days ago
```

Only show actual computed data.

## Acceptance Criteria

- Real DB content renders
- Responsive layout works
- Empty state is polished
- Filters integrate with URL state
- Cards are not overloaded

---

# Task 7 — Interview Search

## Goal

Support practical interview search.

Search across:

```text
interviews.title
interviews.summary
company name
position title
original question wording
```

Optional canonical question title search if efficient.

## Strategy

Use PostgreSQL text search / `ILIKE` / `pg_trgm`.

Do not add Elasticsearch.

If needed, create:

```text
supabase/migrations/0007_interview_search.sql
```

## Acceptance Criteria

Searches such as:

```text
GRPO
VLA
ByteDance
Diffusion Policy
robot data
```

return relevant interviews.

---

# Task 8 — Filter Option Query

## Goal

Avoid hardcoding company, role, year, and season filter options in the frontend.

## Query

Implement:

```ts
getInterviewFilterOptions()
```

Return values derived from published content:

```text
companies
positions
years
seasons
difficulty values
```

## Requirements

Filter options should be stable and sorted.

Company should use:

```text
name
slug
```

Position:

```text
title
slug
company_id if relevant
```

## Acceptance Criteria

- Filter controls use real DB options
- Empty options do not crash UI
- No duplicate company entries
- Year sorted newest first

---

# Task 9 — Interview Filter Components

## Goal

Build reusable interview filters.

## Components

Create:

```text
src/components/interviews/
├── interview-search.tsx
├── interview-filters.tsx
├── company-filter.tsx
├── position-filter.tsx
├── year-filter.tsx
└── season-filter.tsx
```

Exact file split may be consolidated if cleaner.

## UX

Desktop:

```text
inline / compact filter row
```

Mobile:

```text
filter button
→ sheet/modal
```

Avoid permanent dense sidebar unless it clearly improves usability.

## Acceptance Criteria

- Keyboard accessible
- URL-driven
- Clear all filters
- Mobile usable
- No excessive client state

---

# Task 10 — Interview Detail Route

## Goal

Implement the primary Interview detail experience.

## Route

```text
/interviews/[slug]
```

## Recommended Structure

```text
breadcrumb

ByteDance
VLA Research Intern

2027 Spring · Beijing
Internship
3 rounds
11 questions
Medium

Source / Verification

────────────────────────

Overview

────────────────────────

Round 1 — Technical
45 min

01
Why does GRPO not require a critic?

Original wording:
"为什么 GRPO 不需要 value model？"

[Open Knowledge Answer]

02
Explain Diffusion Policy.

...

────────────────────────

Round 2 — Coding
...

────────────────────────

Topics

────────────────────────

Related Interviews
```

## Acceptance Criteria

- Unknown slug returns 404
- Draft interviews are inaccessible
- Rounds appear in correct order
- Questions appear in correct order
- Canonical Knowledge links work
- Original wording is preserved

---

# Task 11 — Interview Header

## Goal

Create a reusable header component for interview metadata.

## Component

```text
src/components/interviews/interview-header.tsx
```

Display:

```text
company
position
year + season
location
employment type
experience level
difficulty
round count
question count
```

Optional logo if available.

Do not make the logo or company branding dominate the page.

## Acceptance Criteria

- Handles missing metadata
- Does not show “unknown” excessively
- Mobile layout remains compact

---

# Task 12 — Source and Verification Metadata

## Goal

Make provenance visible without cluttering the main interview content.

## Component

Create:

```text
src/components/interviews/interview-source.tsx
```

Support source types such as:

```text
user_submission
public_source
editorial
community
development_seed
```

Verification states:

```text
unverified
reviewed
verified
```

If current schema uses `status` and `verified_at`, derive UI state rather than adding redundant fields unnecessarily.

## Example

```text
Source
Community submission

Status
Reviewed

Last updated
Aug 28, 2026
```

If a public source URL exists, display:

```text
View original source
```

only when safe and intended.

## Acceptance Criteria

- Development seed records are not presented as verified real interviews
- Source label is clear
- Verification language is not misleading
- Raw source URL is not dumped as plain text

---

# Task 13 — Interview Round Component

## Goal

Render interview rounds consistently.

## Component

Create:

```text
src/components/interviews/interview-round.tsx
```

Display:

```text
Round number
Round title
Round type
Duration
Interviewer role if known
Summary
Question list
```

Example:

```text
Round 1
Technical Interview

45 min · Research Engineer

Focus:
VLA architecture, GRPO, robot data
```

## Acceptance Criteria

- Rounds sort ascending
- Missing metadata is omitted
- Questions remain nested in correct round
- No arbitrary visual color per round

---

# Task 14 — Interview Question Occurrence Component

## Goal

Render a question occurrence while distinguishing:

```text
original interview wording
vs
canonical question
```

## Component

Create:

```text
src/components/interviews/interview-question.tsx
```

Example:

```text
03

为什么 GRPO 不需要 value model？

Canonical question
Why does GRPO not require a critic?

GRPO · PPO · RL

[View Answer]
```

If original wording equals canonical title, avoid duplication.

## Requirements

Support:

```text
question number
original wording
canonical title
difficulty
topics
answer summary if available
notes if available
```

## Acceptance Criteria

- Canonical Knowledge link is obvious
- Original wording is never lost
- Unlinked questions render gracefully
- No duplicated title when identical

---

# Task 15 — Unlinked Interview Questions

## Goal

Handle interview questions that do not yet map to a canonical Knowledge question.

This is important for future ingestion workflows.

## Behavior

If:

```text
question_id is null
```

or canonical record is missing:

Render:

```text
Original question

Not yet linked to a Knowledge answer.
```

Do not expose an admin action publicly.

## Acceptance Criteria

- Interview detail page never crashes due to an unlinked question
- UI clearly distinguishes unresolved canonical mapping
- No fake answer is generated

---

# Task 16 — Interview Topic Summary

## Goal

Show which knowledge areas dominate an interview.

Derive topics from:

```text
interview_questions
→ questions
→ question_topics
→ topics
```

## Component

Create:

```text
src/components/interviews/interview-topics.tsx
```

Display top topics only, e.g.:

```text
VLA
GRPO
Diffusion Policy
Robot Data
Transformer
```

Optional count:

```text
GRPO · 3 questions
```

only if real.

## Acceptance Criteria

- No duplicate topics
- Parent/child topics are handled sensibly
- Topic chips link to Knowledge topic pages
- Maximum list remains readable

---

# Task 17 — Interview Overview Summary

## Goal

Provide a concise top-level summary before detailed rounds.

## Component

Create:

```text
src/components/interviews/interview-overview.tsx
```

Potential fields:

```text
summary
difficulty
round count
question count
technical focus
coding presence
research focus
```

Example:

```text
This interview focused heavily on VLA architecture and RL post-training,
with one implementation-oriented coding round.
```

Only use stored or deterministic metadata.

Do not generate new AI prose at render time.

## Acceptance Criteria

- Summary is optional
- No duplicated header information
- No runtime LLM calls

---

# Task 18 — Interview Pagination

## Goal

Add reliable server-side interview pagination.

Use:

```text
?page=2
```

Preserve all filters.

Reuse the Week 2 pagination component where possible.

## Acceptance Criteria

- Correct count
- Filters persist
- Invalid page values handled
- No duplicate pagination implementation if existing component works

---

# Task 19 — Interview Sort

## Goal

Support useful sorting modes.

Initial values:

```text
latest
most_questions
difficulty
```

Optional:

```text
most_relevant
```

only when search relevance is actually calculated.

Recommended semantics:

### latest

```text
published_at desc
fallback created_at desc
```

### most_questions

```text
question count desc
```

### difficulty

Document ordering.

For example:

```text
hard
medium
easy
unknown
```

## Acceptance Criteria

- Sort is URL-driven
- Sort labels are understandable
- No fake relevance sort

---

# Task 20 — Related Interviews

## Goal

Help users discover similar interview experiences.

## Query

Implement:

```ts
getRelatedInterviews(interviewId)
```

Simple deterministic ranking based on:

```text
same company
same position category
overlapping canonical questions
overlapping topics
same year/season
```

Do not build ML recommendation.

## Component

Create:

```text
src/components/interviews/related-interviews.tsx
```

Limit:

```text
3–5
```

## Acceptance Criteria

- Current interview excluded
- No duplicates
- Ranking is documented
- Missing related interviews hides the section

---

# Task 21 — Knowledge → Interview Provenance Refinement

## Goal

Refine Week 2 `Interview Occurrences` so it links correctly into Week 3 Interview detail pages.

Update:

```text
src/components/knowledge/interview-occurrences.tsx
```

Each occurrence should link to:

```text
/interviews/[slug]
```

Display:

```text
Company
Position
Year / Season
Round if known
```

Example:

```text
ByteDance · VLA Research Intern
2027 Spring · Round 1
```

## Acceptance Criteria

- Links resolve
- Draft interviews excluded
- Round metadata shown when available
- No duplicated provenance implementation

---

# Task 22 — Interview Breadcrumbs

## Goal

Add consistent navigation context.

Example:

```text
Interviews
/
ByteDance
/
VLA Research Intern — 2027 Spring
```

If Companies pages are not implemented yet, do not create dead links.

## Acceptance Criteria

- Accessible breadcrumb semantics
- Mobile-safe
- No dead navigation

---

# Task 23 — Interview SEO Metadata

## Goal

Make public interview pages indexable without exposing sensitive/private data.

## List Page

Example:

```text
Embodied AI Interview Experiences — RoboPrep
```

## Detail

Example:

```text
ByteDance VLA Research Intern Interview — 2027 Spring | RoboPrep
```

Description from interview summary if present.

Do not include:

```text
candidate identity
private contact info
unverified sensitive personal details
```

## Acceptance Criteria

- Dynamic metadata works
- Draft interviews do not generate public pages
- Titles remain concise
- Canonical URL set where appropriate

---

# Task 24 — Interview Empty / Loading / Error States

## Goal

Polish all data states.

Create or update:

```text
/interviews/loading.tsx
/interviews/error.tsx
/interviews/[slug]/loading.tsx
```

Use:

```text
skeletons
clear empty-state copy
safe 404 behavior
```

Examples:

```text
No interviews match these filters.

Clear filters or try another company.
```

## Acceptance Criteria

- No giant loading spinner
- No raw database errors shown
- Empty filters easy to reset
- Unknown interview slug returns 404

---

# Task 25 — Seed Structured Interview Data

## Goal

Expand development seed data enough to properly test Week 3.

Target:

```text
15–20 interviews
```

across:

```text
ByteDance
NVIDIA
Physical Intelligence
Figure AI
Unitree
AgiBot
DJI
```

Include variety:

```text
internship
new grad
research
engineering
1–4 rounds
knowledge-heavy
coding-heavy
research-heavy
```

Each interview should have:

```text
company
position
year
season
status
source_type
summary
rounds
ordered questions
canonical links where available
```

## Important

Development seed data must not masquerade as verified real interview data.

Use:

```text
source_type = development_seed
```

or equivalent.

## Acceptance Criteria

- At least 15 interviews
- At least 30 total round records
- At least 80 interview question occurrences
- Many-to-one canonical mapping is demonstrated
- Some unlinked questions exist for edge-case testing

---

# Task 26 — Interview Data Integrity Script

## Goal

Create a script to detect invalid Interview graph relationships.

## File

Create:

```text
scripts/check-interview-integrity.ts
```

Check:

```text
published interview has company
position belongs to company when applicable
round numbers unique
question order unique within round where expected
round_id belongs to same interview
canonical question exists when question_id is set
published interview does not reference draft-only content unexpectedly
```

Print readable errors.

Return non-zero exit code when integrity violations exist.

## Acceptance Criteria

- Script catches intentionally broken fixture
- Clean seed passes
- Script does not mutate DB

---

# Task 27 — Interview Stats Helper

## Goal

Derive simple interview-level statistics.

Support:

```text
round_count
question_count
linked_question_count
coding_question_count
topic_count
```

Prefer computed query/helper rather than storing duplicated counters unless performance requires otherwise.

## File

Possible:

```text
src/lib/interviews/helpers.ts
```

## Acceptance Criteria

- Counts are deterministic
- Unlinked questions count toward total question count
- No conflicting duplicated stored counters

---

# Task 28 — Mobile Interview Detail Audit

## Goal

Ensure long interview pages remain usable on phones.

Test:

```text
375px
430px
768px
```

Review:

```text
round spacing
question numbering
long Chinese questions
long English questions
metadata wrapping
topic chips
source block
buttons
breadcrumbs
```

## Acceptance Criteria

- No horizontal overflow
- No cramped two-column metadata on mobile
- Question hierarchy remains obvious
- Tap targets are usable

---

# Task 29 — Desktop Interview Reading Audit

## Goal

Optimize desktop readability.

Test:

```text
1024px
1280px
1440px
1728px
```

Recommended:

```text
main reading width ~800px
optional metadata rail
```

Do not stretch full-width question text across large monitors.

## Acceptance Criteria

- Comfortable line length
- Rounds visually separable
- Metadata rail does not dominate
- Apple-inspired whitespace preserved

---

# Task 30 — Accessibility Audit

## Goal

Ensure Interview features are accessible.

Check:

```text
heading hierarchy
breadcrumb semantics
keyboard navigation
filter labels
select/menu labels
source links
question links
focus states
color contrast
```

Recommended heading structure:

```text
h1 Interview title
h2 Overview
h2 Round 1
h3 Question if necessary
```

## Acceptance Criteria

- Keyboard usable
- No clickable divs
- Icon buttons labeled
- Forms have accessible labels

---

# Task 31 — Interview Performance Audit

## Goal

Keep Interview pages server-first and efficient.

Review:

```text
server queries
join strategy
bundle size
client components
N+1 risks
duplicate loading
```

Avoid:

```text
one client fetch per round
one client fetch per question
loading all interviews client-side
```

Preferred:

```text
detail page
→ one/few server-side aggregate queries
→ normalized typed object
→ render
```

## Acceptance Criteria

- Main pages are Server Components
- No redundant browser data fetch
- Interview detail does not produce N+1 round/question queries
- Large seed database remains responsive

---

# Task 32 — Interview Utility Tests / Smoke Tests

## Goal

Add focused tests around Interview logic.

Test:

```text
filter parsing
sort normalization
round grouping
question ordering
related interview ranking
stats calculation
source state mapping
```

Examples:

### Round grouping

```text
Round 1:
q1, q2

Round 2:
q3
```

must preserve order.

### Related interviews

Current interview must never be returned.

### Filters

Invalid year / season / difficulty should safely normalize.

## Acceptance Criteria

- Tests run with one documented command
- No production network dependency
- Core non-UI logic covered

---

# Task 33 — Interview Integration Audit

## Goal

Perform the full Week 3 integration pass.

Do not add major new features here.

## Required Flow A — Browse

```text
/interviews
→ filter ByteDance
→ filter 2027 Spring
→ open interview
```

## Flow B — Round Navigation

```text
Interview detail
→ Round 1
→ Question 3
→ canonical Knowledge answer
```

## Flow C — Provenance

```text
Knowledge question
→ Seen in Interviews
→ open interview
→ original wording
```

## Flow D — Search

```text
/interviews?q=grpo
→ relevant interviews
```

## Flow E — Unlinked Question

```text
Interview
→ unresolved question
→ renders safely without fake answer
```

## Flow F — Source

```text
Interview
→ source metadata
→ verification status
```

---

## Run

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Use actual repository scripts only.

Fix all Week 3 regressions.

---

## Deliverable

Create:

```text
docs/week3-status.md
```

Include:

```text
Implemented
Routes
Database migrations
Interview query architecture
Source / verification model
Seed data
Known limitations
Deferred to Week 4
```

---

# Recommended Execution Order

Give Codex tasks in this order:

```text
01 Interview Schema Audit and Extension
02 Interview RLS Update
03 Interview Domain Types
04 Interview Query Layer
05 Interview URL Filter State
06 Interview List Page
07 Interview Search
08 Filter Option Query
09 Interview Filter Components
10 Interview Detail Route
11 Interview Header
12 Source and Verification Metadata
13 Interview Round Component
14 Interview Question Occurrence Component
15 Unlinked Interview Questions
16 Interview Topic Summary
17 Interview Overview Summary
18 Interview Pagination
19 Interview Sort
20 Related Interviews
21 Knowledge → Interview Provenance Refinement
22 Interview Breadcrumbs
23 Interview SEO Metadata
24 Interview Empty / Loading / Error States
25 Seed Structured Interview Data
26 Interview Data Integrity Script
27 Interview Stats Helper
28 Mobile Interview Detail Audit
29 Desktop Interview Reading Audit
30 Accessibility Audit
31 Interview Performance Audit
32 Interview Utility Tests / Smoke Tests
33 Interview Integration Audit
```

Do not hand all 33 tasks to Codex in one prompt.

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

A clean commit history could be:

```text
feat(db): extend interview schema with rounds
feat(interviews): add typed query and filter layer
feat(interviews): build interview discovery page
feat(interviews): build interview detail experience
feat(interviews): add round and question occurrence UI
feat(interviews): add provenance and source metadata
feat(interviews): add related interview discovery
content: expand structured interview seed data
chore(interviews): add integrity checks
test(interviews): add utility coverage
chore: complete week 3 audit
```

---

# Codex Global Instruction — Week 3

Paste this at the beginning of a fresh Codex session:

```text
You are implementing Week 3 of RoboPrep, a production-oriented Embodied AI interview preparation platform.

Week 1 established:
- Next.js App Router
- TypeScript
- Supabase
- authentication
- core database schema
- Apple-inspired design system
- reusable UI primitives

Week 2 established:
- Knowledge question list
- Knowledge detail
- topic hierarchy
- question relations
- follow-up questions
- related questions
- interview occurrence metadata
- Knowledge search / filtering

Week 3 goal:
Build the complete Interview System MVP.

Core product graph:

Company
→ Position
→ Interview
→ Interview Round
→ Interview Question Occurrence
→ Canonical Knowledge Question
→ Topic

Important distinction:

Interview Question Occurrence
!=
Canonical Knowledge Question

The Interview occurrence preserves:
- original wording
- round
- order
- context
- source provenance

The canonical question provides:
- reusable answer
- topics
- follow-ups
- related questions

Engineering rules:

1. Inspect the existing repository before changing code.
2. Reuse Week 2 Knowledge components where appropriate.
3. Do not duplicate canonical question rendering logic.
4. Keep Supabase access inside the Interview query layer.
5. Use Server Components by default.
6. Keep filters URL-driven.
7. Avoid global state management.
8. Preserve strict TypeScript typing.
9. Never fabricate real interview data or statistics in the UI.
10. Development seed interviews must be clearly marked as demo/development data.
11. Preserve source provenance.
12. Preserve original interview wording.
13. Support unlinked interview questions gracefully.
14. Do not implement interview ingestion automation this week.
15. Do not implement Coding Judge this week.
16. Do not implement Company Intelligence dashboards this week.
17. After each task, run relevant lint/typecheck/test/build checks.
18. Fix issues introduced by your changes.
19. Summarize:
    - files changed
    - schema changes
    - query changes
    - architectural decisions
    - commands run
    - limitations

Visual direction:

Apple-inspired, content-first, restrained.

Use:
- clear hierarchy
- generous whitespace
- neutral surfaces
- subtle separators
- constrained reading width
- compact metadata
- blue primary actions

Avoid:
- dashboard clutter
- oversized company logos
- neon gradients
- excessive glassmorphism
- unnecessary animation
- social-feed aesthetics

The Interview detail page should feel like a structured technical interview transcript, not a forum post.
```

---

# Week 3 Suggested Route Map

At the end of the week:

```text
/interviews

/interviews?company=bytedance
/interviews?year=2027
/interviews?season=spring
/interviews?difficulty=hard
/interviews?q=grpo

/interviews/[slug]
```

Examples:

```text
/interviews/bytedance-vla-research-intern-2027-spring
/interviews/nvidia-robot-learning-intern-2026-fall
```

---

# Suggested Component Structure

```text
src/components/interviews/

interview-search.tsx
interview-filters.tsx
interview-card.tsx
interview-list.tsx

interview-header.tsx
interview-overview.tsx
interview-source.tsx

interview-round.tsx
interview-question.tsx
interview-topics.tsx

related-interviews.tsx
```

Do not force this exact split if fewer files produce cleaner code.

---

# Suggested Query Architecture

```text
Page / Server Component
        │
        ▼
src/lib/interviews/queries.ts
        │
        ▼
Supabase server client
        │
        ▼
PostgreSQL
```

For detail page:

```text
getInterviewBySlug()
        │
        ├── company
        ├── position
        ├── rounds
        │      └── question occurrences
        │              └── canonical questions
        │                      └── topics
        │
        └── source metadata
```

Normalize this before passing to presentation components.

---

# Interview Data Quality Principle

RoboPrep should distinguish:

```text
verified real interview
reviewed community interview
unverified community interview
public-source indexed interview
development/demo interview
```

Never blur these states.

Trust is part of the product.

---

# Interview Question Principle

The raw interview record answers:

```text
What exactly was asked?
When was it asked?
Which round?
Which company / role?
```

The Knowledge System answers:

```text
What is the canonical concept?
What is the best answer?
What should I know next?
```

Week 3 must preserve both.

---

# Week 4 Handoff

Once Week 3 is accepted, Week 4 should focus entirely on:

```text
Coding MVP
```

including:

```text
Coding problem list
Problem detail
Monaco editor
Run
Submit
Judge service integration
Hidden test cases
Submission history
Accepted / Wrong Answer / TLE
Python-only first
```

Week 4 should avoid building custom ML sandbox infrastructure initially.
