# Week 5 — PyTorch evaluator performance audit

Date: 2026-09-01

Week 5 Task 51. Measured with the **real** `LocalMLPythonAdapter`
(`scripts/audit-ml-judge-performance.ts`) against the pinned environment
(Python 3.13.12, torch 2.13.0 CPU-only, numpy 2.5.2). Cases are synthetic
(timing only — status is not meaningful because expected values are
placeholders).

## Environment

```text
python : 3.13.12
torch  : 2.13.0 (CPU-only)
numpy  : 2.5.2
profile: ml_cpu_small (15 s timeout / 512 MB)
```

## Cold-start overhead

| Operation | Time |
| --------- | ---- |
| `import torch` (cold, bare interpreter) | ~5.4 s |
| `import numpy` (cold) | ~0.2 s |

Torch import dominates the whole budget. Every evaluation pays it once per
subprocess.

## Representative workloads (wall clock, includes interpreter + import + harness)

| Workload | Framework | Wall time | Case exec | Verdict |
| -------- | --------- | --------- | --------- | ------- |
| LayerNorm + gradient check | pytorch | 2857 ms | 15 ms | budget fine |
| Multi-head attention 8×32×64 | pytorch | 1098 ms | 5 ms | budget fine |
| GRPO loss 16×64 | pytorch | 915 ms | 4 ms | budget fine |
| Quaternion (single) | numpy | 83 ms | 0 ms | budget fine |
| DDPM forward 4×3×32×32 | pytorch | 863 ms | 1 ms | budget fine |

Average PyTorch wall time ≈ **1.4 s** → **~10× headroom** against the 15 s
`ml_cpu_small` budget.

## Findings / bottlenecks

1. **Import-bound, not compute-bound.** The 15 s budget is nearly all spent
   on the cold `torch` import (~5.4 s). Case execution is sub-100 ms for all
   measured workloads; gradient checks add only ~10–20 ms on tiny tensors.
2. **Sequential subprocess model.** Each evaluation spawns a fresh Python
   process (no interpreter reuse), so per-request overhead is ~1–3 s for
   PyTorch problems. This is acceptable for the current interactive
   run/submit flow, but a queue should not reuse interpreters for
   isolation reasons (see security doc).
3. **Memory.** Peak RSS during the audit stayed within the 512 MB profile
   (torch CPU idle footprint is roughly 300–500 MB after import; no growth
   observed on these workloads).
4. **No GPU assumed anywhere.** All timings are CPU-only.

## Recommendations

- Keep `ml_cpu_small` at 15 s: it comfortably covers import + tiny-tensor
  evaluation with 10× headroom. No tuning needed this week.
- If PyTorch problems grow to medium batches with gradient checks, move them
  to `ml_cpu_medium` (40 s) rather than raising `ml_cpu_small`.
- Do not pre-warm interpreters for the local adapter (isolation requirement);
  pre-warming is a production-queue concern.
- No premature optimization needed: measured workloads are all at least
  10× under budget.

## Re-run

```bash
PYTHON_EXECUTABLE=/Users/oplisty/.workbuddy/binaries/python/envs/default/bin/python \
  node --experimental-strip-types --loader ./scripts/tests/loader.mjs \
  scripts/audit-ml-judge-performance.ts
```
