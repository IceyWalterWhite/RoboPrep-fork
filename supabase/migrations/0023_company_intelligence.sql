-- ---------------------------------------------------------------------------
-- RoboPrep — Company Intelligence cache schema (Week 7, Tasks 2–9)
--
-- Eight rebuildable cache tables accelerating company/role pages. The source
-- of truth remains the published interview graph (interviews, rounds,
-- interview_questions, questions, coding_problems, topics); these caches are
-- recomputed by refresh_company_stats() and never carry independent truth.
--
-- All counts derive from interviews with status = 'published' only
-- (Week 7 Task 63: published + reviewed content counts).
--
-- Season normalization: lowercase, 'fall' folded into 'autumn'; interviews
-- missing year or season are excluded from company_season_stats.
-- Trend score (Task 35): recent_rate − historical_rate, both normalized by
-- published interview volume:
--   recent_rate     = occurrences_90d / max(interviews_90d, 1)
--   historical_rate = (occurrences − occurrences_90d)
--                     / max(interviews − interviews_90d, 1)
-- ---------------------------------------------------------------------------

begin;

-- Task 2: company-level summary cache.
create table if not exists public.company_stats (
  company_id uuid primary key references public.companies (id) on delete cascade,
  published_interview_count integer not null default 0,
  position_count integer not null default 0,
  knowledge_question_occurrence_count integer not null default 0,
  coding_question_occurrence_count integer not null default 0,
  unique_knowledge_question_count integer not null default 0,
  unique_coding_problem_count integer not null default 0,
  latest_interview_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

-- Task 3: per-role counts. Positions must belong to the company (FK cascade).
create table if not exists public.company_position_stats (
  company_id uuid not null references public.companies (id) on delete cascade,
  position_id uuid not null references public.positions (id) on delete cascade,
  interview_count integer not null default 0,
  knowledge_occurrences integer not null default 0,
  coding_occurrences integer not null default 0,
  latest_interview_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (company_id, position_id)
);

-- Task 4: topic frequency. share_of_interviews denominator = the company's
-- published_interview_count (documented in docs/company-metrics.md).
create table if not exists public.company_topic_stats (
  company_id uuid not null references public.companies (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  occurrence_count integer not null default 0,
  interview_count integer not null default 0,
  position_count integer not null default 0,
  share_of_interviews numeric not null default 0,
  trend_score numeric not null default 0,
  last_seen_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (company_id, topic_id)
);

-- Task 5: canonical knowledge question frequency per company. The same
-- canonical question asked twice in one interview counts as two occurrences
-- but one interview; interview_count is the distinct-interview figure.
create table if not exists public.company_question_stats (
  company_id uuid not null references public.companies (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  occurrence_count integer not null default 0,
  interview_count integer not null default 0,
  position_count integer not null default 0,
  occurrences_30d integer not null default 0,
  occurrences_90d integer not null default 0,
  trend_score numeric not null default 0,
  last_seen_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (company_id, question_id)
);

-- Task 6: canonical coding problem frequency (linked occurrences only;
-- unlinked raw coding questions count in aggregate coding emphasis but not
-- in this canonical ranking).
create table if not exists public.company_coding_problem_stats (
  company_id uuid not null references public.companies (id) on delete cascade,
  coding_problem_id uuid not null references public.coding_problems (id) on delete cascade,
  occurrence_count integer not null default 0,
  interview_count integer not null default 0,
  position_count integer not null default 0,
  trend_score numeric not null default 0,
  last_seen_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (company_id, coding_problem_id)
);

-- Task 7: year/season comparison.
create table if not exists public.company_season_stats (
  company_id uuid not null references public.companies (id) on delete cascade,
  year integer not null,
  season text not null,
  interview_count integer not null default 0,
  question_occurrence_count integer not null default 0,
  knowledge_occurrence_count integer not null default 0,
  coding_occurrence_count integer not null default 0,
  coding_share numeric not null default 0,
  avg_round_count numeric,
  avg_question_count numeric,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (company_id, year, season)
);

-- Task 8: difficulty distribution. average_score maps easy=1, medium=2,
-- hard=3; unknown interviews are excluded from the average; sample_size is
-- the number of published interviews with a known difficulty.
create table if not exists public.company_difficulty_stats (
  company_id uuid primary key references public.companies (id) on delete cascade,
  easy_count integer not null default 0,
  medium_count integer not null default 0,
  hard_count integer not null default 0,
  unknown_count integer not null default 0,
  average_score numeric,
  sample_size integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

-- Task 9: interview structure. share denominator = the company's total
-- published rounds.
create table if not exists public.company_round_type_stats (
  company_id uuid not null references public.companies (id) on delete cascade,
  round_type text not null,
  round_count integer not null default 0,
  interview_count integer not null default 0,
  share numeric not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (company_id, round_type),
  constraint company_round_type_stats_type_check
    check (round_type in ('recruiter', 'technical', 'coding', 'research', 'manager', 'behavioral', 'mixed', 'unknown'))
);

create index if not exists company_topic_stats_share_idx
  on public.company_topic_stats (company_id, share_of_interviews desc);
create index if not exists company_question_stats_interview_idx
  on public.company_question_stats (company_id, interview_count desc);
create index if not exists company_coding_stats_interview_idx
  on public.company_coding_problem_stats (company_id, interview_count desc);

-- --------------------------------------------------------------------------
-- Refresh service (Tasks 12, 13)
-- --------------------------------------------------------------------------

create or replace function public.refresh_company_stats(
  p_company_id uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_ids uuid[];
begin
  if p_company_id is not null then
    v_company_ids := array[p_company_id];
  else
    select coalesce(array_agg(id), '{}') into v_company_ids from companies;
  end if;

  -- Replace (not merge) rows for the target companies so re-running produces
  -- exactly the recomputed set (idempotency, Task 12).
  delete from company_stats where company_id = any(v_company_ids);
  delete from company_position_stats where company_id = any(v_company_ids);
  delete from company_topic_stats where company_id = any(v_company_ids);
  delete from company_question_stats where company_id = any(v_company_ids);
  delete from company_coding_problem_stats where company_id = any(v_company_ids);
  delete from company_season_stats where company_id = any(v_company_ids);
  delete from company_difficulty_stats where company_id = any(v_company_ids);
  delete from company_round_type_stats where company_id = any(v_company_ids);

  with base as (
    select i.id, i.company_id, i.position_id, i.year, i.season,
           i.difficulty_overall, i.published_at,
           case when lower(i.season) = 'fall' then 'autumn' else lower(i.season) end as season_norm
    from interviews i
    where i.company_id = any(v_company_ids) and i.status = 'published'
  )
  -- Task 2: company summary.
  insert into company_stats (
    company_id, published_interview_count, position_count,
    knowledge_question_occurrence_count, coding_question_occurrence_count,
    unique_knowledge_question_count, unique_coding_problem_count,
    latest_interview_at, updated_at
  )
  select
    c.id,
    (select count(*) from base b where b.company_id = c.id),
    (select count(*) from positions p where p.company_id = c.id),
    (select count(*) from interview_questions iq join base b on b.id = iq.interview_id
      where b.company_id = c.id and iq.question_id is not null),
    (select count(*) from interview_questions iq join base b on b.id = iq.interview_id
      where b.company_id = c.id and iq.coding_problem_id is not null),
    (select count(distinct iq.question_id) from interview_questions iq join base b on b.id = iq.interview_id
      where b.company_id = c.id and iq.question_id is not null),
    (select count(distinct iq.coding_problem_id) from interview_questions iq join base b on b.id = iq.interview_id
      where b.company_id = c.id and iq.coding_problem_id is not null),
    (select max(b.published_at) from base b where b.company_id = c.id),
    now()
  from companies c
  where c.id = any(v_company_ids);

  -- Task 3: role counts.
  insert into company_position_stats (
    company_id, position_id, interview_count,
    knowledge_occurrences, coding_occurrences, latest_interview_at, updated_at
  )
  select
    b.company_id, b.position_id,
    count(distinct b.id),
    (select count(*) from interview_questions iq join base b2 on b2.id = iq.interview_id
      where b2.company_id = b.company_id and b2.position_id is not distinct from b.position_id
        and iq.question_id is not null),
    (select count(*) from interview_questions iq join base b2 on b2.id = iq.interview_id
      where b2.company_id = b.company_id and b2.position_id is not distinct from b.position_id
        and iq.coding_problem_id is not null),
    max(b.published_at), now()
  from base b
  where b.position_id is not null
  group by b.company_id, b.position_id;

  -- Task 4: topic frequency (via canonical questions linked to occurrences).
  insert into company_topic_stats (
    company_id, topic_id, occurrence_count, interview_count, position_count,
    share_of_interviews, trend_score, last_seen_at, updated_at
  )
  select
    gr.company_id, gr.topic_id,
    gr.occurrences, gr.interviews, gr.positions,
    round(gr.interviews::numeric / nullif(cs.published_interview_count, 0), 4),
    round(
      (gr.occurrences_90d::numeric / greatest(gr.interviews_90d, 1))
      - ((gr.occurrences - gr.occurrences_90d)::numeric / greatest(gr.interviews - gr.interviews_90d, 1)),
      4),
    gr.last_seen_at, now()
  from (
    select
      b.company_id, qt.topic_id,
      count(*) as occurrences,
      count(distinct b.id) as interviews,
      count(distinct b.position_id) as positions,
      count(*) filter (where b.published_at >= now() - interval '90 days') as occurrences_90d,
      count(distinct b.id) filter (where b.published_at >= now() - interval '90 days') as interviews_90d,
      max(b.published_at) as last_seen_at
    from base b
    join interview_questions iq on iq.interview_id = b.id and iq.question_id is not null
    join question_topics qt on qt.question_id = iq.question_id
    group by b.company_id, qt.topic_id
  ) gr
  join company_stats cs on cs.company_id = gr.company_id;

  -- Task 5: canonical knowledge question frequency.
  insert into company_question_stats (
    company_id, question_id, occurrence_count, interview_count, position_count,
    occurrences_30d, occurrences_90d, trend_score, last_seen_at, updated_at
  )
  select
    gr.company_id, gr.question_id,
    gr.occurrences, gr.interviews, gr.positions,
    gr.occurrences_30d, gr.occurrences_90d,
    round(
      (gr.occurrences_90d::numeric / greatest(gr.interviews_90d, 1))
      - ((gr.occurrences - gr.occurrences_90d)::numeric / greatest(gr.interviews - gr.interviews_90d, 1)),
      4),
    gr.last_seen_at, now()
  from (
    select
      b.company_id, iq.question_id,
      count(*) as occurrences,
      count(distinct b.id) as interviews,
      count(distinct b.position_id) as positions,
      count(*) filter (where b.published_at >= now() - interval '30 days') as occurrences_30d,
      count(*) filter (where b.published_at >= now() - interval '90 days') as occurrences_90d,
      max(b.published_at) as last_seen_at
    from base b
    join interview_questions iq on iq.interview_id = b.id and iq.question_id is not null
    group by b.company_id, iq.question_id
  ) gr;

  -- Task 6: canonical coding problem frequency.
  insert into company_coding_problem_stats (
    company_id, coding_problem_id, occurrence_count, interview_count,
    position_count, trend_score, last_seen_at, updated_at
  )
  select
    gr.company_id, gr.coding_problem_id,
    gr.occurrences, gr.interviews, gr.positions,
    round(
      (gr.occurrences_90d::numeric / greatest(gr.interviews_90d, 1))
      - ((gr.occurrences - gr.occurrences_90d)::numeric / greatest(gr.interviews - gr.interviews_90d, 1)),
      4),
    gr.last_seen_at, now()
  from (
    select
      b.company_id, iq.coding_problem_id,
      count(*) as occurrences,
      count(distinct b.id) as interviews,
      count(distinct b.position_id) as positions,
      count(*) filter (where b.published_at >= now() - interval '90 days') as occurrences_90d,
      count(distinct b.id) filter (where b.published_at >= now() - interval '90 days') as interviews_90d,
      max(b.published_at) as last_seen_at
    from base b
    join interview_questions iq on iq.interview_id = b.id and iq.coding_problem_id is not null
    group by b.company_id, iq.coding_problem_id
  ) gr;

  -- Task 7: season comparison (normalized season; missing year/season excluded).
  insert into company_season_stats (
    company_id, year, season, interview_count, question_occurrence_count,
    knowledge_occurrence_count, coding_occurrence_count, coding_share,
    avg_round_count, avg_question_count, updated_at
  )
  select
    b.company_id, b.year, b.season_norm,
    count(distinct b.id),
    count(iq),
    count(iq) filter (where iq.question_id is not null),
    count(iq) filter (where iq.coding_problem_id is not null),
    round((count(iq) filter (where iq.coding_problem_id is not null))::numeric / nullif(count(iq), 0), 4),
    round(avg(sr.round_count)::numeric, 2),
    round(avg(sr.question_count)::numeric, 2),
    now()
  from base b
  left join interview_questions iq on iq.interview_id = b.id
  left join lateral (
    select
      (select count(*) from interview_rounds ir where ir.interview_id = b.id) as round_count,
      (select count(*) from interview_questions iq2 where iq2.interview_id = b.id) as question_count
  ) sr on true
  where b.year is not null and b.season is not null
  group by b.company_id, b.year, b.season_norm;

  -- Task 8: difficulty distribution.
  insert into company_difficulty_stats (
    company_id, easy_count, medium_count, hard_count, unknown_count,
    average_score, sample_size, updated_at
  )
  select
    b.company_id,
    count(*) filter (where b.difficulty_overall = 'easy'),
    count(*) filter (where b.difficulty_overall = 'medium'),
    count(*) filter (where b.difficulty_overall = 'hard'),
    count(*) filter (where b.difficulty_overall = 'unknown'),
    round(avg(
      case b.difficulty_overall
        when 'easy' then 1
        when 'medium' then 2
        when 'hard' then 3
      end)::numeric, 2),
    count(*) filter (where b.difficulty_overall in ('easy', 'medium', 'hard')),
    now()
  from base b
  group by b.company_id;

  -- Task 9: round-type distribution.
  insert into company_round_type_stats (
    company_id, round_type, round_count, interview_count, share, updated_at
  )
  select
    gr.company_id, gr.round_type,
    gr.rounds, gr.interviews,
    round(gr.rounds::numeric / nullif(gr.total_rounds, 0), 4),
    now()
  from (
    select
      b.company_id, ir.round_type,
      count(*) as rounds,
      count(distinct b.id) as interviews,
      sum(count(*)) over (partition by b.company_id) as total_rounds
    from base b
    join interview_rounds ir on ir.interview_id = b.id
    group by b.company_id, ir.round_type
  ) gr;

  return;
end;
$$;

revoke all on function public.refresh_company_stats(uuid) from public, anon, authenticated;

-- Week 6 publish hook (Task 13): publishing an interview refreshes that
-- company's cache incrementally.
create or replace function public.refresh_company_stats_after_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_company_stats(new.company_id);
  return null;
end;
$$;

drop trigger if exists company_stats_refresh_trigger on public.interviews;
create trigger company_stats_refresh_trigger
  after insert or update of status on public.interviews
  for each row
  execute function public.refresh_company_stats_after_publish();

-- Caches are server-derived aggregates; readable by everyone, writable by
-- the refresh function (security definer) only.
alter table public.company_stats enable row level security;
alter table public.company_position_stats enable row level security;
alter table public.company_topic_stats enable row level security;
alter table public.company_question_stats enable row level security;
alter table public.company_coding_problem_stats enable row level security;
alter table public.company_season_stats enable row level security;
alter table public.company_difficulty_stats enable row level security;
alter table public.company_round_type_stats enable row level security;

create policy "company_stats_public_read" on public.company_stats for select to anon, authenticated using (true);
create policy "company_position_stats_public_read" on public.company_position_stats for select to anon, authenticated using (true);
create policy "company_topic_stats_public_read" on public.company_topic_stats for select to anon, authenticated using (true);
create policy "company_question_stats_public_read" on public.company_question_stats for select to anon, authenticated using (true);
create policy "company_coding_stats_public_read" on public.company_coding_problem_stats for select to anon, authenticated using (true);
create policy "company_season_stats_public_read" on public.company_season_stats for select to anon, authenticated using (true);
create policy "company_difficulty_stats_public_read" on public.company_difficulty_stats for select to anon, authenticated using (true);
create policy "company_round_type_stats_public_read" on public.company_round_type_stats for select to anon, authenticated using (true);

commit;
