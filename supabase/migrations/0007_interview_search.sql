-- ---------------------------------------------------------------------------
-- RoboPrep — Interview search indexes (Week 3)
-- ---------------------------------------------------------------------------

create extension if not exists pg_trgm;

create index if not exists interviews_title_trgm_idx
  on public.interviews using gin (title gin_trgm_ops);
create index if not exists interviews_summary_trgm_idx
  on public.interviews using gin (summary gin_trgm_ops);
create index if not exists interviews_source_url_trgm_idx
  on public.interviews using gin (source_url gin_trgm_ops);
create index if not exists interview_questions_wording_trgm_idx
  on public.interview_questions using gin (original_wording gin_trgm_ops);
create index if not exists interview_rounds_summary_trgm_idx
  on public.interview_rounds using gin (summary gin_trgm_ops);
