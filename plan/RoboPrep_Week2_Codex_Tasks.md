# RoboPrep — Week 2 Codex Implementation Tasks

> Goal: implement the complete **Knowledge System MVP** for RoboPrep.
>
> Week 2 should turn the Week 1 foundation into a usable structured interview knowledge product.
>
> Do not start Coding Judge, Interview ingestion, or Company Intelligence yet.

---

# Week 2 Definition of Done

By the end of Week 2, users should be able to:

```text
open /knowledge
→ browse questions
→ filter by topic / difficulty / type
→ search questions
→ open a question detail page
→ read Quick Answer
→ read Deep Dive
→ inspect related topics
→ view Follow-up Questions
→ view Related Questions
→ understand where / how often the question appears
```

The Knowledge System should be built around:

```text
Canonical Question
        │
        ├── Topics
        ├── Follow-ups
        ├── Related Questions
        ├── Interview Occurrences
        └── Answer Sections
```

Week 2 must prioritize:

```text
correct data model
clean information architecture
fast navigation
high-quality reading experience
reusable query layer
```

over flashy UI.

---

# Week 2 Scope

Implement:

```text
Knowledge landing page
Question list
Question detail page
Topic hierarchy
Topic detail page
Search
Filtering
Pagination
Quick Answer
Deep Dive
Key Points
Follow-up Questions
Related Questions
Interview occurrence metadata
Frequency metadata
Trending metadata
Bookmarks / solved state optional only if time permits
```

Do not implement:

```text
Coding Judge
Interview submission
LLM ingestion
AI mock interview
Personalized recommendation engine
Company analytics dashboard
Full-text semantic/vector search
```

---

# Task 1 — Knowledge Schema Extension

## Goal

Extend the Week 1 database schema to support structured Knowledge content.

Create migration:

```text
supabase/migrations/0003_knowledge_schema.sql
```

## Extend `questions`

Add fields:

```text
short_answer text
deep_answer text
key_points jsonb
common_mistakes jsonb
interview_tips jsonb
estimated_minutes integer
is_featured boolean default false
is_published boolean default true
view_count bigint default 0
```

If `summary`, `canonical_answer`, or `deep_answer` already exist from Week 1, avoid duplicate concepts.

Use the existing fields where possible.

Recommended semantic mapping:

```text
summary            → one-line explanation
short_answer       → 30–60 second interview answer
deep_answer        → long-form technical explanation
key_points         → bullet list
common_mistakes    → bullet list
interview_tips     → bullet list
```

---

## Add `question_relations`

Create:

```text
question_relations
```

Fields:

```text
id uuid primary key
source_question_id uuid not null
target_question_id uuid not null
relation_type text not null
weight numeric default 1
created_at timestamptz
```

Allowed initial relation types:

```text
related
prerequisite
follow_up
contrast
```

Constraints:

```text
source_question_id != target_question_id
```

Unique constraint:

```text
(source_question_id, target_question_id, relation_type)
```

---

## Add `question_stats`

Create:

```text
question_stats
```

Fields:

```text
question_id uuid primary key
interview_count integer default 0
company_count integer default 0
occurrences_30d integer default 0
occurrences_90d integer default 0
trend_score numeric default 0
last_seen_at timestamptz
updated_at timestamptz
```

This table may initially be maintained manually or via refresh script.

Do not prematurely build a complex materialized analytics pipeline.

---

## Add Indexes

Add indexes for:

```text
questions.is_published
questions.is_featured
questions.difficulty
questions.question_type
question_relations.source_question_id
question_relations.target_question_id
question_relations.relation_type
question_stats.trend_score
question_stats.interview_count
```

---

## Acceptance Criteria

- Migration succeeds on a fresh Week 1 database
- Existing seed data is preserved
- Related questions can be queried efficiently
- Follow-up questions can use the same relation table
- Stats can be joined 1:1 with questions
- No duplicate answer fields are created unnecessarily

## Do Not

- Do not add embeddings yet
- Do not add AI-generated answer tables
- Do not store related question IDs as JSON arrays
- Do not store topic names inside questions

---

# Task 2 — Knowledge TypeScript Domain Types

## Goal

Create explicit domain types for the Knowledge product.

## Files

Create:

```text
src/types/knowledge.ts
```

Define types for:

```text
KnowledgeQuestion
KnowledgeQuestionSummary
KnowledgeQuestionDetail
KnowledgeTopic
QuestionRelation
QuestionStats
KnowledgeFilters
KnowledgeSort
```

Recommended filter structure:

```ts
type KnowledgeFilters = {
  query?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: string;
  company?: string;
};
```

Recommended sort values:

```text
recommended
most_asked
trending
newest
```

Avoid binding React component types directly to raw Supabase response types.

Create explicit mapping functions if necessary.

## Acceptance Criteria

- UI does not consume anonymous untyped query objects
- No broad `any`
- Raw database results are normalized in one place
- Domain types are reusable by server query functions

---

# Task 3 — Knowledge Query Layer

## Goal

Centralize all Knowledge database reads.

## Files

Create:

```text
src/lib/knowledge/
├── queries.ts
├── filters.ts
├── mappers.ts
└── constants.ts
```

## Required Query Functions

Implement server-side functions similar to:

```ts
getKnowledgeQuestions(...)
getKnowledgeQuestionBySlug(...)
getKnowledgeTopics(...)
getKnowledgeTopicBySlug(...)
getRelatedQuestions(...)
getFollowUpQuestions(...)
getQuestionOccurrences(...)
getFeaturedKnowledgeQuestions(...)
getTrendingKnowledgeQuestions(...)
```

Use Supabase server client.

Do not scatter Supabase queries across page components.

---

## `getKnowledgeQuestions`

Support:

```text
query
topic
difficulty
question_type
company
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

Recommended default:

```text
page_size = 20
```

---

## Sorting

Implement:

### recommended

Use a simple deterministic rule.

Example:

```text
featured first
then interview_count
then updated_at
```

### most_asked

```text
question_stats.interview_count desc
```

### trending

```text
question_stats.trend_score desc
```

### newest

```text
questions.created_at desc
```

---

## Acceptance Criteria

- All list/detail pages use query-layer functions
- Database concerns are not duplicated in React pages
- Missing stats do not crash rendering
- Invalid filters are sanitized
- Pagination count is correct

## Do Not

- Do not implement client-side loading of the entire question database
- Do not build a global state store
- Do not create N+1 queries for question topics

---

# Task 4 — Knowledge URL State and Filters

## Goal

Make Knowledge filtering fully URL-driven.

Example URLs:

```text
/knowledge
/knowledge?difficulty=medium
/knowledge?topic=grpo
/knowledge?type=knowledge
/knowledge?sort=trending
/knowledge?q=kv+cache
```

## Requirements

Use search parameters as the source of truth.

Do not keep independent duplicate filter state unless required for UI interaction.

Create filter parser:

```text
src/lib/knowledge/filters.ts
```

Validate:

```text
difficulty
sort
page
question_type
```

Unknown values should fall back safely.

## Acceptance Criteria

- Filtered pages are shareable by URL
- Browser back/forward works
- Refresh preserves filters
- Invalid query params do not crash the page
- Changing filters resets page to page 1

---

# Task 5 — Knowledge Landing Page

## Goal

Turn `/knowledge` into a real product page.

## Route

```text
src/app/knowledge/page.tsx
```

## Layout

Recommended structure:

```text
Knowledge

Master the concepts that appear
in Embodied AI interviews.

[ Search questions... ]

Featured Topics
VLA
World Model
RL / GRPO
Diffusion Policy
Transformer
Robot Data

────────────────────────

Questions

[All] [Easy] [Medium] [Hard]

Sort: Recommended

Question cards...
```

---

## Top Section

Display:

```text
page title
short description
search box
featured topic chips
```

Keep Apple-inspired whitespace.

Do not make it look like an admin dashboard.

---

## Question Card

Create:

```text
src/components/knowledge/question-card.tsx
```

Suggested content:

```text
GRPO

Why does GRPO not require a critic?

Medium
RL · GRPO

Asked in 18 interviews
5 companies

2 min read
```

Do not overload cards with data.

---

## Acceptance Criteria

- Real seed/database data is rendered
- Page loads server-side
- Search/filter URLs are supported
- Empty results have a polished empty state
- Mobile layout remains readable
- No fake statistics

---

# Task 6 — Knowledge Search UI

## Goal

Implement question search inside the Knowledge product.

Do not implement the global Cmd+K search yet unless it is trivial to reuse.

## Search Fields

Search across:

```text
questions.title
questions.summary
topics.name
```

Optional:

```text
original interview wording
```

only if query complexity remains reasonable.

---

## Database Search Strategy

For Week 2 use:

```text
PostgreSQL text search
and/or
ILIKE
and/or
pg_trgm
```

Keep implementation simple.

If necessary add migration:

```text
0004_knowledge_search.sql
```

with:

```text
pg_trgm extension
indexes
```

---

## Search Interaction

Search box should:

```text
update URL
submit on Enter
support clear
preserve other filters when possible
```

Debounced live-search is optional.

Do not make an unnecessary client-heavy autocomplete.

---

## Acceptance Criteria

Search for:

```text
GRPO
KV Cache
attention
diffusion
robot data
```

returns relevant seeded questions.

Search should be case-insensitive.

---

# Task 7 — Topic Tree

## Goal

Expose the Knowledge taxonomy as a navigable hierarchy.

## Route

Either:

```text
/knowledge/topics
```

or integrate the hierarchy inside `/knowledge`.

Preferred:

```text
/knowledge/topics
```

for a full taxonomy view.

## Component

Create:

```text
src/components/knowledge/topic-tree.tsx
```

Render hierarchical topics recursively.

Example:

```text
Embodied AI

├── Transformer
│   ├── Attention
│   ├── QKV
│   └── KV Cache
│
├── VLA
│   ├── Architecture
│   └── Action Chunking
│
├── RL
│   ├── PPO
│   └── GRPO
│
└── Robotics
    ├── SE(3)
    └── Control
```

## Requirements

Each topic should link to:

```text
/knowledge/topics/[slug]
```

or filtered Knowledge list.

## Acceptance Criteria

- Arbitrary nesting works
- Missing parent does not crash rendering
- No infinite recursion on malformed data
- Topic counts are optional, but if shown they must be real

---

# Task 8 — Topic Detail Page

## Goal

Create one page per Knowledge topic.

## Route

```text
/knowledge/topics/[slug]
```

## Page Structure

Example:

```text
GRPO

Group Relative Policy Optimization

12 Questions
18 Interview Occurrences

About

GRPO is...

Questions

01 Why does GRPO not require a critic?
02 GRPO vs PPO
03 How are group advantages normalized?
...
```

Optionally display:

```text
parent topic
child topics
related topics
```

## Acceptance Criteria

- Unknown slug returns 404
- Questions linked to the topic are paginated
- Parent/child relationships are navigable
- Topic page shares card components with `/knowledge`

---

# Task 9 — Question Detail Page Foundation

## Goal

Implement the main Knowledge reading experience.

## Route

```text
/knowledge/[slug]
```

## Page Layout

Recommended:

```text
breadcrumb

GRPO

Why does GRPO not require a critic?

Medium
RL · GRPO
Asked in 18 interviews
5 companies

────────────────────

Quick Answer

────────────────────

Deep Dive

────────────────────

Key Points

────────────────────

Common Mistakes

────────────────────

Interviewer Follow-ups

────────────────────

Related Questions

────────────────────

Interview Occurrences
```

---

## Desktop Width

Use a reading width near:

```text
720–800px
```

Secondary metadata may occupy a narrow side column.

Avoid a full-width wall of text.

---

## Acceptance Criteria

- Question fetched by slug
- Unknown slug returns 404
- Markdown or rich-text rendering is safe
- Long answers remain readable
- Page is responsive
- Metadata does not overwhelm the answer

---

# Task 10 — Quick Answer Component

## Goal

Create a reusable section optimized for interview preparation.

## Component

Create:

```text
src/components/knowledge/quick-answer.tsx
```

Purpose:

```text
a concise 30–60 second spoken answer
```

Example visual hierarchy:

```text
Quick Answer

GRPO removes the explicit value model used by PPO...
```

Optional utility:

```text
Copy answer
```

Do not add text-to-speech in Week 2.

## Acceptance Criteria

- Component handles missing content gracefully
- Copy interaction works if implemented
- Answer typography is distinct from Deep Dive
- Does not look like a colored alert box

---

# Task 11 — Deep Dive Rendering

## Goal

Support structured technical answers.

## Requirements

Deep Dive must support at minimum:

```text
paragraphs
headings
bullet lists
numbered lists
inline code
code blocks
block math placeholder or KaTeX if already justified
```

If using Markdown, choose a lightweight safe renderer.

Potential dependencies:

```text
react-markdown
remark-gfm
```

Only add KaTeX if actual Week 2 content needs equations.

## Security

Do not allow arbitrary raw HTML by default.

## Acceptance Criteria

- Technical explanations render cleanly
- Code blocks are readable
- No unsafe HTML injection
- Typography remains Apple-inspired and minimal

---

# Task 12 — Knowledge Metadata Components

## Goal

Create reusable metadata UI instead of duplicating small text patterns.

## Components

Create:

```text
src/components/knowledge/
├── difficulty-badge.tsx
├── question-type-badge.tsx
├── topic-chip.tsx
├── question-stats.tsx
└── reading-time.tsx
```

## Difficulty

Standardize:

```text
easy
medium
hard
```

Display:

```text
Easy
Medium
Hard
```

## Stats

Support:

```text
Asked in X interviews
Y companies
Last seen ...
Trending ...
```

Only show values when data is meaningful.

## Acceptance Criteria

- No repeated ad-hoc badge styling
- Missing stats are hidden rather than displayed as zero unless zero is meaningful
- Components work on list and detail pages

---

# Task 13 — Follow-up Questions

## Goal

Expose interviewer follow-up paths.

Use:

```text
question_relations.relation_type = follow_up
```

## Component

Create:

```text
src/components/knowledge/follow-up-questions.tsx
```

Example:

```text
Interviewer may continue asking

→ GRPO vs PPO
→ Why is a critic expensive?
→ How is the group advantage normalized?
→ What changes when applying GRPO to diffusion policies?
```

Each item links to a canonical question when available.

If a future follow-up has no canonical target, do not invent a special text-only model in Week 2.

## Acceptance Criteria

- Follow-ups are ordered by weight
- No circular rendering issues
- Empty follow-up section is omitted
- Linked questions are valid

---

# Task 14 — Related Questions

## Goal

Help users traverse the knowledge graph.

Use relation types:

```text
related
prerequisite
contrast
```

## Component

Create:

```text
src/components/knowledge/related-questions.tsx
```

Display grouped sections only when useful.

Example:

```text
Prerequisites

PPO Advantage Estimation

Related

GRPO Loss
RLHF

Compare With

PPO vs GRPO
```

## Acceptance Criteria

- Current question is never included
- Duplicate targets are deduplicated
- Groups render consistently
- Links use canonical slugs

---

# Task 15 — Interview Occurrence Metadata

## Goal

Connect Knowledge back to real interview provenance.

This is a core product differentiator.

## Query

Use:

```text
question
→ interview_questions
→ interviews
→ companies
→ positions
```

## Component

Create:

```text
src/components/knowledge/interview-occurrences.tsx
```

Example:

```text
Seen in interviews

ByteDance
VLA Research Intern
2027 Spring

NVIDIA
Robot Learning
2026 Fall

Unitree
Embodied AI
2027 Spring
```

Limit initial display to a reasonable number, e.g.:

```text
5
```

with:

```text
View all occurrences
```

optional.

## Acceptance Criteria

- Only published interviews appear
- Duplicates are handled
- Source URLs are not exposed unless intended
- No private/draft content leaks

---

# Task 16 — Question Stats Refresh Script

## Goal

Create a simple deterministic mechanism to calculate question statistics.

## File

Create:

```text
scripts/refresh-question-stats.ts
```

Compute:

```text
interview_count
company_count
last_seen_at
occurrences_30d
occurrences_90d
```

For `trend_score`, use a simple documented formula.

Example:

```text
trend_score =
occurrences_30d * 3
+ occurrences_90d
```

This is intentionally simple.

Do not present it as scientifically rigorous.

## Requirements

Script should be idempotent.

Document invocation in README.

## Acceptance Criteria

- Running twice produces same stats
- Draft interviews are ignored
- Question without occurrences gets valid defaults
- No external API required

---

# Task 17 — Trending Questions

## Goal

Expose a small trending surface on the Knowledge landing page.

## Component

Create:

```text
src/components/knowledge/trending-questions.tsx
```

Display only a short list:

```text
Trending

01 GRPO vs PPO
02 KV Cache
03 Diffusion Policy
04 Action Chunking
05 World Model
```

Include trend number only if meaningful.

Example:

```text
+42%
```

should only be displayed if the system actually calculates a percentage.

Otherwise display:

```text
Trending
```

without fabricated percentages.

## Acceptance Criteria

- Uses `question_stats.trend_score`
- Maximum 5–8 questions
- Falls back gracefully if stats are unavailable

---

# Task 18 — Featured Topics

## Goal

Create a curated topic entry surface.

## Implementation

Add a configuration layer:

```text
src/lib/knowledge/constants.ts
```

Example featured topics:

```text
VLA
World Model
GRPO
Diffusion Policy
Transformer
Robot Data
Robotics
```

The config should reference topic slugs, not duplicated descriptions.

Render as tasteful cards or pills.

## Acceptance Criteria

- Broken topic slug does not crash the page
- Featured topics are configurable without touching page layout
- Mobile layout works

---

# Task 19 — Knowledge Pagination

## Goal

Implement reliable server-side pagination.

## Requirements

Use URL:

```text
?page=2
```

Pagination should preserve:

```text
query
topic
difficulty
question type
sort
company
```

## Component

Create:

```text
src/components/ui/pagination.tsx
```

or Knowledge-specific pagination if necessary.

Recommended interaction:

```text
Previous
1
2
3
...
Next
```

Do not load hundreds of questions at once.

## Acceptance Criteria

- Page 1 omits invalid negative values
- Going beyond last page behaves safely
- Filters persist
- Search persists
- Server query limit/offset is correct

---

# Task 20 — Knowledge Empty / Error / Loading States

## Goal

Make the product feel complete even when data is unavailable.

## Add

For Knowledge routes:

```text
loading.tsx
error.tsx where appropriate
not-found behavior
empty search result
empty topic result
```

## Examples

Search empty state:

```text
No questions found for "xyz"

Try a broader keyword or clear the filters.
```

Do not use playful or overly verbose copy.

## Acceptance Criteria

- Loading UI uses skeletons rather than huge spinners
- 404 is meaningful
- Empty filters can be reset easily
- Server errors do not expose secrets

---

# Task 21 — SEO Metadata

## Goal

Make Knowledge pages indexable and shareable.

## Requirements

Use Next.js metadata APIs.

### Knowledge landing

```text
RoboPrep Knowledge — Embodied AI Interview Questions
```

### Question detail

Example:

```text
Why does GRPO not require a critic? — RoboPrep
```

Description should derive from:

```text
summary
```

### Topic detail

Example:

```text
GRPO Interview Questions — RoboPrep
```

Add canonical paths where appropriate.

## Acceptance Criteria

- Metadata exists for all public Knowledge routes
- No fabricated company claims in metadata
- Unknown questions do not generate valid metadata pages

---

# Task 22 — Seed 50 High-Quality Knowledge Questions

## Goal

Provide realistic content for the Knowledge MVP.

Expand:

```text
supabase/seed.sql
```

or create:

```text
supabase/seeds/knowledge.sql
```

Target:

```text
50 canonical questions
```

Distribution:

```text
Transformer / Attention      10
VLA                          10
RL / PPO / GRPO             10
Diffusion / Flow Matching     8
World Model                   6
Robot Data / Robotics         6
```

## Required Fields Per Question

At minimum:

```text
title
slug
difficulty
question_type
summary
short_answer
deep_answer
topics
```

For important questions also include:

```text
key_points
common_mistakes
interview_tips
```

## Requirements

Content must be:

```text
technical
concise
interview-oriented
non-repetitive
```

Do not inflate the database with superficial variations of the same question.

## Acceptance Criteria

- 50 questions seed successfully
- Slugs are unique
- Topic relationships are valid
- At least 15 questions have follow-up relations
- At least 15 questions have related/prerequisite/contrast relations

---

# Task 23 — Seed Interview Occurrences for Knowledge Stats

## Goal

Make occurrence and trend UI testable.

Extend development seed with enough interviews to produce realistic relationships.

Target:

```text
10–15 development interviews
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

Link those interviews to canonical questions via:

```text
interview_questions
```

The seed data is development/demo data.

Do not label seeded examples as verified real interview records unless they actually are.

Use explicit development-safe source labels.

## Acceptance Criteria

- Stats script produces non-zero results
- One question may appear in multiple companies
- Interview detail relationship can be queried
- No canonical question duplication is necessary

---

# Task 24 — Responsive Knowledge UX Audit

## Goal

Audit the entire Knowledge experience at multiple sizes.

Test:

```text
375px
430px
768px
1024px
1440px
```

## Review

Check:

```text
line length
font sizing
question card density
topic chip wrapping
filter usability
pagination
answer readability
navbar interaction
long code blocks
long question titles
```

## Acceptance Criteria

- No horizontal overflow
- No microscopic metadata
- Reading width is constrained on desktop
- Filters remain usable on mobile
- Cards are not excessively tall

---

# Task 25 — Accessibility Audit

## Goal

Ensure foundational accessibility before more features are added.

## Test

At minimum:

```text
keyboard navigation
focus rings
semantic headings
button labels
link labels
form labels
color contrast
ARIA only where necessary
```

Question page heading structure should resemble:

```text
h1 Question
h2 Quick Answer
h2 Deep Dive
h2 Key Points
h2 Follow-ups
```

## Acceptance Criteria

- Main flows usable with keyboard
- Search has label
- Icon-only controls have accessible names
- Contrast is acceptable
- No clickable divs where button/link semantics are appropriate

---

# Task 26 — Knowledge Performance Audit

## Goal

Ensure the product remains server-first and fast.

## Review

Avoid:

```text
large client bundles
client fetching when server fetching works
N+1 Supabase queries
large serialized database objects
unnecessary animations
```

Use Client Components only for:

```text
interactive filters
copy actions
small UI controls
```

## Acceptance Criteria

- Main Knowledge pages render server-side
- No whole-page `"use client"` unless necessary
- Question detail does not fire multiple redundant browser requests
- Build output has no obvious oversized dependency introduced by Week 2

---

# Task 27 — Knowledge Integration Tests / Smoke Tests

## Goal

Add a small set of tests or smoke checks around the most important behavior.

Do not create a giant testing framework if the repository has none.

Focus on:

```text
filter parser
question mapper
relation grouping
pagination logic
stats formula
```

If project already uses a testing framework, integrate with it.

Otherwise add the smallest justified setup.

## Required Cases

### Filter parser

```text
invalid difficulty
invalid page
unknown sort
```

### Relations

```text
deduplicate target
exclude current question
group relation types
```

### Pagination

```text
page 1
last page
out-of-range page
```

## Acceptance Criteria

- Tests can be run with one documented command
- Core utility behavior is covered
- Tests do not rely on production network services

---

# Task 28 — Week 2 Integration Audit

## Goal

Perform a complete end-to-end Week 2 review.

Do not add major features during this task.

## Required User Flows

### Flow A — Browse

```text
/knowledge
→ select GRPO topic
→ browse questions
→ open question
```

### Flow B — Search

```text
/knowledge?q=kv+cache
→ open result
→ Quick Answer
→ Deep Dive
```

### Flow C — Graph Navigation

```text
GRPO question
→ prerequisite PPO
→ related GRPO Loss
→ follow-up question
```

### Flow D — Topic Navigation

```text
/knowledge/topics
→ RL
→ GRPO
→ question
```

### Flow E — Interview Provenance

```text
question
→ Seen in Interviews
→ company / position metadata
```

---

## Run

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Use only commands that actually exist in the repository.

Fix issues introduced during Week 2.

---

## Deliverable

Create:

```text
docs/week2-status.md
```

Include:

```text
Implemented
Routes
Database changes
Seed content
Search behavior
Stats behavior
Known limitations
Deferred to Week 3
```

---

# Recommended Execution Order

Give Codex the tasks in this order:

```text
01 Knowledge Schema Extension
02 Knowledge TypeScript Domain Types
03 Knowledge Query Layer
04 Knowledge URL State and Filters
05 Knowledge Landing Page
06 Knowledge Search UI
07 Topic Tree
08 Topic Detail Page
09 Question Detail Page Foundation
10 Quick Answer Component
11 Deep Dive Rendering
12 Knowledge Metadata Components
13 Follow-up Questions
14 Related Questions
15 Interview Occurrence Metadata
16 Question Stats Refresh Script
17 Trending Questions
18 Featured Topics
19 Knowledge Pagination
20 Knowledge Empty / Error / Loading States
21 SEO Metadata
22 Seed 50 High-Quality Knowledge Questions
23 Seed Interview Occurrences
24 Responsive Knowledge UX Audit
25 Accessibility Audit
26 Knowledge Performance Audit
27 Knowledge Integration Tests / Smoke Tests
28 Week 2 Integration Audit
```

Do not give Codex all 28 tasks at once.

Recommended workflow:

```text
give one task
→ Codex inspects repo
→ implement
→ run checks
→ inspect diff
→ commit
→ next task
```

---

# Recommended Commit Groups

You do not necessarily need one commit per Task.

A clean structure could be:

```text
feat(db): extend knowledge schema
feat(knowledge): add query and filter layer
feat(knowledge): build knowledge listing
feat(knowledge): add topic navigation
feat(knowledge): build question detail experience
feat(knowledge): add question graph navigation
feat(knowledge): add interview occurrence metadata
feat(knowledge): add stats and trending
content: seed knowledge question set
test(knowledge): add utility coverage
chore: complete week 2 audit
```

---

# Codex Global Instruction — Week 2

Paste this at the beginning of a fresh Codex session:

```text
You are implementing Week 2 of RoboPrep, a production-oriented Embodied AI interview preparation platform.

Week 1 already established:
- Next.js App Router
- TypeScript
- Supabase
- authentication
- core database schema
- Apple-inspired design tokens
- UI primitives
- global app layout

Week 2 goal:
Build the complete Knowledge System MVP.

Core product model:

Company
→ Position
→ Interview
→ Interview Question
→ Canonical Question
→ Topic

Knowledge-specific model:

Canonical Question
├── Topics
├── Follow-up Questions
├── Related / Prerequisite / Contrast Questions
├── Interview Occurrences
├── Quick Answer
├── Deep Dive
└── Stats

Engineering rules:

1. Inspect the existing repository before changing code.
2. Do not rewrite working Week 1 infrastructure without a clear reason.
3. Use Server Components by default.
4. Keep Supabase database queries inside a dedicated query/data layer.
5. Do not scatter database queries throughout page components.
6. Keep filters URL-driven.
7. Avoid global state management.
8. Avoid unnecessary client components.
9. Preserve strict TypeScript typing.
10. Reuse existing UI primitives and design tokens.
11. Do not add a large dependency unless clearly justified.
12. Never fabricate real interview statistics in product UI.
13. Development seed data must be clearly treated as development/demo content.
14. Do not implement Coding Judge, AI mock interviews, or ingestion pipelines in Week 2.
15. After each task, run relevant lint/typecheck/test/build checks.
16. Fix issues introduced by your changes.
17. Summarize:
    - files changed
    - schema changes
    - architectural decisions
    - commands run
    - limitations

Visual direction:

Apple-inspired, content-first, restrained.

Use:
- strong typography hierarchy
- generous whitespace
- neutral surfaces
- subtle borders
- blue primary actions
- constrained reading width

Avoid:
- neon gradients
- cyberpunk visual language
- excessive glassmorphism
- dashboard clutter
- oversized card grids
- decorative animation that harms reading

The Knowledge detail page is a reading and interview-preparation surface, not a generic blog article.

Prioritize:
accuracy
scanability
fast navigation
question graph traversal
interview provenance
```

---

# Week 2 Suggested Route Map

At the end of the week, these routes should exist:

```text
/knowledge
/knowledge?page=2
/knowledge?q=grpo
/knowledge?topic=world-model
/knowledge?difficulty=hard
/knowledge?sort=trending

/knowledge/topics
/knowledge/topics/grpo
/knowledge/topics/vla
/knowledge/topics/world-model

/knowledge/[question-slug]
```

Example:

```text
/knowledge/why-does-grpo-not-require-a-critic
```

---

# Week 2 Suggested Component Structure

```text
src/components/knowledge/

knowledge-search.tsx
knowledge-filters.tsx
question-card.tsx
question-list.tsx

topic-chip.tsx
topic-tree.tsx
featured-topics.tsx

quick-answer.tsx
deep-dive.tsx
key-points.tsx
common-mistakes.tsx
interview-tips.tsx

difficulty-badge.tsx
question-type-badge.tsx
question-stats.tsx
reading-time.tsx

follow-up-questions.tsx
related-questions.tsx
interview-occurrences.tsx

trending-questions.tsx
```

Do not force every file above to exist if consolidation produces cleaner code.

---

# Week 2 Suggested Data Query Architecture

```text
Page / Server Component
        │
        ▼
src/lib/knowledge/queries.ts
        │
        ▼
Supabase Server Client
        │
        ▼
PostgreSQL
```

Never:

```text
QuestionCard
→ directly opens Supabase
```

Prefer:

```text
Page
→ fetches typed summary data
→ passes it into QuestionCard
```

---

# Knowledge Question Content Standard

Every important Knowledge question should aim to contain:

```text
Question
Difficulty
Topics

Quick Answer
Deep Dive
Key Points
Common Mistakes
Interview Tips

Follow-ups
Related Questions
Interview Occurrences
```

Not every question must have every optional section.

Missing optional sections should simply not render.

---

# Recommended Initial Question Taxonomy

Use this as a starting point for Week 2 seed content:

```text
Embodied AI
│
├── Foundation Models
│   ├── Transformer
│   │   ├── Attention
│   │   ├── QKV
│   │   ├── KV Cache
│   │   └── RoPE
│   │
│   └── Multimodal Models
│
├── VLA
│   ├── Architecture
│   ├── Action Representation
│   ├── Action Chunking
│   ├── π0
│   └── π0.5
│
├── Robot Learning
│   ├── Behavior Cloning
│   ├── ACT
│   └── Diffusion Policy
│
├── Reinforcement Learning
│   ├── PPO
│   ├── GRPO
│   ├── Advantage Estimation
│   └── Diffusion RL
│
├── World Models
│   ├── Video World Model
│   ├── Action Conditioning
│   └── World Action Model
│
├── Robot Data
│   ├── Data Collection
│   ├── Teleoperation
│   ├── Data Cleaning
│   └── Data Augmentation
│
└── Robotics
    ├── Coordinate Frames
    ├── SE(3)
    ├── Quaternion
    ├── Kinematics
    ├── Planning
    └── Control
```

---

# Week 2 Product Principle

The Knowledge System should not become:

```text
a pile of markdown articles
```

It should become:

```text
a structured interview question graph
```

The core navigation loop should be:

```text
Question
→ Topic
→ Prerequisite
→ Follow-up
→ Related Question
→ Real Interview Occurrence
```

That structure is more important than adding more raw content.

---

# Week 3 Handoff

Once Week 2 is accepted, Week 3 should focus on:

```text
Interview System
```

including:

```text
Interview list
Interview detail
Company / position / season filters
Interview rounds
Question ordering
Interview → canonical question linking
Question provenance
Interview source metadata
Interview quality / verification state
```

Week 3 should reuse the Knowledge components built in Week 2 rather than duplicating question display logic.
