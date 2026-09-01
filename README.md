# RoboPrep

Interview preparation for **Embodied AI** roles — real interview experiences,
structured knowledge questions, and hands-on robotics/ML coding.

RoboPrep **v1.0.0** covers Weeks 1–8: the foundation, the Interview System,
the Python Coding MVP, the Embodied AI / ML coding evaluator (function/class +
PyTorch CPU checks), the Interview Submission + Content Ingestion Pipeline,
Company Intelligence, and production hardening (feature flags, observability,
global search, security headers, legal pages, ops runbooks). Read the delivery
notes in [`docs/week7-status.md`](./docs/week7-status.md) and
[`docs/week8-status.md`](./docs/week8-status.md), the architecture overview in
[`docs/architecture.md`](./docs/architecture.md), and launch operations in
[`docs/launch-checklist.md`](./docs/launch-checklist.md) /
[`docs/launch-day-runbook.md`](./docs/launch-day-runbook.md).

---

## Contents

- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Database migrations](#database-migrations)
- [Database seed](#database-seed)
- [Coding judge](#coding-judge)
- [Development commands](#development-commands)
- [Project structure](#project-structure)
- [Contribution conventions](#contribution-conventions)

---

## Tech stack

| Layer      | Choice                             |
| ---------- | ---------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) |
| Language   | TypeScript (strict)                |
| Styling    | Tailwind CSS 4 (CSS-first tokens)  |
| Database   | Supabase PostgreSQL                |
| Auth       | Supabase Auth (email + password)   |
| Validation | Zod                                |
| Icons      | Lucide React                       |
| Package    | pnpm                               |
| Deployment | Vercel                             |

State management is intentionally absent — Server Components read from Supabase
directly and Client Components hold only local form/UI state.

---

## Architecture

### Data model

Canonical content is stored once and referenced many times:

```
Company ──< Position ──< Interview ──< InterviewRound ──< InterviewQuestionOccurrence >── Question
                                                    └── optional CodingProblem
Question ──< QuestionTopic >── Topic
CodingProblem ──< CodingTestCase
             └──< CodingSubmission ──< CodingSubmissionCase
```

- `questions` holds **canonical** questions. An interview never duplicates one.
- `interview_questions` carries per-occurrence wording, round, order, and an
  optional canonical Knowledge or Coding link. Deleting a question is
  `RESTRICT`ed there on purpose.
- `topics` is a self-referencing hierarchy (`Embodied AI → RL → GRPO`).
- Coding clients use safe projections so solution code and hidden test content
  never enter public page props.

### Request path

```
browser ──▶ src/proxy.ts            refresh Supabase session cookie on every request
        ──▶ Server Component        typed feature query layer → Supabase server client
        ──▶ Coding API              validation → auth/rate limit → judge service
        ──▶ Client Component        local UI state only; browser Supabase client is RLS-scoped
```

### Environment split

| Module                  | Scope                    | Notes                                                |
| ----------------------- | ------------------------ | ---------------------------------------------------- |
| `src/lib/env.ts`        | public (`NEXT_PUBLIC_*`) | Safe in Client Components                            |
| `src/lib/env.server.ts` | server only              | Importing it from a Client Component fails the build |

Both are validated with Zod in `src/lib/env.shared.ts`. In production a missing
variable throws at start-up with a readable message; in development it warns and
falls back so `pnpm dev` still boots on a fresh clone.

---

## Prerequisites

- **Node.js** 22 or newer (CI uses 24)
- **pnpm** — the repo pins a version via `packageManager`
  ```bash
  npm install -g pnpm
  ```
- **Docker** — required by the Supabase CLI for local Postgres
- **Supabase CLI** (only for local database work)
  ```bash
  brew install supabase/tap/supabase
  ```

---

## Quick start

```bash
git clone <your-fork-url> roboprep
cd roboprep

pnpm install
cp .env.example .env.local

# Start the local Supabase stack and print the API credentials.
supabase start

# Paste SUPABASE_URL / ANON_KEY into .env.local, then:
supabase db reset   # applies migrations + seed.sql

pnpm dev
```

Open <http://localhost:3001>.

> The dev port is pinned to 3001 because Cursor already occupies 3000 on this
> machine — see the `dev` script in `package.json`.

> **No Supabase yet?** The app still runs. Every data-fetch helper detects the
> missing configuration and returns empty results, so pages render empty states
> instead of crashing.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill it in:

| Variable                        | Visibility | Required | Purpose                                                   |
| ------------------------------- | ---------- | -------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | public     | yes      | Supabase project (or local) API URL                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public     | yes      | Anonymous key — safe in the browser                       |
| `SUPABASE_SERVICE_ROLE_KEY`     | server     | no       | Trusted server routes and integrity scripts; bypasses RLS |
| `NEXT_PUBLIC_SITE_URL`          | public     | yes      | Canonical origin, used for auth redirects                 |
| `JUDGE_PROVIDER`                | server     | no       | `judge0` or development-only `local`                      |
| `JUDGE0_BASE_URL`               | server     | no       | Judge0-compatible execution endpoint                      |
| `JUDGE0_API_KEY`                | server     | no       | Optional provider credential                              |
| `PYTHON_EXECUTABLE`             | server     | no       | Local development Python executable                       |
| `JUDGE_TIMEOUT_MS`              | server     | no       | Provider polling/request timeout                          |

Rules:

- Never commit `.env*` files. `.env.example` is the only tracked env file.
- Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_` — that would ship
  it to the browser.
- On Vercel, add the same variables in **Project Settings → Environment Variables**.
- Use an isolated Judge0-compatible backend in production. `local` is not a
  production sandbox and is rejected by the production judge service.

---

## Supabase setup

**Local (recommended for development)**

```bash
supabase start          # boots Postgres, Auth, Studio and Inbucket (mail) in Docker
supabase status         # prints API URL, anon key and service_role key
```

Point `.env.local` at the printed `API URL` and anon key. Keep the service-role
key server-only. Inbucket runs at <http://localhost:54324> and receives the
email-confirmation links.

**Hosted project**

1. Create a project at <https://supabase.com/dashboard>.
2. Copy the Project URL and anon key from **Project Settings → API**.
3. Push the migrations:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
4. Apply the seed manually if you want demo content:
   ```bash
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```

---

## Database migrations

Migrations live in `supabase/migrations/` and are plain SQL:

| File                             | Contents                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| `0001_initial_schema.sql`        | Core tables, indexes, and update triggers                   |
| `0002_rls.sql`                   | Baseline content/profile RLS                                |
| `0003_knowledge_schema.sql`      | Knowledge questions, topics, relations, and stats           |
| `0004_knowledge_search.sql`      | Knowledge search indexes                                    |
| `0005_interview_schema.sql`      | Interview metadata, rounds, tags, and provenance extensions |
| `0006_interview_rls.sql`         | Published-parent interview policies                         |
| `0007_interview_search.sql`      | Interview trigram indexes                                   |
| `0008_coding_schema.sql`         | Problems, test cases, submissions, and per-case results     |
| `0009_coding_rls.sql`            | Coding RLS, public-safe projections, and column grants      |
| `0010_coding_search.sql`         | Coding search indexes                                       |
| `0011_interview_coding_link.sql` | Optional interview occurrence → coding problem link         |

```bash
supabase db reset        # drop, re-apply all migrations, then run seed.sql
supabase migration new <name>   # create a new timestamped migration
supabase db push         # push local migrations to a linked hosted project
```

`./scripts/db-reset.sh` is a thin wrapper around `supabase db reset`.

RLS baseline: anonymous visitors can read published content and safe coding
projections. Users can read only their own coding submissions. Nobody but a
trusted server/service role can mutate content or create completed submissions.

---

## Database seed

`supabase/seed.sql` is applied automatically by `supabase db reset`. It inserts a
deterministic development dataset:

- 7 companies (ByteDance, NVIDIA, Physical Intelligence, Figure AI, Unitree,
  AgiBot, DJI)
- 5 positions
- 14 topics in a parent/child hierarchy
- 10 canonical questions with quick and deep answers
- 20 published interviews, 50 rounds, and 85 question occurrences
- 20 published Python coding problems and 100 test cases (2 visible + 3 hidden per problem)
- 20 coding-topic links across Transformer, RL, Robotics, Diffusion, Robot Learning, and Algorithms

Re-seed at any time:

```bash
supabase db reset
# or
./scripts/db-reset.sh
```

---

## Coding judge

The Week 4 workflow is Python-only. Configure a Judge0-compatible provider for
production:

```dotenv
JUDGE_PROVIDER=judge0
JUDGE0_BASE_URL=https://your-judge0-host.example
JUDGE0_API_KEY=
JUDGE_TIMEOUT_MS=15000
```

For local development, `JUDGE_PROVIDER=local` runs the restricted development
adapter using `PYTHON_EXECUTABLE`. It applies a timeout and output cap but is not
an OS-level security sandbox. The browser submits only a problem slug and source
code; hidden inputs and expected outputs are loaded on the server.

Useful checks:

```bash
pnpm test:judge       # deterministic local adapter smoke test
pnpm check:coding     # schema/seed integrity check
```

## Interview ingestion

Signed-in users can submit interview experiences at `/interviews/submit`.
Submissions are parsed into drafts (deterministic mock parser by default; set
`INGESTION_LLM_PROVIDER`/`INGESTION_LLM_API_KEY` for an OpenAI-compatible
provider), flagged for duplicates/PII, and published only after human review
by a `reviewer`/`admin` (via `/admin/interviews/review`). Useful checks:

```bash
pnpm check:ingestion  # ingestion data integrity (needs reachable Supabase)
pnpm test:ingestion   # end-to-end mock-parser pipeline smoke test (needs DB)
pnpm test:live-parser # optional; no-op without INGESTION_LLM_*
pnpm refresh:companies # rebuild company intelligence caches (needs DB)
pnpm check:companies   # company cache integrity (needs DB)
pnpm test:companies    # company intelligence fixture smoke test (needs DB)
```

See [`docs/week4-security.md`](./docs/week4-security.md) before deploying a
public judge.

## Development commands

```bash
pnpm dev          # start the dev server on http://localhost:3001
pnpm build        # production build
pnpm start        # serve the production build
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # core utility tests
pnpm check:interviews # interview seed/integrity check
pnpm check:coding # coding seed/integrity check
pnpm test:judge   # optional local judge integration check
pnpm format       # Prettier (write)
pnpm format:check # Prettier (verify)
```

CI runs `pnpm lint`, `pnpm typecheck` and `pnpm build` on every pull request
(`.github/workflows/ci.yml`).

---

## Project structure

```text
.
├── src/
│   ├── app/                     # App Router routes
│   │   ├── auth/callback/       # email-confirmation handler
│   │   ├── knowledge/           # filtered canonical question list/detail
│   │   ├── interviews/           # interview list/detail and provenance
│   │   ├── coding/               # problem list/detail and submissions
│   │   ├── companies/
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── layout.tsx           # root shell (Navbar + main + Footer)
│   │   ├── page.tsx             # landing page
│   │   └── globals.css          # design tokens
│   ├── components/
│   │   ├── auth/                # sign-in / sign-up forms, user menu
│   │   ├── layout/              # navbar, footer, container, page header
│   │   └── ui/                  # design-system primitives
│   ├── hooks/                   # reserved for shared client hooks
│   ├── lib/
│   │   ├── auth/session.ts      # current user + profile helpers
│   │   ├── data/queries.ts      # shared legacy read-only data access
│   │   ├── knowledge/            # Knowledge filters, mappers, and queries
│   │   ├── interviews/           # Interview filters, mappers, and queries
│   │   ├── coding/               # Coding filters, mappers, helpers, and queries
│   │   ├── judge/                # provider adapters, service, validation, limits
│   │   ├── supabase/            # browser, server, admin and proxy clients
│   │   ├── validation/auth.ts   # Zod auth schemas
│   │   ├── env*.ts              # validated environment access
│   │   └── utils.ts             # cn(), safeInternalPath()
│   ├── types/database.ts        # hand-maintained mirror of the schema
│   └── proxy.ts                 # session refresh (Next.js 16 "proxy" convention)
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── scripts/
├── docs/
├── .env.example
└── .github/workflows/ci.yml
```

---

## Contribution conventions

1. **Server Components by default.** Add `"use client"` only when you need state,
   effects or browser APIs.
2. **No raw colours.** Use the tokens in `src/app/globals.css`
   (`bg-surface`, `text-ink-secondary`, `border-line`, `rounded-md`, …). The
   visual language is Apple-inspired: high whitespace, restrained shadows, blue
   reserved for primary actions.
3. **Reuse UI primitives** from `src/components/ui/`. Do not add a component
   library.
4. **No `any`.** ESLint errors on it; narrow `unknown` instead.
5. **Validate at the edges** with Zod (`src/lib/validation/`).
6. **Server-only secrets** stay behind `src/lib/env.server.ts`.
7. **New tables** need a migration _and_ an RLS policy in the same changeset.
8. Before opening a PR:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```
9. Keep commits focused: one task per commit.
