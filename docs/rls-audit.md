# RLS audit (Week 8 Task 68)

Verified against migrations `0001`–`0024`.

| Table | Public | Owner | Admin/service |
| --- | --- | --- | --- |
| profiles | none | select/update own (fixed columns) | service role |
| companies, positions, topics, questions (published), question_topics | select (published rows/policies) | — | service role |
| interviews | select published only | — | service role |
| interview_rounds / interview_tags | select published-parent | — | service role |
| coding_problems | catalog view only (no solution/evaluator columns) | — | service role |
| coding_test_cases | visible (non-hidden) view only | — | service role |
| coding_submissions / cases | none | owner rows | service role |
| user_coding_progress | none | owner | service role |
| coding_collections | published select | — | — |
| interview_submissions | none | insert own + select own | service role |
| interview_drafts / round/question drafts / ingestion_jobs / ingestion_events / review_tasks | none (RLS on, no policies) | — | service role only |
| company_stats family | select (aggregates) | — | refresh function (definer) only |
| company_aliases | select | — | service role |
| content_reports / user_feedback | none | insert own (+ select own for reports) | service role |
| questions hidden fields (solution_code etc.) | not in public projections | — | — |

Danger review: no table grants anonymous writes; admin actions never rely on
client-side UI hiding; the `security_invoker` views from Week 4 keep column
grants minimal.

Authorization route audit (Task 69): admin pages/actions re-check
`requireReviewer()` server-side; submission detail and settings pages verify
ownership server-side; mutation routes validate server-side Zod schemas
(Task 71) and never trust client status/config.
