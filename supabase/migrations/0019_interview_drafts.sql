-- ---------------------------------------------------------------------------
-- RoboPrep — Interview draft schema (Week 6, Tasks 3–5)
--
-- Machine-extracted structured drafts are stored separately from canonical
-- published data. No `interviews` row exists until review/publish.
--
--   interview_drafts            one active parsed draft per submission
--   interview_round_drafts      extracted rounds (deterministic ordering)
--   interview_question_drafts   extracted occurrences with optional canonical
--                               matches, topic suggestions, review state
-- ---------------------------------------------------------------------------

begin;

-- --------------------------------------------------------------------------
-- interview_drafts (Task 3)
-- --------------------------------------------------------------------------

create table if not exists public.interview_drafts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.interview_submissions (id) on delete cascade,
  company_name text,
  position_title text,
  year integer,
  season text,
  location text,
  employment_type text not null default 'unknown',
  experience_level text not null default 'unknown',
  summary text,
  confidence numeric not null default 0,
  parser_version text not null default 'v0',
  prompt_version text,
  model text,
  provider text,
  interview_type text not null default 'unknown',
  status text not null default 'parsed',
  published_interview_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint interview_drafts_status_check
    check (status in ('parsed', 'approved', 'rejected', 'published', 'archived')),
  constraint interview_drafts_year_check
    check (year is null or year between 1990 and 2100),
  constraint interview_drafts_employment_check
    check (employment_type in ('internship', 'full_time', 'contract', 'unknown')),
  constraint interview_drafts_experience_check
    check (experience_level in ('intern', 'new_grad', 'experienced', 'unknown')),
  constraint interview_drafts_confidence_check
    check (confidence between 0 and 1)
);

create index if not exists interview_drafts_status_idx
  on public.interview_drafts (status);

-- --------------------------------------------------------------------------
-- interview_round_drafts (Task 4)
-- --------------------------------------------------------------------------

create table if not exists public.interview_round_drafts (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.interview_drafts (id) on delete cascade,
  round_number integer,
  title text,
  round_type text not null default 'unknown',
  duration_minutes integer,
  interviewer_role text,
  summary text,
  confidence numeric not null default 0,
  order_index integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint interview_round_drafts_type_check
    check (round_type in ('recruiter', 'technical', 'coding', 'research', 'manager', 'behavioral', 'mixed', 'unknown')),
  constraint interview_round_drafts_duration_check
    check (duration_minutes is null or duration_minutes > 0),
  constraint interview_round_drafts_confidence_check
    check (confidence between 0 and 1),
  constraint interview_round_drafts_unique_order unique (draft_id, order_index)
);

-- --------------------------------------------------------------------------
-- interview_question_drafts (Task 5)
-- --------------------------------------------------------------------------

create table if not exists public.interview_question_drafts (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.interview_drafts (id) on delete cascade,
  round_draft_id uuid references public.interview_round_drafts (id) on delete set null,
  original_wording text not null,
  normalized_text text,
  question_type text,
  difficulty text,
  candidate_question_id uuid references public.questions (id) on delete set null,
  candidate_coding_problem_id uuid references public.coding_problems (id) on delete set null,
  match_confidence numeric,
  match_score numeric,
  topic_suggestions jsonb not null default '[]'::jsonb,
  new_canonical jsonb,
  order_index integer not null,
  review_status text not null default 'pending',
  review_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint interview_question_drafts_question_type_check
    check (question_type is null or question_type in ('knowledge', 'coding', 'system_design', 'research', 'behavioral')),
  constraint interview_question_drafts_difficulty_check
    check (difficulty is null or difficulty in ('easy', 'medium', 'hard', 'unknown')),
  constraint interview_question_drafts_confidence_check
    check (match_confidence is null or match_confidence between 0 and 1),
  constraint interview_question_drafts_review_status_check
    check (review_status in ('pending', 'accepted', 'edited', 'rejected', 'new_canonical')),
  constraint interview_question_drafts_unique_order unique (draft_id, order_index)
);

create index if not exists interview_question_drafts_review_status_idx
  on public.interview_question_drafts (review_status);
create index if not exists interview_question_drafts_candidate_idx
  on public.interview_question_drafts (candidate_question_id);

commit;
