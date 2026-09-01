# RoboPrep ML judge environment

Date: 2026-09-01

Week 5 Task 21: define a reproducible CPU-only ML execution environment for
the function/class evaluator (Mode B). This document is authoritative for
problem authors: if an API is not listed here, assume it is not available in
the trusted runner.

## Reference versions

| Component | Version | Notes |
| --------- | ------- | ----- |
| Python    | 3.13.12 | CPython, 64-bit |
| PyTorch   | 2.13.0  | CPU-only build (no CUDA) |
| NumPy     | 2.5.2   | Bundled into the runner image |

The runner itself is an isolated Python subprocess (see
`docs/week5-ml-judge-security.md`); the versions above are what that
subprocess sees. The `PYTHON_EXECUTABLE` override used by local scripts must
point at an interpreter that reports the same or a compatible version set.

## CPU-only policy

- The judge never executes GPU code. `torch.cuda.is_available()` is
  `False` and CUDA device tensors are unsupported.
- All problem reference solutions and all user solutions must run on CPU.
  Do not author problems that require CUDA kernels, `torch.compile`, or
  non-deterministic GPU reductions.
- Gradient checks run on CPU through autograd; no special device handling
  is performed by the harness.

## Resource profiles

Problems select one server-owned profile by name (`resource_profile`); the
browser never chooses limits.

| Profile             | Timeout | Memory  | Intended workload                                      |
| ------------------- | ------- | ------- | ------------------------------------------------------ |
| `standard_python`   | 5 s     | 256 MB  | Pure Python program/function problems                  |
| `ml_cpu_small`      | 15 s    | 512 MB  | NumPy / small PyTorch CPU (import + tiny tensors)      |
| `ml_cpu_medium`     | 40 s    | 1 GB    | PyTorch CPU with gradient checks on small batches      |

Importing PyTorch on CPU costs roughly 1–3 s; keep `ml_cpu_small` problems
to tiny tensors so the 15 s budget comfortably covers import + evaluation.

## Supported imports

The trusted runner enforces an import allowlist per framework (this is a
policy guardrail, **not** a security sandbox — see the security doc):

| Framework | Allowlisted modules |
| --------- | ------------------- |
| `python`  | `math`, `statistics`, `collections`, `itertools`, `functools`, `heapq`, `bisect` |
| `numpy`   | the above plus `numpy` |
| `pytorch` | the above plus `numpy`, `torch`, `torch.nn`, `torch.nn.functional` |

Anything else raises a readable `forbidden_import` error. The import guard is
implemented in the harness (`install_import_guard`) and reports the first
offending module.

## Supported dtypes

Tensor specs and dtype checks support exactly:

```text
float32  float64  int64  bool
```

- NumPy inputs are rebuilt with `np.asarray(values, dtype).reshape(shape)`.
- PyTorch inputs are rebuilt via `torch.from_numpy(arr)`; `requires_grad` is
  only valid on `float32` / `float64` tensors.
- `int` inputs should use `int64`; floating inputs should use `float64` for
  pure-Python problems and `float32` for PyTorch problems (matching the
  reference solutions in the seed).

## Determinism

- Python `random`, NumPy, and PyTorch are all seeded from the test-case
  `seed` field when it is non-null (see `docs/judge-reproducibility.md`).
- No randomness is injected when a case has no seed; reference outputs are
  precomputed constants.

## Working with the local runner

```bash
# Adapter-level smoke tests (correct/incorrect cases)
pnpm test:ml-judge

# Full suite including unit tests for judge utilities
pnpm test
```

The local ML adapter (`src/lib/judge/adapters/ml-python.ts`) runs the harness
through the configured `PYTHON_EXECUTABLE` (defaults to `python3`; scripts
and tests pass the managed venv explicitly).

## Maintaining this document

When the reference environment is upgraded, update the version table above
and re-run:

```bash
pnpm test:ml-judge      # adapter behavior must not change
pnpm check:coding       # against a live database
scripts/validate-seed-problems.ts  # every seeded problem must still pass
```
