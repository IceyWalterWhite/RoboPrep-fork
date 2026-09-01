# Week 5 Integration Audit (Task 58)

**Status:** Complete — all automated flows pass; live-DB steps listed below

## Method

No new features were added. The four plan flows were exercised through the
real evaluator and inspected at the route level. Where a flow needs a live
Supabase instance (not reachable from this environment — see below), the
equivalent offline evidence is listed instead.

## Flow A — Function problem (edit → Run → Submit)

```text
/coding → problem → edit implementation → Run → visible checks → Submit → hidden checks
```

- **Run path** (`src/app/api/coding/run/route.ts`): structured problems call
  `runMLCases(definition, sourceCode, { visibleOnly: true })` — hidden cases
  are filtered **server-side** and never reach the evaluator (Task 49).
  Visible value/shape checks are returned with full diagnostics.
- **Submit path** (`src/app/api/coding/submit/route.ts`): calls
  `runMLCases(..., { visibleOnly: false })`, persists a redacted
  `evaluation_summary`, returns redacted per-case results.
- **Evidence (offline)**: `scripts/validate-seed-problems.ts` ran every
  authored case of all 33 problems through the real `LocalMLPythonAdapter`:
  `Problems: 33, failing: 0, failing cases: 0` (164 cases, incl. LayerNorm).
- **Live steps**: start `pnpm dev`, open `/coding/implement-layernorm`, edit,
  Run (visible example/value/shape), Submit (hidden value/shape/gradient).

## Flow B — Gradient failure (correct forward, incorrect backward)

```text
correct forward → incorrect backward → gradient group fails
```

- **Evidence**: `scripts/test-ml-judge.ts` scenario 6 (added during this
  audit) evaluates `square(x)`:
  - `x * x` → `accepted` (gradient [4,6] matches)
  - `x.detach() * x` → forward value identical (`x²`), gradient `x` instead of
    `2x` → `wrong_answer` with `gradient.passed === false`.
  Output: `ok  incorrect gradient: expected wrong_answer, got wrong_answer`.
- The runner gates `kind=gradient` cases on `gradient_check` alone
  (`sum(output).backward(ones_like)`), so a wrong backward graph can never
  slip through on forward correctness.

## Flow C — Robotics numerical task (quaternion / SE(3), hidden edges, tolerance)

- **Evidence**: `quaternion-multiply` (double 90° rotation, axis
  composition), `se3-point-transform` (90° z-rotation, translation, half-turn)
  and `compose-se3` (identity, translation, double-rotation, rotation-then-
  translation) all pass their authored edge cases through the real evaluator
  with `allclose` tolerances; hidden counts ≥ 3 each.
- Numerical semantics verified: quaternion order `(w,x,y,z)` stated in the
  description; SE(3) uses `R @ p + t` column-vector convention; GRPO uses
  population std.

## Flow D — Collection (Transformer Essentials → solve)

- **Evidence**: collections seeded (6 published, non-empty, all referenced
  problems published — Task 43 checks + offline analysis); `/coding/collections`
  and `/coding/collections/[slug]` render ordered problems with difficulty and
  Solved/Attempted status (`docs/week5-collection-audit.md`).
- Transformer Essentials collection contains 8 problems (RMSNorm, causal
  masks, KV cache, RoPE, attention, cross-attention, LayerNorm) — all accepted
  by the real evaluator.

## Automated gate summary

```text
pnpm test                  → 24/24 pass (incl. integrity-logic 6)
scripts/validate-seed-problems.ts → 33 problems, failing 0, failing cases 0
scripts/test-ml-judge.ts   → 6/6 scenarios pass (correct/wrong value/wrong shape/
                             missing entrypoint/incorrect gradient/timeout)
extract                    → 33 problems, 164 test cases, JSON parse OK 164
duplicate IDs / hidden<3 / order_index gaps → NONE
```

## Live-DB steps (require reachable Supabase with seed applied)

```bash
pnpm check:coding          # integrity against the seeded DB
# then manually walk Flows A–D in the browser at http://localhost:3001
```

Note: `pnpm check:coding` could not run against the database from this
environment (`fetch failed` — Supabase not reachable); the equivalent
offline checks above all passed.
