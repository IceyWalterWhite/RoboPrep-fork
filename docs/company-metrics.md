# Company metrics

Reproducible metric definitions for Company Intelligence (Week 7). Every
metric derives from **published interviews only** (Task 63: published +
reviewed content counts; development-seed records are labeled `source_type =
"development"` and are excluded from production analytics). Sample size is
always available alongside any percentage.

## Data inclusion policy

- Truth source: `interviews (status = 'published')` joined to
  `interview_rounds`, `interview_questions`, `questions`, `coding_problems`,
  `topics`.
- Draft / rejected / archived records never contribute to any metric.
- Cache tables are rebuildable accelerators
  (`refresh_company_stats`), never truth sources.

## Metric definitions

### Topic share

```text
share_of_interviews = interviews containing ≥1 occurrence of the topic
                      / company's published_interview_count
```

Denominator is the company's **published interview count** (not occurrences,
not rounds). Copy convention: "GRPO appeared in 7 of 18 published interview
records."

### Question frequency

```text
occurrence_count = number of occurrences of the canonical question in the
                   company's published interviews (a question asked twice in
                   one interview counts twice)
interview_count  = distinct interviews containing the question
```

Rankings use `interview_count` first, `occurrence_count` as tiebreaker.

### Coding share

```text
coding_share = coding occurrences / all question occurrences
```

Occurrences linked to neither a canonical question nor a coding problem are
"unclassified" and counted in the denominator. Unlinked raw coding questions
count toward aggregate coding emphasis but **not** toward the canonical coding
problem ranking (Task 6).

### Difficulty distribution

```text
easy = 1, medium = 2, hard = 3
average_score = Σ(score) / known-sample-size
```

Interviews with `difficulty_overall = 'unknown'` are counted separately and
excluded from the average. `sample_size` is always shown; no false precision
(average rounded to one decimal).

### Round-type distribution

```text
share = rounds of that type / total published rounds for the company
```

`unknown` round types are included. The denominator is rounds, not interviews.

### Typical interview structure

```text
median round count and median question count across published interviews
```

Medians over averages (Task 32); presented as integers ("3 rounds · 9
questions").

### Season comparison

```text
grouping key = (company_id, year, normalize(season))
normalize(season): lowercase, 'fall' → 'autumn'
```

Interviews missing year or season are excluded from season comparison
entirely (they cannot pollute a season bucket). Per-season metrics:
interview count, coding share, average questions per interview.

### Trend score (Task 35)

```text
recent_window    = last 90 days (by interview published_at)
recent_rate      = occurrences_90d / max(interviews_90d, 1)
historical_rate  = (occurrences − occurrences_90d)
                   / max(interviews − interviews_90d, 1)
trend_score      = round4(recent_rate − historical_rate)
```

Normalizing by interview volume prevents an interview-count burst from
faking a trend. Same input → same output.

- **Emerging** (Task 37): recent occurrences ≥ 2 **and** trend_score ≥ 0.25.
- **Declining** (Task 38): trend_score ≤ −0.25 with occurrences on both
  sides of the window. Low visual priority.
- Trend lists exclude items with fewer than 3 total occurrences — no
  single-record overclaims (Task 36).

### Sample-size policy (Task 24)

| Sample | Label / behavior |
| --- | --- |
| n < 3 | "Limited data · n interviews"; percentages suppressed |
| 3 ≤ n < 10 | counts primary ("in 4 of 9 interviews") |
| n ≥ 10 | percentage may be primary; count in parentheses |

### Preparation guide ranking (Task 42)

```text
topic score    = 0.5 × interview_share + 0.3 × trend + 0.2 × role_relevance
question score = 0.6 × normalized_interview_count
               + 0.3 × trend + 0.1 × recency (365-day decay)
coding score   = same formula as question score
```

All inputs clamped to [0, 1]. Deterministic; ties broken alphabetically.
Role pages use role-specific shares as `role_relevance` and fall back to
company-wide stats (explicitly labeled) below 3 role interviews (Task 44).

### Internal data confidence score (Task 64, admin-only)

```text
confidence = 0.35 × min(1, interviews / 10)
           + 0.30 × (linked occurrences / all occurrences)
           + 0.20 × min(1, seasons_covered / 3)
           + 0.15 × (roles_covered > 0)
```

Not exposed publicly.

## Copy rules (Task 82)

Allowed: "GRPO appeared in 7 of 18 published interview records."
Avoided: "ByteDance definitely asks GRPO", "You will be asked…", superlatives,
prestige rankings.
