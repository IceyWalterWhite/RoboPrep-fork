# Backup & recovery (Week 8 Tasks 76–78)

## Policy

| Data | Backup | Frequency | Retention | Owner |
| --- | --- | --- | --- | --- |
| Supabase PostgreSQL (content graph, submissions, ingestion) | Supabase automated backups + point-in-time recovery | Daily snapshot, PITR window per plan (7d minimum) | 30 days | Maintainer (Supabase dashboard) |
| Auth users | Supabase auth schema (included in backups) | Daily | 30 days | Maintainer |
| Storage (avatars/logos, if enabled) | Supabase storage bucket replication | On change | — | Maintainer |
| Repository/config | Git remote + env var vault | On change | — | Maintainer |

## Restore path (Task 77/78 — ops checklist)

1. Create a throwaway Supabase project (never restore over production).
2. Restore the latest snapshot (or PITR timestamp) into it.
3. Verify: row counts for `interviews` (published), `questions`,
   `coding_problems`, `coding_submissions`, `ingestion_events`;
   `select count(*) from company_stats` freshness; RLS still enabled
   (`select relname, relrowsecurity from pg_class where relname like 'interview_%'`).
4. Point a staging app deployment at the restored project; run
   `pnpm check:coding && pnpm check:ingestion && pnpm check:companies`.
5. If production is lost: update prod env vars to the restored project, run
   `pnpm refresh:companies`, run `scripts/production-smoke-test.ts`.

A restore drill must be executed against a non-production project before
launch (recorded in the launch checklist); the drill is not automatable from
this repository.
