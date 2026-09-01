# Environments (Week 8 Task 2)

| | Local dev | Preview/staging | Production |
| --- | --- | --- | --- |
| Supabase | Local (`supabase db reset`) or hosted dev project | Dedicated staging project (isolated data) | Production project |
| Judge | `JUDGE_PROVIDER=local` (dev-only adapter, hard-refused in production) | Judge0-compatible, low limits | Judge0-compatible, isolated workers |
| LLM ingestion | Unset → deterministic mock parser | Optional; low caps | `INGESTION_LLM_*` configured |
| Feature flags | All on | Judge/ingestion may be off | Operator-controlled (`FLAG_*`) |
| Analytics / error tracking | Off | Optional | Enabled (Task 11/14: provider-agnostic client) |
| `NEXT_PUBLIC_SITE_URL` | http://localhost:3001 | Preview origin | Canonical production origin |

Rules:

- Production secrets never live in `.env.example` or the repository; `.env.local` is git-ignored.
- `NEXT_PUBLIC_*` variables are safe to expose; everything else is server-only via `src/lib/env.shared.ts` (`server-only` import wall).
- Preview/staging uses a separate Supabase project — never a copy of production with live user data.
- Robots: preview sets `FLAG_ROBOTS_INDEX=off` so it is not indexed.
