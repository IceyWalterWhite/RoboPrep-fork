# Week 5 ML judge security audit

Date: 2026-09-01

Week 5 Task 50. Review of the attack surface introduced by the structured
function/class evaluator (Mode B). The goal is to state explicitly what the
**local/dev** adapter does and does not protect against, and what production
must add.

## Execution model

```
RoboPrep server (Next.js)
  → JudgeService
  → LocalMLPythonAdapter
  → isolated Python subprocess (-I), trusted harness
  → structured JSON result (sentinel-delimited)
```

The Next.js process **never** `exec`s user source in-process: user code is
written into a generated harness script in a fresh temp directory and
executed by a spawned Python subprocess.

## Attack surface checklist

| Vector | Local adapter status | Notes |
| ------ | -------------------- | ----- |
| Filesystem access | Not sandboxed at OS level | Runs with the host user's privileges; temp dir removed after run |
| Network access | Not blocked | The runner env carries no credentials, but a hostile script could open sockets |
| Process spawning | Not blocked | `os.system` / `subprocess` are callable from user code |
| Fork bombs | Partially mitigated | `timeout` + `SIGKILL` kills the process tree root, but only after the limit |
| Memory exhaustion | Partially mitigated | `resource_profile` memory is enforced by policy, not by cgroups locally |
| Infinite loops | Mitigated | Hard wall-clock timeout per evaluation (`SIGKILL`) |
| Stdout flooding | Mitigated | Output capped at `2 × MAX_RESULT_BYTES` (1 MB) before discard |
| Environment secrets | Mitigated | Runner env is deliberately minimal (see below) |
| Arbitrary imports | Mitigated | Harness import guard; **policy only, not a sandbox** |
| Module shadowing | Mitigated | Submission loads from a private temp file never on `sys.path`; `-I` mode excludes the script dir, so a submission cannot shadow stdlib/harness modules |

## Runner environment

The subprocess is spawned with a deliberately small environment so secrets
do not reach user code:

```text
NODE_ENV            (passthrough)
PATH                (minimal)
LANG=C.UTF-8
PYTHONHASHSEED=0
```

No service-role keys, no database URLs, no provider tokens are passed. The
interpreter is launched with `-I` (isolated mode: `sys.path` excludes the
script's directory, user site, and `PYTHON*` env influence) — this mainly
guards against accidental cwd imports, **not** malicious code.

## Harness hardening

- **Import allowlist**: `install_import_guard` rejects imports outside the
  framework's allowlist with a `forbidden_import` category (policy).
- **Stdout capture**: user `print` output is captured and redirected; the
  machine-readable result is emitted on a sentinel line
  (`__ROBOPREP_RESULT__`), so user output cannot corrupt the JSON payload.
  Sentinel text inside user stdout is filtered.
- **Exception sanitization**: runtime errors surface as
  `type: message` truncated to 200 chars; stack traces stay server-side.
- **Result cap**: result JSON limited to 512 KB.
- **Temp hygiene**: the per-run temp directory is removed on close/error.

## What "not a production sandbox" means

The local adapter is a **development guardrail**. A hostile user process can
still read host files it has permissions for, open network connections, or
spawn processes until the timeout fires. Documented and accepted for local
dev only.

## Production requirements

Before any public multi-tenant launch:

1. **Container/VM isolation** (or a managed judge backend): cgroups limits
   on CPU, memory, PIDs; read-only filesystem; no network egress.
2. **Resource enforcement at the OS level**, not just by policy: the
   `resource_profile` memory limits must map to real cgroup caps.
3. **Queue + polling**: synchronous subprocess evaluation inside the request
   path should be replaced with a job queue so execution is not tied to
   request lifecycle.
4. **Secrets hygiene**: the runner image must contain no secrets at all
   (verified by image scan + env audit at deploy).
5. **Rate limiting**: keep authenticated submit limits and anonymous run
   limits in a shared (not in-process) counter.

## Verification

```bash
pnpm test:ml-judge    # exercises correct/incorrect/timeout/missing-entrypoint paths
pnpm test             # offline unit tests incl. comparator + redaction
pnpm check:coding     # authored problems pass structured integrity checks
```
