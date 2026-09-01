-- ---------------------------------------------------------------------------
-- RoboPrep — initial schema
--
-- Core data model:
--
--   Company -> Position -> Interview -> InterviewQuestion -> Question -> Topic
--
-- Canonical questions are stored once in `questions` and referenced by many
-- interviews through `interview_questions`. Deleting an interview never removes
-- canonical content.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'Public profile data for auth.users rows.';

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  country text,
  industry text,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- positions
-- ---------------------------------------------------------------------------

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  slug text not null,
  category text,
  location text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, slug)
);

-- ---------------------------------------------------------------------------
-- interviews
-- ---------------------------------------------------------------------------

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  position_id uuid references public.positions (id) on delete set null,
  year integer not null,
  season text,
  location text,
  interview_type text,
  source_type text,
  source_url text,
  status text not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  verified_at timestamptz,
  constraint interviews_status_check
    check (status in ('draft', 'review', 'published', 'rejected')),
  constraint interviews_year_check
    check (year between 1990 and 2100)
);

-- ---------------------------------------------------------------------------
-- questions (canonical)
-- ---------------------------------------------------------------------------

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  question_type text not null,
  difficulty text,
  summary text,
  canonical_answer text,
  deep_answer text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint questions_question_type_check
    check (question_type in ('knowledge', 'coding', 'system_design', 'research', 'behavioral')),
  constraint questions_difficulty_check
    check (difficulty is null or difficulty in ('easy', 'medium', 'hard'))
);

-- ---------------------------------------------------------------------------
-- interview_questions (join + per-interview wording)
-- ---------------------------------------------------------------------------

create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  -- RESTRICT on purpose: a canonical question shared by many interviews must not
  -- disappear because one of those interviews is removed.
  question_id uuid not null references public.questions (id) on delete restrict,
  round_number integer,
  order_index integer,
  original_wording text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (interview_id, question_id)
);

-- ---------------------------------------------------------------------------
-- topics (self-referencing hierarchy)
-- ---------------------------------------------------------------------------

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid references public.topics (id) on delete set null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- question_topics
-- ---------------------------------------------------------------------------

create table if not exists public.question_topics (
  question_id uuid not null references public.questions (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  weight numeric,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (question_id, topic_id)
);

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------

create index if not exists positions_company_id_idx on public.positions (company_id);
create index if not exists interviews_company_id_idx on public.interviews (company_id);
create index if not exists interviews_position_id_idx on public.interviews (position_id);
create index if not exists interviews_year_idx on public.interviews (year);
create index if not exists interviews_status_idx on public.interviews (status);
create index if not exists questions_question_type_idx on public.questions (question_type);
create index if not exists interview_questions_interview_id_idx on public.interview_questions (interview_id);
create index if not exists interview_questions_question_id_idx on public.interview_questions (question_id);
create index if not exists topics_slug_idx on public.topics (slug);
create index if not exists topics_parent_id_idx on public.topics (parent_id);
create index if not exists question_topics_topic_id_idx on public.question_topics (topic_id);

-- `companies.slug` and `questions.slug` are already covered by their UNIQUE
-- constraints, which create indexes automatically.

-- ---------------------------------------------------------------------------
-- updated_at triggers (mutable tables only)
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists positions_set_updated_at on public.positions;
create trigger positions_set_updated_at
  before update on public.positions
  for each row execute function public.set_updated_at();

drop trigger if exists interviews_set_updated_at on public.interviews;
create trigger interviews_set_updated_at
  before update on public.interviews
  for each row execute function public.set_updated_at();

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

drop trigger if exists topics_set_updated_at on public.topics;
create trigger topics_set_updated_at
  before update on public.topics
  for each row execute function public.set_updated_at();
