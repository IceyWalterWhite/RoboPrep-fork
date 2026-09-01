# Rollback plan (Week 8 Task 120)

| Scenario | Rollback | Time |
| --- | --- | --- |
| Bad app deploy | Hosting platform redeploy of the previous build; no DB action | minutes |
| Risky feature (judge/ingestion/submissions/trends) | Set the matching `FLAG_*` env to `off` and redeploy — UI degrades gracefully (Task 96) | minutes |
| LLM cost spike | `FLAG_LLM_INGESTION=off` (mock parser keeps the review pipeline alive) | minutes |
| Judge outage/abuse | `FLAG_CODING_JUDGE=off` | minutes |
| Bad migration | Roll forward with a fix-up migration; if destructive, restore per docs/backup-recovery.md into a fresh project and repoint env | hours |
| Accidental publish | Reject/unpublish from the review detail (audited in ingestion_events) | minutes |
| Data corruption | Backup restore drill path (docs/backup-recovery.md) | hours |

Migrations are additive-only by policy (Tasks 80, 130): no destructive column
drops ship without a rehearsal on a staging copy, so app rollbacks never
require DB rollbacks.
