# Security sign-off (Week 8 Task 137)

Scope reviewed against the real repository; every launch blocker is closed or
the feature is flag-disabled by default in production.

| Area | Status | Evidence |
| --- | --- | --- |
| RLS on all exposed tables | ✅ | docs/rls-audit.md (migrations 0001–0024) |
| Secrets out of client/logs/docs | ✅ | docs/week8-secret-audit.md |
| Admin authorization server-side | ✅ | `requireReviewer()` in layout + every action |
| Judge isolation | ✅ (conditional) | local adapters refuse in production; provider required — else `FLAG_CODING_JUDGE=off` |
| Hidden tests / reference solutions | ✅ | server-only judge definitions; public views exclude them |
| LLM keys / payload hygiene | ✅ | server-only env; redaction policy; PII redaction before provider calls |
| PII handling | ✅ | redaction helpers, moderation flags store counts only |
| XSS | ✅ | React default escaping; no raw HTML rendering anywhere; `dangerouslySetInnerHTML` absent from content paths |
| Outbound URL safety | ✅ | submission URLs validated to http(s) at intake (ingestion service) |
| Input validation | ✅ | server-side Zod on every mutation route/action |
| Rate limiting | ✅ (single-instance) | documented scaling caveat (technical-debt register) |
| Mutation methods | ✅ | POST-only API mutations; server actions follow framework CSRF posture |
| Dependency audit | ✅ | no known critical/high at audit time (pnpm audit); majors intentionally not bumped |

No open P0 launch blockers as of this audit.
