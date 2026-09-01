# Week 5 status — Embodied AI / ML Coding Platform

Date: 2026-09-02

Week 5 extends the Week 4 Python coding MVP into a differentiated Embodied AI / ML
coding platform. RoboPrep now supports two evaluation modes:

```text
Mode A — Standard Program Judge
stdin → Python program → stdout → comparison

Mode B — ML Function Judge
user function/class → controlled harness → value / shape / dtype / gradient /
exception checks → structured feedback → redacted client result
```

## Implemented

- Every coding problem declares how it is evaluated: `evaluation_mode`
  (`program` | `function` | `class`), `entrypoint_type`, `entrypoint_name`,
  `framework` (`python` | `numpy` | `pytorch`), `resource_profile`, and a
  server-validated `evaluator_config` jsonb.
- A structured test-case schema (`test_type`, `test_group`, `input_json`,
  `expected_json`, `metadata`) alongside the Week 4 stdin/stdout fields, so
  program-mode and ML-mode coexist in one system.
- An ML judge domain model (`src/types/ml-judge.ts`) with no `any`, public and
  hidden result types separated, and discriminated unions for evaluator config
  and evaluation requests.
- `JudgeService.evaluate(request)` accepts a discriminated union of program and
  ML requests; page components never know provider details.
- A local ML Python adapter (`src/lib/judge/adapters/ml-python.ts`) that runs a
  generated, trusted harness in a child process with timeouts, memory limits,
  stdout caps, and a structured JSON result. The Next.js server process never
  executes user source in-process; the child-process path is documented as
  non-production-safe and production requires an isolated provider.
- A deterministic Python harness generator (`src/lib/judge/harness/`) for
  function and class entrypoints: known entrypoint, controlled inputs, stdout
  capture, exception capture, signature probing, and a machine-readable payload
  that user `print()` output cannot corrupt.
- Entrypoint validation that fails early with a categorized, readable error
  ("Expected function `gae`, but no callable was found.") without revealing
  hidden tests.
- Deterministic structured-input serialization (ints, floats, bools, strings,
  lists, dicts, tensor specs with shape/dtype/values/`requires_grad`) and a
  numerical comparator framework (`exact`, `allclose`, `absolute_error`,
  `relative_error`) with NaN/Inf rules, returned error magnitudes, and no UI
  coupling.
- Shape, dtype, gradient (forward/backward separated, `requires_grad` inputs,
  trusted reference gradients), exception, and informational performance
  checks; test-group aggregation with required vs optional groups.
- ML result UI: `ml-result-panel.tsx`, `ml-check-results.tsx`,
  `evaluation-metadata.tsx`, visible-run diagnostics (input/expected/your
  shape, max abs error), and centralized hidden-test redaction shared by the
  API and submission detail.
- Curated coding collections and user coding progress (see below), plus a
  difficulty report and per-problem analytics helpers.
- `scripts/check-coding-integrity.ts` now validates evaluation mode,
  entrypoint, framework, evaluator config, structured tests, hidden-test
  counts, and resource profiles, with failures pointing at problem slugs.

## Database changes

- `0012_coding_evaluation_modes.sql` — evaluation mode, entrypoint, framework,
  resource profile columns on `coding_problems` (existing problems default to
  `program`).
- `0013_coding_submission_breakdown.sql` — `evaluation_summary` jsonb on
  coding submissions (aggregated pass/total per group only; no hidden raw test
  payloads), owner-only RLS preserved.
- `0014_coding_collections.sql` — `coding_collections` and
  `coding_collection_problems` (ordered many-to-many, composite key, no arrays
  of IDs).
- `0015_user_coding_progress.sql` — rebuildable `user_coding_progress` cache;
  submissions remain the source of truth and Accepted always produces solved.
- `0016_coding_public_evaluation_hints.sql` — a security-definer helper that
  publishes only derived evaluation-capability labels, so the browser can show
  "how a problem is judged" without ever exposing raw `evaluator_config`.

## Evaluator architecture

```text
Browser (problem slug + source code only)
→ RoboPrep server (server-authoritative config, hidden tests)
→ JudgeService.evaluate(EvaluationRequest)
→ ML Python adapter (isolated child process)
→ generated trusted harness (seeded, limited, JSON result)
→ aggregated result (value / shape / dtype / gradient / exception / performance)
→ redacted client feedback + persisted evaluation_summary
```

Run semantics: Run evaluates visible tests with detailed diagnostics and never
affects solve state; Submit evaluates hidden tests, persists a redacted result,
and is the only path that updates solved/attempted state. The client cannot
provide expected output, resource limits, evaluator config, or final status.

## Supported frameworks

- `python` (stdlib allowlist: math, statistics, collections, itertools,
  functools, heapq, bisect)
- `numpy`
- `pytorch` (CPU only — `torch`, `torch.nn`, `torch.nn.functional`)

No CUDA dependency exists anywhere in the judge path; this is deliberate.
The import allowlist is a content policy, not a security sandbox — the security
boundary remains runner isolation (`docs/week5-ml-judge-security.md`).

## Supported checks

| Check | Mode | Notes |
| --- | --- | --- |
| Correctness (stdout) | program | Week 4 semantics unchanged |
| Value | function/class | exact / allclose / absolute / relative |
| Shape | function/class | tensor and nested-array outputs |
| Dtype | function/class | optional, configurable |
| Gradient | pytorch | forward/backward failures separated, configurable tolerance |
| Exception | function/class | expected type + optional message pattern, sanitized traces |
| Performance | all | informational CPU metadata; generous thresholds only |

## Problem count

53 published problems: the 20 Week 4 program problems plus 33 structured
function/class problems (164 structured test cases). At least 20 use
function/class mode (33) and 10 use PyTorch, satisfying the Task 34 acceptance
criteria. Distribution: Transformer/Attention, RL/GRPO/PPO, Robotics math
(quaternions, SE(3)), Diffusion/Flow Matching, Robot Learning, and Python/
Numerical. Every problem has visible examples and hidden tests.

## Collections

Six seeded, ordered, published collections: Embodied AI Top 30, Transformer
Essentials, RL Post-Training Core, Robotics Math Essentials, Diffusion
Fundamentals, and Robot Learning Utilities. `/coding/collections` and
`/coding/collections/[slug]` reuse the existing problem row rendering and show
authenticated Solved/Attempted status per problem.

## Progress features

- `/coding/progress` (server-rendered, authenticated): solved/attempted totals,
  per-topic progress, collection progress, and recent submissions. No streaks,
  no gamification.
- Progress semantics are evaluation-mode agnostic: solved = at least one
  Accepted submission, attempted = submissions but none Accepted, unsolved =
  no submissions. Accepted is server-authoritative.
- Progress query helpers return `solved / attempted / unsolved / total`
  without N+1 per problem; anonymous users get clean empty results.
- `scripts/report-coding-difficulty.ts` reports manual difficulty, acceptance
  rate, median attempts, and unique users, flags low-sample problems, and never
  mutates production difficulty.

## Verification

```bash
supabase db reset --yes
pnpm check:coding                # requires a reachable Supabase with seeds
pnpm test                        # 24/24 pass (unit + integrity logic)
PYTHON_EXECUTABLE=<numpy+torch python> pnpm test:ml-judge   # 10/10 scenarios pass
PYTHON_EXECUTABLE=<numpy+torch python> node --experimental-strip-types --loader ./scripts/tests/loader.mjs scripts/audit-ml-judge-performance.ts
pnpm lint                        # clean (script console warnings only)
pnpm typecheck                   # clean
pnpm exec next build --webpack   # passes; Turbopack panics in this sandbox
```

The ML judge smoke test covers correct function, wrong value, wrong shape,
missing entrypoint, timeout, correct gradient, and incorrect gradient
(`x.detach() * x` fails only the gradient group). The performance audit shows
case execution is sub-100 ms; wall time is dominated by interpreter + torch
import (~1.5–2 s warm), leaving ~10× headroom in the `ml_cpu_medium` budget.

Full end-to-end flows (function problem, gradient failure, robotics numerics,
collections, progress, hidden-test RLS denial, repeat-submit reproducibility)
are recorded in [`docs/week5-integration-audit.md`](./week5-integration-audit.md),
with dedicated audit notes for mobile, desktop, accessibility, collections UX,
content quality, performance, and security:
[`week5-mobile-audit.md`](./week5-mobile-audit.md),
[`week5-desktop-audit.md`](./week5-desktop-audit.md),
[`week5-accessibility-audit.md`](./week5-accessibility-audit.md),
[`week5-collection-audit.md`](./week5-collection-audit.md),
[`week5-content-audit.md`](./week5-content-audit.md),
[`week5-performance-audit.md`](./week5-performance-audit.md),
[`week5-ml-judge-security.md`](./week5-ml-judge-security.md).

Authoring and environment documentation:
[`docs/coding-problem-authoring.md`](./coding-problem-authoring.md),
[`docs/judge-environment.md`](./judge-environment.md),
[`docs/judge-reproducibility.md`](./judge-reproducibility.md).

## Security limitations

- The local ML adapter executes user code in a child process with resource
  limits (timeout, memory, stdout caps, allowlisted imports) but it is **not**
  a hard sandbox. Production must run the harness in an isolated backend
  (microVM/container provider); the adapter refuses to be the production path.
- Runner environment is deliberately minimal (`NODE_ENV`, `PATH`, `LANG`,
  `PYTHONHASHSEED=0`) so no application secrets reach the runner.
- Hidden structured tests, expected tensors, reference gradients, and
  reference solutions never leave the server. `evaluator_config` tolerances
  are maintainer data; the browser receives only derived capability hints.

## Known limitations

- Submit/run judging is synchronous in-process; a queue can move long-running
  provider work out of the request path later.
- The in-process rate limiter is single-instance only.
- Performance checks are informational; there is no timing-based pass/fail
  beyond generous optional thresholds.
- Gradient checks use the `sum(output).backward(ones_like)` convention, which
  fits scalar/vector-reducible outputs; multi-output conventions are deferred.
- The configured hosted Supabase project has not been migrated automatically;
  run `supabase db push` only after reviewing the target project.

## Deferred to Week 6

- Interview Submission + content ingestion pipeline (submit-interview form,
  LLM-assisted extraction, canonicalization, duplicate detection, review
  queue, publish workflow).
- GPU/CUDA evaluation, distributed training, leaderboards, contests, and AI
  code completion/generation remain out of scope.
