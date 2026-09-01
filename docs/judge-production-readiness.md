# Judge production readiness (Week 8 Tasks 58–61)

## Architecture posture

- `JudgeService` routes to a provider; production (`NODE_ENV=production`)
  hard-refuses the local subprocess adapters — Judge0-compatible remote
  isolation is required (`src/lib/judge/service.ts`).
- The ML judge child-process adapter is development-only by the same gate.
- Timeouts, memory limits, stdout caps, and resource profiles
  (`standard_python` / `ml_cpu_small` / `ml_cpu_medium`) are server-owned.

## Abuse surface (Task 59)

- Infinite loops: per-case timeout enforced by the provider contract.
- Output flood: stdout byte caps in the adapters.
- Memory: `memory_limit_mb` per problem profile.
- Network/process/filesystem: provider-isolated execution; local dev adapter
  runs `-I` (isolated mode) with a minimal env — acceptable for dev only.
- Cost guards (Task 61): per-user rate limits (run/submit), source-size caps,
  test-count bounds, provider timeout, and the `coding_judge` feature flag
  for a hard pause.

## Rate limiting in production (Task 60)

The in-process limiter (`rate-limit-core.ts`) is single-instance. Production
requirements, in order: (a) run a single app instance (current launch scale),
or (b) front the app with a shared limiter (e.g. Redis or an edge rate-limit
rule) before scaling horizontally. Documented as the first scaling task —
see `docs/technical-debt.md`.
