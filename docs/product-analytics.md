# Product analytics (Week 8 Tasks 13, 15, 117)

## Event model

| Event | Properties (no PII) | When |
| --- | --- | --- |
| `page_view` | `path` | Any public route |
| `sign_up` | — | Successful registration |
| `sign_in` | — | Successful sign-in |
| `knowledge_view` | `slug` | Knowledge detail |
| `interview_view` | `slug` | Interview detail |
| `company_view` / `company_role_view` | `slug` | Company/role pages |
| `coding_run` | `slug`, `status` | Run executed |
| `coding_submit` | `slug`, `mode` | Submission recorded |
| `coding_accepted` | `slug` | Accepted submission |
| `interview_submission_created` | `charCount` bucket | Raw interview submitted |
| `search_performed` | `resultCount` bucket | Global search |
| `feedback_sent` | `category` | Feedback form |

Rules: no interview text, no source code, no user ids in payloads; server
events are emitted through the structured logger (`event` + scrubbed metadata);
a hosted analytics provider can be attached behind `NEXT_PUBLIC_ANALYTICS_ID`
(Task 14 wrapper keeps rendering non-blocking).

## Launch funnels (Task 15)

1. **Acquisition → Study**: `/` → `page_view /knowledge` → `knowledge_view`.
2. **Coding loop**: `/coding` → `coding_run` → `coding_submit` → `coding_accepted`.
3. **Company prep**: `company_view` → `/companies/[slug]/prepare` → outbound knowledge/coding links.
4. **Contribution**: `interview_submission_created` → published interview count.

## First-30-day metrics (Task 117)

WAU, knowledge views, coding run→submit conversion, acceptance rate,
interview submissions received vs published, search zero-result rate, company
page views. All computable from the events above plus DB counts.
