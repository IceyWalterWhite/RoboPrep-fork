# RoboPrep judge reproducibility

Date: 2026-09-01

Week 5 Task 40: document and enforce deterministic evaluation. The same
submission must produce the same pass/fail outcome on every run.

## What is deterministic

- **Fixed inputs.** Structured test cases carry literal values in
  `input_json`; they are not sampled at judge time. A case may declare a
  `seed` only when the authored solution itself needs randomness (e.g. a
  sampler), and that seed is fixed and stored in the case definition.
- **Fixed expected values.** `expected_json` holds precomputed constants
  (or, for gradients, precomputed reference gradients). The judge never
  recomputes "ground truth" at evaluation time.
- **Fixed seeds.** When a case has a non-null `seed`, the harness seeds all
  three RNGs before the user call:

```python
random.seed(seed)
numpy.random.seed(seed % (2**32))
torch.manual_seed(seed)
```

- **CPU-only execution.** No GPU nondeterminism (see
  `docs/judge-environment.md`).

## Comparison semantics

All comparisons use the allclose rule unless a problem declares otherwise:

```text
|actual - expected| <= atol + rtol * |expected|
```

- Defaults: `rtol = 1e-5`, `atol = 1e-6`; PyTorch problems default to
  `rtol = 1e-4`, `atol = 1e-5`.
- **NaN is never acceptable**; non-finite values only match if they are
  identical (`Inf == Inf`, `-Inf == -Inf`).
- Element counts must match; a mismatch fails before any value is compared.
- Error magnitude (`max_abs_error`) is reported over finite element pairs so
  the result payload stays JSON-safe.

## Gradient reproducibility

- Backward runs from `sum(output)` with `ones_like` gradient seeds
  (`forward_output.backward(torch.ones_like(forward_output))`).
- Reference gradients in `expected_json` **must be authored under the same
  convention**: compute them with the reference solution, run the same
  `sum().backward()`, and round to 6 significant decimals.
- Only inputs declared `"requires_grad": true` in the case payload become
  gradient handles (labels `arg0`, `arg1`, … for positional args, the
  keyword name for kwargs, or `param:<name>` for class parameters).
- Gradient tolerance reuses the problem's `rtol`/`atol` (allclose).

## What problem authors must guarantee

1. Reference outputs are computed on the exact reference environment
   (Python 3.13.12 / torch 2.13.0 / numpy 2.5.2, CPU) — floating-point
   results can differ across torch versions.
2. Any randomized case sets an explicit `seed` and produces identical
   outputs across runs; verify by running the case twice.
3. Do not rely on iteration order of sets/dicts, hash randomization
   (`PYTHONHASHSEED`) for ordering, or GPU reductions.
4. Timeouts are generous (`ml_cpu_small` 15 s, `ml_cpu_medium` 40 s) so
   timing noise never flips a pass/fail. Performance cases are informational
   in Week 5 and never fail a submission.

## Verification commands

```bash
pnpm test:ml-judge              # adapter smoke tests (correct / wrong shape /
                                # wrong gradient / timeout / missing entrypoint)
pnpm test                       # offline unit tests incl. comparator & redaction
scripts/validate-seed-problems.ts   # every seeded solution_code must pass
```

## Known limitations

- PyTorch CPU reductions (e.g. `mean` over large tensors) are deterministic
  per version but can differ across versions; authored expected values must
  come from the pinned environment.
- The local adapter runs on the host OS scheduler; wall-clock timing varies
  run to run, which is why performance is informational only.
