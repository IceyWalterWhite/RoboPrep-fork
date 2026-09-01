# RoboPrep architecture (Week 8 Task 135)

```
Next.js (App Router, Server Components default, TypeScript strict)
        │
  ┌─────┼──────────────┬─────────────────┐
  ▼     ▼              ▼                 ▼
Knowledge   Interviews    Coding         Company Intelligence
(questions, (occurrences, (problems,     (stats caches, guides)
 topics,    rounds,       judge,         (src/lib/companies)
 graph)     provenance)   submissions)
  └─────┼──────────────┴────────┬──────┘
        ▼                       ▼
   Supabase PostgreSQL      Ingestion pipeline
   (RLS: public/owner/      (submission → parser →
    service-role)            draft → review → publish RPC)
        │                       │
        └───────┬───────────────┘
                ▼
   Cross-cutting: feature flags, structured logger + correlation ids,
   redaction policy, health/monitoring, rate limiting, security headers
```

Key subsystems:

- **Judge** (Weeks 4–5): `JudgeService` → isolated providers (local dev
  adapter refuses in production; Judge0-compatible for prod). Program mode
  (stdin/stdout) + ML function/class mode with value/shape/dtype/gradient
  checks. Hidden tests never leave the server.
- **Ingestion** (Week 6): immutable raw submissions → LLM/mock parser with
  strict Zod validation → drafts → human review → idempotent publish RPC.
- **Company Intelligence** (Week 7): eight rebuildable caches refreshed on
  publish; deterministic metrics with sample-size policy.
- **Observability** (Week 8): `/api/health`, structured logs with
  `x-request-id`, redaction policy, feature flags, admin diagnostics.

Data flow for user content: browser → server route (Zod) → service layer →
Supabase (RLS) → redacted result. The browser only ever sends identity-free
inputs (slugs, source code, raw interview text) and receives redacted output.
