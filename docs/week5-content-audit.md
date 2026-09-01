# Week 5 Coding Content Quality Audit (Task 57)

**Status:** Complete — issues found and fixed
**Scope:** All 33 structured problems in `supabase/seed_week5_function_problems.sql`

## Audit method

For every problem we asked the six interview-usefulness questions from Task 57:

1. Would an Embodied AI / ML interviewer plausibly ask this?
2. Is the task implementation-focused?
3. Is the function signature clear?
4. Are mathematical conventions explicit?
5. Are hidden tests fair?
6. Is difficulty appropriate?

All content was re-checked against the seeded data extracted from the SQL
(`/tmp/seed_data_fixed.json`, 33 problems / 164 test cases).

## Content profile

| Dimension | Distribution |
| --- | --- |
| Categories | transformer 8 · rl 6 · robotics 5 · diffusion 7 · robot-learning 7 |
| Difficulty | easy 15 · medium 16 · hard 2 |
| Frameworks | python 19 · pytorch 10 · numpy 4 |
| Test types | example 33 · value 120 · gradient 10 · shape 1 |
| Test groups | basic 67 · edge 65 · numerical 17 · gradient 10 · shape 5 |
| Hidden / visible | 99 hidden · 65 visible (≥3 hidden per published problem) |

Titles and slugs are unique; no obvious duplicates. Each category maps to a
real interview topic (attention variants, RL post-training losses, SE(3)
robotics math, diffusion training targets, robot-learning utilities) with
implementation-focused prompts and explicit constraints.

## Issues found

### P0 — Duplicate test case ID (fixed)

`b2000000-…-000000000294` was used by **both** `replay-buffer` (problem 126)
and `action-chunking` (problem 127). A primary-key conflict would have made the
seed fail to apply.

**Fix:** renumbered the `action-chunking` example case to `…000316`
(`supabase/seed_week5_function_problems.sql`, Action Chunking block).

### P0 — 30 problems had fewer than 3 hidden tests (fixed)

Task 43's integrity check requires every published problem to have at least
3 hidden tests. The audit found 30 problems below the threshold (many with only
1 hidden test). The validation step `pnpm check:coding` would have failed.

**Fix:** added **48 new value-kind hidden test cases** (IDs `…317`–`…364`)
computed by running each problem's reference solution in the pinned Python
environment (Python 3.13.12 / torch 2.13.0 / numpy 2.5.2), appended as a
dedicated insert block before `commit;`:

- Pure-python problems (causal mask length 6, KV-cache multi-entry append,
  GAE decay trace + long horizon, PPO ratio extremes, KL mixed drift,
  quaternion axis composition, trajectory windows w=1/w=len, episode returns,
  temporal ensembles, action-chunk edge windows, …) — 27 cases
- PyTorch problems (RoPE identity length-6, MHA 3-token batch, cross-attention
  multiple queries, PPO both-clipped, DDPM quarter-noise clean eps,
  predict-x0 two-element, flow-matching reverse/3-D, …) — 12 cases
- NumPy problems (SE(3) translate/half-turn, double-rotation composition,
  normalization all-constant/larger batch, padding mask zero-length) — 8 cases
- Class-mode `replay-buffer` (sample from middle of buffer) — 1 case

Each new case: `test_type='value'`, `test_group ∈ {basic,edge,numerical}`,
`is_hidden=true`, `order_index` continues the per-problem sequence.

## Conventions verified

- **No ambiguous robotics conventions:** SE(3) problems state column-vector
  semantics (`R @ p + t`); quaternion problems state `(w,x,y,z)`; SLERP-free;
  the batch transform problem was verified against the reference and inputs
  kept to single-point form the reference actually supports.
- **No ambiguous RL formulas:** GAE uses λ-trace with explicit
  `delta = r + γV(s') − V(s)`; PPO uses `min(r·A, clip(r,1−ε,1+ε)·A)` with a
  negated mean (surrogate loss); GRPO uses population std.
- **No low-value filler:** every problem has a distinct interview-style
  implementation task; difficulty mix (15 easy / 16 medium / 2 hard) matches
  an interview ladder.

## Verification

```text
extract:  Problems: 33, Test cases: 164, JSON parse OK: 164
validate: Problems: 33, failing: 0, failing cases: 0   (real LocalMLPythonAdapter)
integrity: duplicate test ids: NONE | hidden<3: NONE | order_index gaps: NONE
tests:    24/24 pass (pnpm test)
```

Commands (from repo root):

```bash
cp supabase/seed_week5_function_problems.sql /tmp/seed_week5_function_problems_fixed.sql
python /tmp/extract_fixed.py
PYTHON_EXECUTABLE=<venv python> node --experimental-strip-types --loader ./scripts/tests/loader.mjs scripts/validate-seed-problems.ts
```
