-- ---------------------------------------------------------------------------
-- RoboPrep — Knowledge System schema (Week 2)
--
-- Extends canonical questions with structured answer content, adds the
-- question relation graph (follow-up / related / prerequisite / contrast) and
-- a 1:1 stats table maintained by scripts/refresh-question-stats.ts.
--
-- Semantic mapping of answer fields (no duplicated concepts):
--   summary         one-line explanation
--   short_answer    30-60 second spoken interview answer
--   canonical_answer the Week 1 detailed canonical write-up
--   deep_answer     long-form technical explanation
--   key_points / common_mistakes / interview_tips   jsonb bullet lists
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- questions: answer content + lifecycle flags
-- ---------------------------------------------------------------------------

alter table public.questions
  add column if not exists short_answer text,
  add column if not exists key_points jsonb,
  add column if not exists common_mistakes jsonb,
  add column if not exists interview_tips jsonb,
  add column if not exists estimated_minutes integer,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_published boolean not null default true,
  add column if not exists view_count bigint not null default 0;

comment on column public.questions.short_answer is 'Concise 30-60 second spoken interview answer.';
comment on column public.questions.key_points is 'JSON array of key takeaway strings.';
comment on column public.questions.common_mistakes is 'JSON array of common mistake strings.';
comment on column public.questions.interview_tips is 'JSON array of interviewer-expectation tips.';
comment on column public.questions.estimated_minutes is 'Expected reading/practice time in minutes.';

alter table public.questions
  add constraint questions_estimated_minutes_check
    check (estimated_minutes is null or estimated_minutes between 1 and 240);

-- ---------------------------------------------------------------------------
-- question_relations: the knowledge graph
-- ---------------------------------------------------------------------------

create table if not exists public.question_relations (
  id uuid primary key default gen_random_uuid(),
  source_question_id uuid not null references public.questions (id) on delete cascade,
  target_question_id uuid not null references public.questions (id) on delete cascade,
  relation_type text not null,
  weight numeric not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  constraint question_relations_type_check
    check (relation_type in ('related', 'prerequisite', 'follow_up', 'contrast')),
  constraint question_relations_no_self_reference
    check (source_question_id <> target_question_id),
  constraint question_relations_unique
    unique (source_question_id, target_question_id, relation_type)
);

create index if not exists question_relations_source_id_idx
  on public.question_relations (source_question_id);
create index if not exists question_relations_target_id_idx
  on public.question_relations (target_question_id);
create index if not exists question_relations_type_idx
  on public.question_relations (relation_type);

-- ---------------------------------------------------------------------------
-- question_stats: denormalised 1:1 metadata, refreshed by script
-- ---------------------------------------------------------------------------

create table if not exists public.question_stats (
  question_id uuid primary key references public.questions (id) on delete cascade,
  interview_count integer not null default 0,
  company_count integer not null default 0,
  occurrences_30d integer not null default 0,
  occurrences_90d integer not null default 0,
  trend_score numeric not null default 0,
  last_seen_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists question_stats_interview_count_idx
  on public.question_stats (interview_count);
create index if not exists question_stats_trend_score_idx
  on public.question_stats (trend_score);

-- ---------------------------------------------------------------------------
-- indexes on questions
-- ---------------------------------------------------------------------------

create index if not exists questions_is_published_idx on public.questions (is_published);
create index if not exists questions_is_featured_idx on public.questions (is_featured);
create index if not exists questions_difficulty_idx on public.questions (difficulty);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- Canonical questions are only public while published.
drop policy if exists "questions_public_read" on public.questions;
create policy "questions_public_read"
  on public.questions
  for select
  to anon, authenticated
  using (is_published = true);

alter table public.question_relations enable row level security;
alter table public.question_stats enable row level security;

drop policy if exists "question_relations_public_read" on public.question_relations;
create policy "question_relations_public_read"
  on public.question_relations
  for select
  to anon, authenticated
  using (true);

drop policy if exists "question_stats_public_read" on public.question_stats;
create policy "question_stats_public_read"
  on public.question_stats
  for select
  to anon, authenticated
  using (true);

-- No INSERT/UPDATE/DELETE policies: content and stats are maintained by the
-- service role (migrations + scripts/refresh-question-stats.ts) only.
