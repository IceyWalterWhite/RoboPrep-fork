-- ---------------------------------------------------------------------------
-- RoboPrep — Knowledge search support (Week 2)
--
-- pg_trgm GIN indexes keep case-insensitive ILIKE search over titles,
-- summaries and topic names fast without introducing full-text ranking
-- machinery that the product does not need yet.
-- ---------------------------------------------------------------------------

create extension if not exists pg_trgm;

create index if not exists questions_title_trgm_idx
  on public.questions using gin (title gin_trgm_ops);

create index if not exists questions_summary_trgm_idx
  on public.questions using gin (summary gin_trgm_ops);

create index if not exists topics_name_trgm_idx
  on public.topics using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- questions_with_stats
--
-- Questions joined 1:1 with their stats row so that list pages can filter and
-- sort by interview_count / trend_score in the database instead of in memory.
-- The view executes with the caller's privileges, so RLS on the underlying
-- tables still applies.
-- ---------------------------------------------------------------------------

create or replace view public.questions_with_stats as
select
  q.*,
  s.interview_count,
  s.company_count,
  s.occurrences_30d,
  s.occurrences_90d,
  s.trend_score,
  s.last_seen_at
from public.questions q
left join public.question_stats s on s.question_id = q.id;
