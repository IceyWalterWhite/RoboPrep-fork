-- ---------------------------------------------------------------------------
-- RoboPrep — Coding submission breakdown (Week 5)
--
-- Persists the aggregated per-group evaluation summary so submission history
-- can render "Correctness 5/5 · Shape 3/3 · Gradient 2/3" without rerunning
-- the judge. Group counts only — never hidden raw payloads.
-- ---------------------------------------------------------------------------

begin;

alter table public.coding_submissions
  add column if not exists evaluation_summary jsonb;

revoke all on public.coding_submissions from anon, authenticated;
grant select (
  id, user_id, problem_id, language, source_code, status, score,
  runtime_ms, memory_kb, created_at, completed_at, evaluation_summary
) on public.coding_submissions to authenticated;

commit;
