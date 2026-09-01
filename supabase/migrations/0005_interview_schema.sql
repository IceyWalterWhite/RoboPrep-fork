-- ---------------------------------------------------------------------------
-- RoboPrep — Interview System schema (Week 3)
--
-- Interview rows describe an occurrence. Canonical questions remain in
-- `questions`; `interview_questions` keeps the wording and ordering that were
-- specific to that occurrence.
-- ---------------------------------------------------------------------------

begin;

alter table public.interviews
  add column if not exists title text,
  add column if not exists slug text,
  add column if not exists round_count integer not null default 0,
  add column if not exists duration_minutes integer,
  add column if not exists experience_level text not null default 'unknown',
  add column if not exists employment_type text not null default 'unknown',
  add column if not exists application_stage text not null default 'unknown',
  add column if not exists summary text,
  add column if not exists difficulty_overall text not null default 'unknown',
  add column if not exists language text not null default 'zh-CN',
  add column if not exists is_anonymous boolean not null default true,
  add column if not exists quality_score numeric,
  add column if not exists published_at timestamptz;

create unique index if not exists interviews_slug_unique_idx
  on public.interviews (slug)
  where slug is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'interviews_round_count_check'
  ) then
    alter table public.interviews
      add constraint interviews_round_count_check check (round_count >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'interviews_duration_check'
  ) then
    alter table public.interviews
      add constraint interviews_duration_check
      check (duration_minutes is null or duration_minutes > 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'interviews_quality_score_check'
  ) then
    alter table public.interviews
      add constraint interviews_quality_score_check
      check (quality_score is null or (quality_score >= 0 and quality_score <= 100));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'interviews_experience_level_check'
  ) then
    alter table public.interviews
      add constraint interviews_experience_level_check
      check (experience_level in ('intern', 'new_grad', 'experienced', 'unknown'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'interviews_employment_type_check'
  ) then
    alter table public.interviews
      add constraint interviews_employment_type_check
      check (employment_type in ('internship', 'full_time', 'contract', 'unknown'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'interviews_application_stage_check'
  ) then
    alter table public.interviews
      add constraint interviews_application_stage_check
      check (application_stage in ('screening', 'technical', 'onsite', 'final', 'mixed', 'unknown'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'interviews_difficulty_overall_check'
  ) then
    alter table public.interviews
      add constraint interviews_difficulty_overall_check
      check (difficulty_overall in ('easy', 'medium', 'hard', 'unknown'));
  end if;
end;
$$;

create table if not exists public.interview_rounds (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  round_number integer not null,
  title text,
  round_type text not null default 'unknown',
  duration_minutes integer,
  interviewer_role text,
  summary text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint interview_rounds_number_check check (round_number > 0),
  constraint interview_rounds_duration_check
    check (duration_minutes is null or duration_minutes > 0),
  constraint interview_rounds_type_check
    check (round_type in ('recruiter', 'technical', 'coding', 'research', 'manager', 'behavioral', 'mixed', 'unknown')),
  constraint interview_rounds_unique_number unique (interview_id, round_number)
);

alter table public.interview_questions
  alter column question_id drop not null,
  add column if not exists round_id uuid,
  add column if not exists notes text,
  add column if not exists question_context text,
  add column if not exists answer_summary text,
  add column if not exists difficulty text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'interview_questions_round_id_fkey'
  ) then
    alter table public.interview_questions
      add constraint interview_questions_round_id_fkey
      foreign key (round_id) references public.interview_rounds (id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'interview_questions_difficulty_check'
  ) then
    alter table public.interview_questions
      add constraint interview_questions_difficulty_check
      check (difficulty is null or difficulty in ('easy', 'medium', 'hard', 'unknown'));
  end if;
end;
$$;

create table if not exists public.interview_tags (
  interview_id uuid not null references public.interviews (id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (interview_id, tag)
);

create index if not exists interview_rounds_interview_id_idx
  on public.interview_rounds (interview_id, round_number);
create index if not exists interview_questions_round_id_idx
  on public.interview_questions (round_id);
create index if not exists interview_questions_order_idx
  on public.interview_questions (interview_id, round_number, order_index);
create index if not exists interview_tags_tag_idx
  on public.interview_tags (tag);
create index if not exists interviews_published_at_idx
  on public.interviews (published_at desc nulls last, created_at desc);

drop trigger if exists interview_rounds_set_updated_at on public.interview_rounds;
create trigger interview_rounds_set_updated_at
  before update on public.interview_rounds
  for each row execute function public.set_updated_at();

commit;
