# Changelog

## 1.0.0 (2026-09-02)

First public V1.

### Added
- **Knowledge System** (Week 2): canonical questions, topic hierarchy,
  question graph, search.
- **Interview System** (Week 3): structured interview records, rounds,
  question occurrences with provenance.
- **Coding platform** (Weeks 4–5): 53 published Python/ML problems,
  Monaco editor, Run/Submit with hidden tests, program + ML function/class
  judges (CPU PyTorch with shape/numerical/gradient checks), collections,
  per-user progress.
- **Interview ingestion** (Week 6): authenticated raw submission, LLM/mock
  parser with strict validation, canonicalization review, duplicate
  detection, moderation flags, human review queue, idempotent publish with
  provenance and privacy safeguards.
- **Company Intelligence** (Week 7): company/role pages, topic/question/
  coding frequency with sample-size policy, difficulty and season
  comparison, volume-normalized trends, preparation guides.
- **Production hardening** (Week 8): feature flags, structured logging with
  correlation ids, redaction policy, health endpoint, admin ops/audit/
  diagnostics, global ⌘K search with bilingual aliases, robots/sitemap/
  canonical/OG metadata, security headers, onboarding/settings/password
  reset/account deletion, legal pages, feedback + content reports,
  recovery/production smoke scripts, ops runbooks.

### Known limitations
See `docs/technical-debt.md` and `docs/week8-status.md`. The coding judge
requires an isolated provider in production; rate limiting is
single-instance at V1 scale.
