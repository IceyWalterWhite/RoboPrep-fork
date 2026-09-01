# RoboPrep — Week 7 Codex Implementation Tasks

> Goal: build the complete **Company Intelligence MVP** for RoboPrep.
>
> Week 7 transforms the structured Interview + Knowledge + Coding graph into company-specific preparation intelligence.
>
> Core product loop:
>
> ```text
> Company
> → Roles
> → Interview History
> → Frequently Asked Topics
> → Frequently Asked Questions
> → Coding / Research Emphasis
> → Seasonal Trends
> → Preparation Guide
> ```
>
> The central product question is:
>
> ```text
> If I am interviewing for this company and role,
> what should I prepare first?
> ```

---

# Week 7 Definition of Done

By the end of Week 7, users should be able to:

```text
open /companies
→ browse Embodied AI companies
→ open a company
→ inspect available roles
→ see recent interviews
→ see most-asked topics
→ see most-asked Knowledge questions
→ see most-asked Coding problems
→ compare Coding vs Research emphasis
→ inspect seasonal changes
→ inspect difficulty distribution
→ open a company preparation guide
→ jump directly into relevant Knowledge/Coding problems
```

The Company Intelligence product must be derived from:

```text
Published Interviews
        │
        ├── Positions
        ├── Interview Rounds
        ├── Question Occurrences
        │       ├── Canonical Knowledge Questions
        │       └── Canonical Coding Problems
        │
        └── Topics
```

Week 7 must prioritize:

```text
real structured evidence
transparent sample size
deterministic metrics
useful preparation guidance
company-role specificity
```

over flashy analytics.

---

# Week 7 Scope

Implement:

```text
Companies directory
Company detail page
Company role breakdown
Recent interviews
Most-asked topics
Most-asked Knowledge questions
Most-asked Coding problems
Interview difficulty distribution
Round-type distribution
Coding vs Research emphasis
Season/year comparison
Question frequency
Topic frequency
Trending questions
Recent changes
Preparation guide
Role-specific company page
Company filters/search
Company statistics refresh
Confidence/sample-size labels
```

Do not implement:

```text
job postings
referrals
salary data
employee reviews
Blind-like community feed
ranking companies by prestige
AI-generated career advice
automatic interview probability prediction
resume matching
```

---

# Task 1 — Company Intelligence Schema Audit

## Goal

Audit existing company/position/interview schema before adding analytics-specific data.

Review:

```text
companies
positions
interviews
interview_rounds
interview_questions
questions
coding_problems
topics
question_topics
coding_problem_topics
```

Determine what should remain computed versus cached.

## Acceptance Criteria

- Document current usable fields
- No unnecessary schema additions
- Analytics truth source remains the published interview graph

---

# Task 2 — Company Stats Cache Schema

## Goal

Add lightweight cached company-level statistics for fast page rendering.

Create migration:

```text
supabase/migrations/0014_company_intelligence.sql
```

Create:

```text
company_stats
```

Fields:

```text
company_id uuid primary key
published_interview_count integer default 0
position_count integer default 0
knowledge_question_occurrence_count integer default 0
coding_question_occurrence_count integer default 0
unique_knowledge_question_count integer default 0
unique_coding_problem_count integer default 0
latest_interview_at timestamptz
updated_at timestamptz
```

## Acceptance Criteria

- Cache is rebuildable from canonical source tables
- No statistics become an independent truth source
- Company without interviews gets valid defaults

---

# Task 3 — Company Role Stats Schema

## Goal

Support role-specific company intelligence.

Create:

```text
company_position_stats
```

Fields:

```text
company_id uuid not null
position_id uuid not null
interview_count integer default 0
knowledge_occurrences integer default 0
coding_occurrences integer default 0
latest_interview_at timestamptz
updated_at timestamptz
```

Composite primary key:

```text
(company_id, position_id)
```

## Acceptance Criteria

- Role stats rebuildable
- Position must belong to company
- No role-name string duplication

---

# Task 4 — Company Topic Stats Schema

## Goal

Cache topic frequency by company.

Create:

```text
company_topic_stats
```

Fields:

```text
company_id uuid not null
topic_id uuid not null
occurrence_count integer default 0
interview_count integer default 0
position_count integer default 0
share_of_interviews numeric default 0
trend_score numeric default 0
last_seen_at timestamptz
updated_at timestamptz
```

Composite key:

```text
(company_id, topic_id)
```

## Acceptance Criteria

- Topic stats derived only from published interviews
- `share_of_interviews` denominator documented
- Missing data safe

---

# Task 5 — Company Question Stats Schema

## Goal

Track Knowledge question frequency per company.

Create:

```text
company_question_stats
```

Fields:

```text
company_id uuid not null
question_id uuid not null
occurrence_count integer default 0
interview_count integer default 0
position_count integer default 0
occurrences_30d integer default 0
occurrences_90d integer default 0
trend_score numeric default 0
last_seen_at timestamptz
updated_at timestamptz
```

Composite primary key:

```text
(company_id, question_id)
```

## Acceptance Criteria

- Same canonical question counted across multiple interviews
- Duplicate occurrence handling documented

---

# Task 6 — Company Coding Stats Schema

## Goal

Track canonical coding problem frequency per company.

Create:

```text
company_coding_problem_stats
```

Fields:

```text
company_id uuid not null
coding_problem_id uuid not null
occurrence_count integer default 0
interview_count integer default 0
position_count integer default 0
trend_score numeric default 0
last_seen_at timestamptz
updated_at timestamptz
```

Composite primary key:

```text
(company_id, coding_problem_id)
```

## Acceptance Criteria

- Only linked coding occurrences count
- Unlinked raw coding questions may count in aggregate coding emphasis but not canonical coding ranking

---

# Task 7 — Company Season Stats Schema

## Goal

Support year/season comparison.

Create:

```text
company_season_stats
```

Fields:

```text
company_id uuid not null
year integer not null
season text not null
interview_count integer default 0
question_occurrence_count integer default 0
knowledge_occurrence_count integer default 0
coding_occurrence_count integer default 0
avg_round_count numeric
avg_question_count numeric
updated_at timestamptz
```

Composite key:

```text
(company_id, year, season)
```

## Acceptance Criteria

- Season normalized consistently
- Missing year/season interviews do not pollute comparison

---

# Task 8 — Difficulty Stats Schema

## Goal

Cache company difficulty distribution.

Create:

```text
company_difficulty_stats
```

Fields:

```text
company_id uuid primary key
easy_count integer default 0
medium_count integer default 0
hard_count integer default 0
unknown_count integer default 0
average_score numeric
sample_size integer default 0
updated_at timestamptz
```

Map:

```text
easy = 1
medium = 2
hard = 3
```

## Acceptance Criteria

- Unknown excluded from average
- Sample size exposed
- No false precision

---

# Task 9 — Round Type Stats Schema

## Goal

Track interview structure by company.

Create:

```text
company_round_type_stats
```

Fields:

```text
company_id uuid not null
round_type text not null
round_count integer default 0
interview_count integer default 0
share numeric default 0
updated_at timestamptz
```

Composite key:

```text
(company_id, round_type)
```

## Acceptance Criteria

- Uses published round records
- Unknown round types supported
- Share denominator documented

---

# Task 10 — Company Intelligence Domain Types

## Goal

Create strong TypeScript types.

Create:

```text
src/types/company-intelligence.ts
```

Define:

```text
CompanySummary
CompanyDetail
CompanyStats
CompanyPositionStat
CompanyTopicStat
CompanyQuestionStat
CompanyCodingProblemStat
CompanySeasonStat
CompanyDifficultyStat
CompanyRoundTypeStat
CompanyTrendItem
CompanyPreparationGuide
CompanyFilters
```

## Acceptance Criteria

- UI consumes typed normalized data
- Raw DB cache types separated from presentation types
- No `any`

---

# Task 11 — Company Query Layer

## Goal

Centralize all company intelligence reads.

Create:

```text
src/lib/companies/
├── queries.ts
├── intelligence.ts
├── filters.ts
├── mappers.ts
├── constants.ts
└── helpers.ts
```

Required functions:

```ts
getCompanies(...)
getCompanyBySlug(...)
getCompanyStats(...)
getCompanyPositions(...)
getCompanyRecentInterviews(...)
getCompanyTopTopics(...)
getCompanyTopQuestions(...)
getCompanyTopCodingProblems(...)
getCompanySeasonStats(...)
getCompanyDifficultyStats(...)
getCompanyRoundTypeStats(...)
getCompanyTrends(...)
```

## Acceptance Criteria

- No scattered Supabase analytics queries in components
- Company detail uses a small number of aggregate queries
- Published data only

---

# Task 12 — Company Stats Refresh Script

## Goal

Create deterministic rebuild script.

Create:

```text
scripts/refresh-company-stats.ts
```

Recompute:

```text
company_stats
company_position_stats
company_topic_stats
company_question_stats
company_coding_problem_stats
company_season_stats
company_difficulty_stats
company_round_type_stats
```

## Requirements

```text
idempotent
published interviews only
transactional where practical
```

## Acceptance Criteria

- Running twice produces same results
- Newly published Week 6 interview changes stats
- Draft/rejected interviews ignored

---

# Task 13 — Incremental Company Stats Refresh

## Goal

Implement:

```text
refreshCompanyStats(companyId)
```

and invoke it after successful interview publication.

## Acceptance Criteria

- Does not rebuild all companies unnecessarily
- Failure can be retried
- Canonical interview data remains source of truth

---

# Task 14 — Company Directory Route

## Goal

Build:

```text
/companies
```

Suggested page:

```text
Companies

Prepare for Embodied AI interviews
company by company.

[ Search companies... ]

Company list/cards
```

Each summary may show:

```text
Company
X interviews
Y roles
Latest interview
Top topics
```

## Acceptance Criteria

- DB-backed
- Responsive
- No prestige ranking
- No fake metrics

---

# Task 15 — Company Search

## Goal

Support:

```text
/companies?q=nvidia
```

Search:

```text
company name
aliases if available
description
position titles optionally
```

## Acceptance Criteria

- Case-insensitive
- URL-driven
- Empty state polished

---

# Task 16 — Company Directory Filters

## Goal

Add only useful filters.

Potential:

```text
has interviews
has coding interview evidence
role category
recent activity
```

## Acceptance Criteria

- Real data only
- Mobile usable
- URL-driven

---

# Task 17 — Company Card Component

## Goal

Create:

```text
src/components/companies/company-card.tsx
```

Display:

```text
name
short description optional
interview count
role count
latest interview
top topics
```

## Acceptance Criteria

- Compact
- Missing data graceful
- Links to company detail

---

# Task 18 — Company Detail Route

## Goal

Build:

```text
/companies/[slug]
```

Recommended structure:

```text
Company Header

Overview

Roles

Most Asked Topics

Most Asked Knowledge Questions

Most Asked Coding Problems

Interview Structure

Difficulty

Season Trends

Recent Interviews

Preparation Guide
```

## Acceptance Criteria

- Unknown slug returns 404
- Server-rendered
- Responsive

---

# Task 19 — Company Header

## Goal

Create:

```text
src/components/companies/company-header.tsx
```

Display:

```text
company name
description
country if available
interview count
role count
latest interview
```

## Acceptance Criteria

- No giant brand hero
- Statistics concise
- Mobile safe

---

# Task 20 — Company Role Breakdown

## Goal

Show role coverage.

Example:

```text
VLA Research Intern         12 interviews
Robot Learning Engineer      8 interviews
World Model Research         5 interviews
```

Link to role page.

## Acceptance Criteria

- Real position entities
- Sorted by interview count
- No duplicated role strings

---

# Task 21 — Company Role Detail Route

## Goal

Add:

```text
/companies/[companySlug]/roles/[positionSlug]
```

Role-specific content:

```text
interview count
recent interviews
top topics
top questions
coding emphasis
difficulty
season data
preparation checklist
```

## Acceptance Criteria

- Position must belong to company
- Wrong company/position combination 404
- Reuses shared intelligence components

---

# Task 22 — Role-Scoped Stats Queries

## Goal

Extend analytics with optional:

```text
position_id
```

Support:

```text
top topics
top questions
top coding problems
difficulty
season trends
```

## Acceptance Criteria

- Same analytics service reused
- No separate duplicated architecture

---

# Task 23 — Most Asked Topics Component

## Goal

Create:

```text
src/components/companies/top-topics.tsx
```

Example:

```text
Most Asked Topics

VLA                 72%
RL / GRPO           51%
Diffusion Policy    44%
Robot Data          38%
Transformer         31%
```

Define percentage as:

```text
share of published interviews containing this topic
```

## Acceptance Criteria

- Metric definition consistent
- Sample size available
- No misleading tiny-sample percentage

---

# Task 24 — Topic Frequency Confidence Policy

## Goal

Centralize limited-sample behavior.

Suggested policy:

```text
< 3 interviews:
Limited data

3–9:
show count prominently

10+:
percentage may be primary
```

## Acceptance Criteria

- Shared helper/constants
- Consistent across company pages

---

# Task 25 — Most Asked Knowledge Questions

## Goal

Create:

```text
top-knowledge-questions.tsx
```

Example:

```text
01 Why does GRPO not require a critic?
Asked in 7 interviews

02 How does action chunking work?
Asked in 6 interviews
```

## Acceptance Criteria

- Canonical questions only
- Links to Knowledge pages
- Real company-specific counts

---

# Task 26 — Most Asked Coding Problems

## Goal

Create:

```text
top-coding-problems.tsx
```

Example:

```text
Implement Multi-Head Attention
Seen in 4 interviews

Quaternion SLERP
Seen in 3 interviews
```

## Acceptance Criteria

- Canonical coding links only
- Direct links to coding workspace

---

# Task 27 — Unlinked Question Coverage Metric

## Goal

Compute internal analytics quality:

```text
linked knowledge
linked coding
unlinked occurrences
```

## Acceptance Criteria

- Helps estimate analytics reliability
- Not presented as user performance

---

# Task 28 — Coding vs Knowledge Emphasis

## Goal

Create:

```text
company-interview-emphasis.tsx
```

Example:

```text
Interview Emphasis

Knowledge / Research     68%
Coding / Implementation 32%
```

Optionally include:

```text
System Design
Behavioral
```

## Acceptance Criteria

- Classification documented
- Unclassified handled
- Sample size shown

---

# Task 29 — Research vs Engineering Emphasis

## Goal

Create a conservative rule-based interview-mix classification from:

```text
question type
coding occurrence
system-design occurrence
research topic occurrence
data-engineering topics
```

## Acceptance Criteria

- Deterministic
- Wording avoids overclaiming

---

# Task 30 — Interview Difficulty Component

## Goal

Display:

```text
Easy      12%
Medium    56%
Hard      32%

Based on 25 interviews
```

## Acceptance Criteria

- Sample size visible
- Unknown handled
- Limited-data state

---

# Task 31 — Round Type Distribution

## Goal

Display:

```text
Technical     48%
Coding        24%
Research      18%
Behavioral    10%
```

## Acceptance Criteria

- Real round data
- Denominator defined
- Mobile readable

---

# Task 32 — Typical Interview Structure

## Goal

Compute:

```text
median round count
median question count
```

Prefer median over average where easy.

Example:

```text
Typical interview

3 rounds
9 questions
```

## Acceptance Criteria

- Sample size shown
- No false decimal precision

---

# Task 33 — Season Comparison Query

## Goal

Compare:

```text
2026 Fall
2027 Spring
```

Metrics:

```text
interview count
coding share
top topics
top questions
difficulty
```

## Acceptance Criteria

- Sparse seasons marked
- Comparable definitions

---

# Task 34 — Season Comparison Component

## Goal

Create:

```text
season-comparison.tsx
```

Example:

```text
                     2026 Fall   2027 Spring

GRPO                    28%          46%
VLA                     61%          67%
Coding share            22%          35%
```

## Acceptance Criteria

- Simple table/card
- No unnecessary chart library

---

# Task 35 — Trending Question Formula

## Goal

Define deterministic company-level trend score.

Example:

```text
recent_rate =
occurrences_30d / max(interviews_30d, 1)

historical_rate =
older_occurrences / max(older_interviews, 1)

trend_score =
recent_rate - historical_rate
```

## Acceptance Criteria

- Normalized by interview volume
- Formula documented
- Same input → same result

---

# Task 36 — Company Trending Questions

## Goal

Create:

```text
company-trending-questions.tsx
```

Display:

```text
Trending recently

GRPO
Action-conditioned World Models
Diffusion RL
```

## Acceptance Criteria

- Minimum sample threshold
- No single-record overclaim

---

# Task 37 — Emerging Topics

## Goal

Detect topics that are materially more common recently.

Suggested requirements:

```text
recent occurrence >= 2
recent share above threshold
historical share low
```

Label:

```text
Emerging
```

## Acceptance Criteria

- Conservative
- Sample context shown

---

# Task 38 — Declining Topics

## Goal

Optionally detect lower recent frequency.

Label:

```text
Less common recently
```

## Acceptance Criteria

- Sufficient historical/recent samples required
- Low visual priority

---

# Task 39 — Recent Interview Feed

## Goal

Create:

```text
company-recent-interviews.tsx
```

Show:

```text
position
year / season
round count
question count
published date
```

## Acceptance Criteria

- 5–10 max
- Latest first
- Links to Interview detail

---

# Task 40 — Company Interview Archive

## Goal

Reuse existing interview list via:

```text
/interviews?company=...
```

instead of duplicating an archive UI unless a dedicated route is clearly better.

## Acceptance Criteria

- Reuse existing Interview list
- Filter preserved

---

# Task 41 — Preparation Guide Data Model

## Goal

Define:

```text
CompanyPreparationGuide
```

Fields:

```text
must_study_topics
must_study_questions
recommended_coding_problems
interview_structure_notes
limited_data_note
```

## Acceptance Criteria

- Data-derived
- No runtime LLM prose required

---

# Task 42 — Preparation Guide Algorithm

## Goal

Create simple ranking.

Topic score example:

```text
0.5 interview_share
+ 0.3 recent_trend
+ 0.2 role_relevance
```

Question score:

```text
0.6 interview_count
+ 0.3 recent_trend
+ 0.1 recency
```

## Acceptance Criteria

- Formula documented
- Stable and deterministic

---

# Task 43 — Company Preparation Guide Component

## Goal

Create:

```text
company-preparation-guide.tsx
```

Example:

```text
Prepare First

1. VLA Architecture
2. GRPO / PPO
3. Diffusion Policy
4. Robot Data Pipeline

Must-Review Questions
...

Recommended Coding
...
```

## Acceptance Criteria

- Actionable
- Links to real content
- Limited-data fallback

---

# Task 44 — Role-Specific Preparation Guide

## Goal

Generate company + role scoped guide.

If role sample is too small, fall back to company-wide stats and explicitly label fallback.

## Acceptance Criteria

- No silent fallback
- Role relevance used when available

---

# Task 45 — Suggested Study Set Route

## Goal

Create:

```text
/companies/[slug]/prepare
```

Show:

```text
Core Topics
Top Knowledge Questions
Recommended Coding Problems
Recent Trends
```

## Acceptance Criteria

- Reuses Knowledge/Coding components
- No duplicate content tables

---

# Task 46 — Company Target Bookmark Schema

## Goal

Optional if core Week 7 is on schedule.

Create:

```text
user_company_targets
```

Fields:

```text
user_id
company_id
position_id optional
created_at
```

## Acceptance Criteria

- Simple save/remove only
- No application CRM

---

# Task 47 — Company Target UI

## Goal

Optional UI:

```text
Save as target
```

and lightweight target list.

## Acceptance Criteria

- Auth-only
- Minimal

---

# Task 48 — Company SEO Metadata

## Goal

Add dynamic metadata.

Examples:

```text
Embodied AI Interview Companies — RoboPrep

ByteDance Embodied AI Interview Guide — RoboPrep

ByteDance VLA Research Intern Interview Guide — RoboPrep
```

## Acceptance Criteria

- Derived from real data
- No unsupported claims

---

# Task 49 — Company Breadcrumbs

## Goal

Add:

```text
Companies
/
ByteDance
/
VLA Research Intern
```

## Acceptance Criteria

- Accessible
- No dead links

---

# Task 50 — Company Empty States

## Goal

Handle:

```text
0 interviews
1 interview
no coding data
no trend data
no season comparison
```

Use copy such as:

```text
Not enough interview data yet to estimate trends.
```

## Acceptance Criteria

- No fake empty charts
- Clear limited-data communication

---

# Task 51 — Sample Size Component

## Goal

Create:

```text
src/components/companies/sample-size-note.tsx
```

Examples:

```text
Based on 18 interviews

Limited data · 2 interviews
```

## Acceptance Criteria

- Used consistently
- Readable

---

# Task 52 — Analytics Metric Definitions

## Goal

Create:

```text
docs/company-metrics.md
```

Define:

```text
topic share
question frequency
coding share
difficulty distribution
trend score
season comparison
sample size
emerging topic
```

## Acceptance Criteria

- Reproducible metric definitions
- No ambiguous percentages

---

# Task 53 — Company Intelligence Integrity Script

## Goal

Create:

```text
scripts/check-company-intelligence.ts
```

Check:

```text
company IDs valid
position-company relation valid
non-negative counts
share ∈ [0,1]
question IDs valid
topic IDs valid
coding IDs valid
cache timestamps present
```

## Acceptance Criteria

- Broken data detected
- Non-zero exit
- No mutation

---

# Task 54 — Company Stats Unit Tests

## Goal

Test:

```text
topic share
coding/knowledge split
difficulty distribution
season grouping
trend score
sample thresholds
preparation ranking
```

## Acceptance Criteria

- Deterministic
- Offline fixtures

---

# Task 55 — Company Query Tests

## Goal

Test:

```text
company without stats
position mismatch
limited sample
missing coding data
unknown season
```

## Acceptance Criteria

- No production network dependency

---

# Task 56 — Company Analytics Performance Audit

## Goal

Review:

```text
DB query count
join cost
payload size
cache usage
```

## Acceptance Criteria

- No N+1
- Company detail responsive with large datasets

---

# Task 57 — Company Cache Refresh Performance

## Goal

Measure:

```text
full refresh
single-company refresh
```

Document performance.

## Acceptance Criteria

- Incremental path verified

---

# Task 58 — Company Mobile UX Audit

## Goal

Test:

```text
375px
430px
768px
```

Review:

```text
ranked topics
question lists
season comparison
role list
difficulty
preparation guide
```

## Acceptance Criteria

- No horizontal overflow
- Analytics understandable without hover

---

# Task 59 — Company Desktop UX Audit

## Goal

Test:

```text
1024px
1280px
1440px
1728px
```

Prioritize:

```text
Preparation Guide
Top Topics
Top Questions
Recent Interviews
```

above secondary analytics.

## Acceptance Criteria

- No dashboard-grid explosion
- Reading order clear

---

# Task 60 — Company Accessibility Audit

## Goal

Check:

```text
metric labels
bars
tables
links
role navigation
season comparison
sample notes
```

## Acceptance Criteria

- Not color-only
- Keyboard accessible

---

# Task 61 — Company Data Quality Admin View

## Goal

Add:

```text
/admin/companies/[slug]/quality
```

Show:

```text
published interview count
unlinked question rate
source mix
reviewed/verified mix
role coverage
season coverage
```

## Acceptance Criteria

- Admin-only
- Read-only MVP sufficient

---

# Task 62 — Source Mix Metric

## Goal

Compute:

```text
community
public source
editorial
development
```

Development/demo data should be excluded from production analytics where appropriate.

## Acceptance Criteria

- Source policy clear

---

# Task 63 — Published Data Inclusion Policy

## Goal

Document what contributes to public analytics.

Recommended:

```text
published + reviewed content counts
development seed excluded from production
```

## Acceptance Criteria

- Consistent implementation
- Documented in `company-metrics.md`

---

# Task 64 — Internal Data Confidence Score

## Goal

Optional internal score based on:

```text
sample size
canonical-link coverage
source quality
season diversity
role coverage
```

Do not expose publicly unless strongly justified.

## Acceptance Criteria

- Internal-only by default
- Formula documented

---

# Task 65 — Recent Changes Component

## Goal

Create deterministic summaries such as:

```text
GRPO appeared more frequently in recent interview records.

Coding rounds were more common in 2027 Spring.
```

## Acceptance Criteria

- Every statement traceable to metrics
- No runtime LLM

---

# Task 66 — Recent Changes Rules

## Goal

Implement conservative triggers:

```text
topic share change > threshold
coding share change > threshold
new topic exceeds minimum sample
difficulty mix materially changes
```

## Acceptance Criteria

- Tiny sample noise suppressed

---

# Task 67 — Company Preparation Checklist

## Goal

Create:

```text
Knowledge
[ ] VLA Architecture
[ ] GRPO vs PPO

Coding
[ ] Multi-Head Attention
[ ] Quaternion SLERP
```

Initially derive from guide.

## Acceptance Criteria

- Direct links
- No fake completion state

---

# Task 68 — Personalized Company Prep Progress

## Goal

Combine company guide with existing coding solved state.

Only show Knowledge completion if RoboPrep has a real Knowledge progress model.

## Acceptance Criteria

- Uses real user data
- Missing categories handled honestly

---

# Task 69 — Knowledge Set for Company

## Goal

Ensure:

```text
/knowledge?company=bytedance
```

means:

```text
canonical questions appearing in published ByteDance interview records
```

## Acceptance Criteria

- Correct joins
- No duplicate rows

---

# Task 70 — Coding Set for Company

## Goal

Add:

```text
/coding?company=bytedance
```

based on canonical coding occurrences.

## Acceptance Criteria

- Only evidence-backed associations

---

# Task 71 — Company Filter in Coding Query Layer

## Goal

Extend coding filters with:

```text
company
position optional
```

## Acceptance Criteria

- URL-driven
- Efficient

---

# Task 72 — Company Filter in Knowledge Query Audit

## Goal

Verify/fix Week 2 company filtering.

## Acceptance Criteria

- Published interviews only
- Canonical question dedupe correct

---

# Task 73 — Role Filter in Knowledge/Coding

## Goal

Support:

```text
/knowledge?company=bytedance&position=vla-research-intern

/coding?company=bytedance&position=vla-research-intern
```

## Acceptance Criteria

- Position validated against company
- Shareable URL

---

# Task 74 — Company Trends Route Optional

## Goal

Optional:

```text
/companies/[slug]/trends
```

Only if company detail becomes too dense.

## Acceptance Criteria

- Do not fragment routes unnecessarily

---

# Task 75 — Global Recent Company Activity

## Goal

Optional small section on `/companies`:

```text
Recently active
```

based on recent published interview count.

## Acceptance Criteria

- Activity metric explicit
- No “best company” ranking

---

# Task 76 — Company Compare Helper

## Goal

Prepare:

```ts
compareCompanies(companyIds, metrics)
```

Support:

```text
topic share
coding share
difficulty
round types
```

## Acceptance Criteria

- Small number of companies only
- UI optional

---

# Task 77 — Company Compare Route Optional

## Goal

Optional:

```text
/companies/compare?a=bytedance&b=nvidia
```

## Acceptance Criteria

- Same sample-size caveats
- No winner/loser language

---

# Task 78 — Company Intelligence Architecture Docs

## Goal

Create:

```text
docs/company-intelligence-architecture.md
```

Explain:

```text
source tables
cache tables
refresh triggers
incremental refresh
metric definitions
limited-sample policy
```

## Acceptance Criteria

- Caches clearly documented as rebuildable

---

# Task 79 — Company Sitemap Integration

## Goal

Include public company/role pages in sitemap if sitemap exists.

Exclude:

```text
admin
development-only
empty private pages
```

## Acceptance Criteria

- Canonical routes correct

---

# Task 80 — Homepage Latest Interviews Integration

## Goal

Optionally replace placeholders with real data.

Show:

```text
Latest Interviews
```

with company + role.

## Acceptance Criteria

- Real data
- Reuses components

---

# Task 81 — Company Development Data Audit

## Goal

Ensure development dataset can exercise Week 7 UI.

At minimum:

```text
ByteDance
NVIDIA
Physical Intelligence
Figure AI
Unitree
AgiBot
DJI
```

## Acceptance Criteria

- Multiple roles/seasons/topics represented
- Development records not mislabeled as verified real interviews

---

# Task 82 — Analytics Copy Audit

## Goal

Review all public language.

Avoid:

```text
ByteDance definitely asks GRPO.
You will be asked...
This is the hardest company.
```

Prefer:

```text
GRPO appeared in 7 of 18 published interview records.
```

## Acceptance Criteria

- Evidence-based copy

---

# Task 83 — Company Intelligence Smoke Test

## Goal

Create:

```text
scripts/test-company-intelligence.ts
```

Fixture:

```text
published interviews
→ refresh company stats
→ verify top topic
→ verify top question
→ verify coding share
→ verify season grouping
```

## Acceptance Criteria

- Deterministic
- Local/offline fixture strategy

---

# Task 84 — Week 7 Integration Audit

## Goal

Perform final Week 7 end-to-end review.

Do not add major features here.

## Flow A — Directory

```text
/companies
→ search ByteDance
→ open company
```

## Flow B — Company Intelligence

```text
company
→ top topics
→ top questions
→ coding problems
→ difficulty
→ round types
```

## Flow C — Role

```text
company
→ VLA Research Intern
→ role-specific intelligence
```

## Flow D — Preparation

```text
company
→ preparation guide
→ Knowledge question
→ Coding problem
```

## Flow E — Recent Interview

```text
company
→ recent interview
→ Interview detail
```

## Flow F — Season

```text
2026 Fall
vs
2027 Spring
```

## Flow G — Trend

```text
company
→ trending topic/question
→ sample-size context
```

## Flow H — Stats Refresh

```text
publish new interview
→ refresh company stats
→ company page updates
```

## Flow I — Limited Data

```text
company with 1–2 interviews
→ no misleading trend claims
→ Limited data state
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
refresh-company-stats
company intelligence integrity check
company intelligence smoke test
```

Fix all Week 7 regressions.

---

## Deliverables

Create:

```text
docs/week7-status.md
docs/company-metrics.md
docs/company-intelligence-architecture.md
```

`week7-status.md` should include:

```text
Implemented
Routes
Database migrations
Stats caches
Metric definitions
Sample-size policy
Company page architecture
Role-specific intelligence
Preparation guide logic
Known limitations
Deferred to Week 8
```

---

# Recommended Execution Order

Give Codex tasks in this order:

```text
01 Company Intelligence Schema Audit
02 Company Stats Cache Schema
03 Company Role Stats Schema
04 Company Topic Stats Schema
05 Company Question Stats Schema
06 Company Coding Stats Schema
07 Company Season Stats Schema
08 Difficulty Stats Schema
09 Round Type Stats Schema
10 Company Intelligence Domain Types
11 Company Query Layer
12 Company Stats Refresh Script
13 Incremental Company Stats Refresh
14 Company Directory Route
15 Company Search
16 Company Directory Filters
17 Company Card Component
18 Company Detail Route
19 Company Header
20 Company Role Breakdown
21 Company Role Detail Route
22 Role-Scoped Stats Queries
23 Most Asked Topics Component
24 Topic Frequency Confidence Policy
25 Most Asked Knowledge Questions
26 Most Asked Coding Problems
27 Unlinked Question Coverage Metric
28 Coding vs Knowledge Emphasis
29 Research vs Engineering Emphasis
30 Interview Difficulty Component
31 Round Type Distribution
32 Typical Interview Structure
33 Season Comparison Query
34 Season Comparison Component
35 Trending Question Formula
36 Company Trending Questions
37 Emerging Topics
38 Declining Topics
39 Recent Interview Feed
40 Company Interview Archive
41 Preparation Guide Data Model
42 Preparation Guide Algorithm
43 Company Preparation Guide Component
44 Role-Specific Preparation Guide
45 Suggested Study Set Route
46 Company Target Bookmark Schema
47 Company Target UI
48 Company SEO Metadata
49 Company Breadcrumbs
50 Company Empty States
51 Sample Size Component
52 Analytics Metric Definitions
53 Company Intelligence Integrity Script
54 Company Stats Unit Tests
55 Company Query Tests
56 Company Analytics Performance Audit
57 Company Cache Refresh Performance
58 Company Mobile UX Audit
59 Company Desktop UX Audit
60 Company Accessibility Audit
61 Company Data Quality Admin View
62 Source Mix Metric
63 Published Data Inclusion Policy
64 Internal Data Confidence Score
65 Recent Changes Component
66 Recent Changes Rules
67 Company Preparation Checklist
68 Personalized Company Prep Progress
69 Knowledge Set for Company
70 Coding Set for Company
71 Company Filter in Coding Query Layer
72 Company Filter in Knowledge Query Audit
73 Role Filter in Knowledge/Coding
74 Company Trends Route Optional
75 Global Recent Company Activity
76 Company Compare Helper
77 Company Compare Route Optional
78 Company Intelligence Architecture Docs
79 Company Sitemap Integration
80 Homepage Latest Interviews Integration
81 Company Development Data Audit
82 Analytics Copy Audit
83 Company Intelligence Smoke Test
84 Week 7 Integration Audit
```

Do not give all 84 tasks to Codex in one prompt.

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
feat(db): add company intelligence cache schema
feat(companies): add analytics query layer
feat(companies): build company directory
feat(companies): build company detail page
feat(companies): add role-specific intelligence
feat(companies): add topic and question frequency
feat(companies): add coding and difficulty insights
feat(companies): add season and trend analysis
feat(companies): add preparation guide
feat(companies): connect company prep to knowledge and coding
docs: define company metrics and sample-size policy
test(companies): add analytics coverage
chore: complete week 7 audit
```

---

# Codex Global Instruction — Week 7

Paste this at the beginning of a fresh Codex session:

```text
You are implementing Week 7 of RoboPrep, a production-oriented Embodied AI interview preparation platform.

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
- rounds
- question occurrences
- provenance

Week 4 established:
- Python Coding MVP
- Monaco
- judge
- submissions

Week 5 established:
- ML / PyTorch coding evaluator
- function/class judge
- coding collections
- progress

Week 6 established:
- Interview Submission
- ingestion pipeline
- parser
- canonicalization
- duplicate detection
- review workflow
- publish workflow

Week 7 goal:
Build Company Intelligence from the structured data graph.

Core question:

If a user is preparing for a specific Embodied AI company and role,
what should they study first, based on published interview records?

Source graph:

Company
→ Position
→ Published Interview
→ Round
→ Question Occurrence
→ Canonical Knowledge Question / Coding Problem
→ Topic

Engineering rules:

1. Inspect the existing repository before changing code.
2. Preserve Week 1–6 functionality.
3. Analytics must derive from published structured interview data.
4. Do not fabricate company interview statistics.
5. Do not rank company prestige.
6. Always expose sample size for important metrics.
7. Use conservative limited-data states.
8. Never show strong trend claims from tiny samples without warning.
9. Cache tables are rebuildable accelerators, not truth sources.
10. Keep metric definitions deterministic and documented.
11. Use strict TypeScript.
12. Use Server Components by default.
13. Keep company analytics queries centralized.
14. Avoid N+1 queries.
15. Reuse existing Knowledge, Coding, and Interview components.
16. Company preparation guides must link to real canonical content.
17. Do not use runtime LLM generation for analytics prose.
18. Use rule-based/statistical preparation ranking.
19. Exclude development seed data from production analytics where appropriate.
20. Respect source/review quality policies.
21. Do not add jobs/referrals/salary/community reviews.
22. Avoid dashboard clutter.
23. After each task run relevant lint/typecheck/test/build checks.
24. Fix issues introduced by your changes.
25. Summarize:
    - files changed
    - schema changes
    - metrics implemented
    - sample-size rules
    - query/cache architecture
    - commands run
    - limitations

Visual direction:

Company pages should feel like Apple-style intelligence reports for interview preparation.

Use:
- clear reading order
- restrained data density
- simple ranked lists
- small tables
- subtle bars when helpful
- strong preparation CTAs
- sample-size context

Avoid:
- walls of charts
- dashboard-grid explosion
- rainbow category colors
- radar charts
- 3D charts
- prestige scores
- fake precision
```

---

# Week 7 Suggested Route Map

At the end of Week 7:

```text
/companies

/companies?q=...
/companies/[slug]

/companies/[companySlug]/roles/[positionSlug]

/companies/[slug]/prepare
```

Optional:

```text
/companies/[slug]/trends
/companies/compare
```

Connected routes:

```text
/interviews?company=...
/knowledge?company=...
/coding?company=...
```

---

# Suggested Component Structure

```text
src/components/companies/

company-card.tsx
company-header.tsx
company-role-breakdown.tsx

top-topics.tsx
top-knowledge-questions.tsx
top-coding-problems.tsx

company-interview-emphasis.tsx
company-difficulty.tsx
round-type-distribution.tsx
season-comparison.tsx

company-trending-questions.tsx
company-recent-interviews.tsx
recent-changes.tsx

company-preparation-guide.tsx
sample-size-note.tsx
```

Do not force exact file split if consolidation is cleaner.

---

# Suggested Company Intelligence Architecture

```text
Published Interview Graph
         │
         ▼
Stats Refresh Service
         │
         ├── Company Stats
         ├── Position Stats
         ├── Topic Stats
         ├── Question Stats
         ├── Coding Stats
         ├── Season Stats
         ├── Difficulty Stats
         └── Round Stats
                 │
                 ▼
        Company Query Layer
                 │
                 ▼
           Company Pages
                 │
                 ▼
        Preparation Guidance
```

---

# Metric Principle

Prefer:

```text
GRPO appeared in 7 of 18 published interviews.
```

over:

```text
GRPO is a 39% important topic.
```

Metrics should remain understandable without reading analytics documentation.

---

# Small Sample Principle

If:

```text
n = 1
```

do not say:

```text
100% of interviews ask GRPO.
```

Say:

```text
GRPO appeared in the only published interview record currently available.
Limited data.
```

Trust matters more than impressive-looking analytics.

---

# Preparation Guide Principle

The company guide should not be a generic LLM paragraph.

It should be a ranked study plan backed by:

```text
frequency
recency
role relevance
coding occurrence
topic occurrence
```

and direct links into RoboPrep content.

---

# Week 8 Handoff

Once Week 7 is accepted, Week 8 should focus on:

```text
Productization + Launch
```

Recommended Week 8 scope:

```text
SEO
performance
analytics
error tracking
security review
moderation polish
mobile polish
landing page refinement
onboarding
search polish
production deployment
backup/recovery
privacy/terms pages
launch checklist
```

Week 8 should prioritize launch quality rather than adding another major product subsystem.
