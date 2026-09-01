# Secret leakage audit (Week 8 Task 4)

Scope: repository, client bundles, logs, docs.

## Method and findings

1. **Env plumbing** — all server secrets flow through `src/lib/env.shared.ts`
   (`serverEnvSchema`, imported only behind `server-only`). No `SUPABASE_SERVICE_ROLE_KEY`,
   `JUDGE0_API_KEY`, or `INGESTION_LLM_API_KEY` access exists in client components.
   Public bundle only receives `NEXT_PUBLIC_*` values.
2. **Service-role usage** — `createAdminClient()` is used exclusively in
   server routes/actions and `"server-only"` lib modules (coding submit/judge,
   ingestion service/queries, company stats refresh, account deletion).
3. **Logs** — `src/lib/logger` scrubs metadata through `src/lib/security/redact.ts`
   (emails/phones/tokens redacted; object payloads become `[redacted]`).
   Hidden tests, raw interview text, and source code are never logged.
4. **Docs** — `.env.example` contains empty placeholders only; all README/docs
   references use env-var names, never values.
5. **Admin diagnostics** — `/admin/system` shows configuration *posture*
   (on/off/provider names), never key values.
6. **Repository scan** — `grep -rE "sk-[A-Za-z0-9]|eyJ[A-Za-z0-9_-]{20,}" .` over
   tracked files returns no hits outside node_modules.

## Policy

- Keys rotate via the provider dashboard; a leaked key is revoked, not edited.
- Error tracking payloads pass the same redaction helpers (Task 12).
- The runner (judge) environment contains no app secrets (`ml-python.ts` passes
  a minimal env).
