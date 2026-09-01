# Week 4 security audit

Date: 2026-09-01

## Data boundary

| Asset                                       | Browser access                             | Enforcement                                                                           |
| ------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| Published problem metadata and starter code | Public through `coding_problem_catalog`    | Published-row RLS plus safe view columns                                              |
| Visible examples                            | Public through `coding_visible_test_cases` | `is_hidden = false` parent policy                                                     |
| `solution_code`                             | Not readable by `anon` or `authenticated`  | Column grant is deliberately omitted                                                  |
| Hidden test input/expected output           | Not readable by browser clients            | Hidden rows are excluded by RLS; hidden columns are not part of the public projection |
| Submission source/results                   | Owner only                                 | `auth.uid() = user_id` policies and owner-scoped server queries                       |
| Judge token/internal error                  | Server-side only                           | No public column grant and no page/API serialization                                  |

The local audit verified that an anonymous client can read the two public coding views, receives `permission denied` when selecting the sensitive `coding_problems` table, and cannot obtain hidden test rows through `coding_test_cases`. The public visible-test table path returns only visible rows.

## Execution boundary

- The browser sends only `{ slug, sourceCode }`. It cannot provide expected output, hidden inputs, language overrides, or provider tokens.
- Zod validates the body, enforces a slug format, and caps source code at 50 KB.
- `/api/coding/run` reads visible examples through the public problem query layer.
- `/api/coding/submit` authenticates with Supabase, validates the published problem, and loads the complete test definition only through the server-side admin client.
- The service role key and optional Judge0 API key are imported only from server modules. They are never prefixed with `NEXT_PUBLIC_` or included in client props.
- Provider failures, stack traces, and raw Judge0 responses are logged server-side only; user responses contain stable status messages.

## Abuse controls

- Anonymous run requests are limited to 20 per five minutes per best-effort forwarded IP key.
- Authenticated submits are limited to 10 per five minutes per user ID.
- The local adapter uses an isolated Python mode (`-I -S`), a timeout, a 256 KB combined output cap, and a minimal environment. This is a development guardrail, not a production sandbox.
- Production must use an isolated execution provider. With `JUDGE_PROVIDER=local`, the production service refuses to execute code.

## Known MVP risks and next steps

- The in-process rate limiter is not shared across instances and can be bypassed by changing IPs. Replace it with an external counter before a public multi-instance launch.
- Synchronous submission requests consume server request time while all cases run sequentially. Add a queue and polling state for higher workloads.
- Judge0 or an equivalent backend must enforce OS-level isolation, CPU, memory, filesystem, and network policy. Do not expose the local subprocess adapter in production.
- Apply migrations to the hosted Supabase project only after an explicit review of the target project and its backup/rollback procedure.
