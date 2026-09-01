# Data retention (Week 8 Task 100)

| Data | Retention | Notes |
| --- | --- | --- |
| Raw interview submissions | Until resolved + 12 months, then anonymized (submitter id nulled) | Raw text is immutable while pending review |
| Coding submissions (source + results) | Life of account + 30 days | Deleted with account; aggregate stats persist |
| Provider payloads (LLM) | Not stored beyond `ingestion_jobs` token/cost metadata | Prompts/responses are never persisted |
| Judge provider logs | Provider-side, ≤ 30 days | Contain no app secrets |
| Structured app logs | 14–30 days (platform) | Scrubbed (Task 101) |
| Product analytics events | 14 months max, aggregated after | No PII (see product-analytics.md) |
| Error tracking events | 90 days | Scrubbed |
| Backups | 30 days | docs/backup-recovery.md |
| content_reports / user_feedback | Until resolved + 12 months | Reporter identity private |

Sensitive data is never retained indefinitely; account deletion (Task 44)
removes profile + submissions immediately.
