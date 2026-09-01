# Week 4 status — Python Coding MVP

Date: 2026-09-01

Week 4 is implemented as a Python-only coding loop:

```text
Problem → Monaco editor → Run visible examples → Submit hidden tests → Result → History
```

## Implemented

- Added relational coding problems, topic relations, visible/hidden test cases, submissions, and per-case results in migrations `0008`–`0011`.
- Added public-safe catalog and visible-test projections. Solution code and hidden test content are excluded from browser-readable columns and rows.
- Added typed coding summaries/details, URL filters, pagination, topic/category/difficulty/progress options, acceptance-rate helpers, and owner-scoped submission queries.
- Added `/coding` discovery, `/coding/[slug]` problem detail, responsive statement/examples/editor/history layout, `/coding/submissions/[id]`, loading/error/404 states, and Knowledge topic links.
- Added dynamically loaded Monaco Python editor (`@monaco-editor/react`) so the editor is not included in the initial list page.
- Added `POST /api/coding/run` for visible examples and `POST /api/coding/submit` for authenticated full-suite judging. Added owner-scoped `GET /api/coding/submissions/[id]`.
- Added a judge adapter boundary with Judge0 support, development-only local Python execution, timeout handling, output caps, status aggregation, weighted scores, and sanitized user-facing errors.
- Seeded 20 published problems and 100 cases: two visible examples plus three hidden tests per problem. The distribution is Transformer 5, RL 4, Robotics 4, Diffusion 3, Robot Learning 2, and Algorithms 2.

## Judge configuration

Copy `.env.example` to `.env.local` and configure:

```dotenv
JUDGE_PROVIDER=judge0
JUDGE0_BASE_URL=https://your-judge0-host.example
JUDGE0_API_KEY=
PYTHON_EXECUTABLE=python3
JUDGE_TIMEOUT_MS=15000
```

`JUDGE_PROVIDER=local` is intended only for local development. Production rejects the local subprocess path and should use an isolated provider such as Judge0. Week 4 deliberately does not include C++, Java, GPU, CUDA, PyTorch, or custom microVM infrastructure.

## Verification

```bash
supabase db reset --yes
pnpm check:coding
pnpm test:judge
pnpm test
pnpm lint
pnpm typecheck
```

The local checks currently pass with 20 published problems, 100 test cases, and 20 topic links. `pnpm test:judge` exercises the local Python adapter with a deterministic expression; it does not require a remote provider.

Security findings and deployment guidance are documented in [`docs/week4-security.md`](./week4-security.md).

## Deliberate limitations

- Submit is synchronous in this MVP; a future queue can move long-running provider work out of the request path.
- The rate limiter is an in-process map and is suitable for a single development process, not a multi-instance production deployment.
- The local Python adapter is not a security sandbox. Use an isolated remote execution backend before enabling submissions in production.
- Acceptance rates are empty until completed submissions exist. User progress is derived from the signed-in user's own submission rows.
- The configured hosted Supabase project has not been migrated automatically. Run `supabase db push` only after reviewing and authorizing the target project.
