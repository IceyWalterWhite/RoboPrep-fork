-- ---------------------------------------------------------------------------
-- RoboPrep — Coding System schema (Week 4)
-- ---------------------------------------------------------------------------

begin;

create table if not exists public.coding_problems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  difficulty text not null,
  category text,
  description text not null,
  constraints text,
  starter_code text,
  solution_code text,
  function_name text,
  language text not null default 'python',
  time_limit_ms integer not null default 3000,
  memory_limit_mb integer not null default 256,
  comparison_mode text not null default 'exact',
  tolerance numeric not null default 0.00001,
  is_published boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint coding_problems_difficulty_check check (difficulty in ('easy', 'medium', 'hard')),
  constraint coding_problems_language_check check (language = 'python'),
  constraint coding_problems_limits_check check (time_limit_ms > 0 and memory_limit_mb > 0),
  constraint coding_problems_comparison_check check (comparison_mode in ('exact', 'trimmed', 'numeric')),
  constraint coding_problems_tolerance_check check (tolerance >= 0)
);

create table if not exists public.coding_problem_topics (
  problem_id uuid not null references public.coding_problems (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  weight numeric not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (problem_id, topic_id)
);

create table if not exists public.coding_test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.coding_problems (id) on delete cascade,
  name text,
  input_data text not null default '',
  expected_output text not null default '',
  is_hidden boolean not null default true,
  weight numeric not null default 1,
  order_index integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint coding_test_cases_weight_check check (weight > 0)
);

create table if not exists public.coding_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id uuid not null references public.coding_problems (id) on delete cascade,
  language text not null default 'python',
  source_code text not null,
  status text not null default 'queued',
  score numeric,
  runtime_ms integer,
  memory_kb integer,
  judge_token text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  constraint coding_submissions_language_check check (language = 'python'),
  constraint coding_submissions_status_check check (status in ('queued', 'running', 'accepted', 'wrong_answer', 'runtime_error', 'time_limit_exceeded', 'memory_limit_exceeded', 'compile_error', 'internal_error'))
);

create table if not exists public.coding_submission_cases (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.coding_submissions (id) on delete cascade,
  test_case_id uuid references public.coding_test_cases (id) on delete set null,
  status text,
  runtime_ms integer,
  memory_kb integer,
  stdout text,
  stderr text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists coding_problems_slug_idx on public.coding_problems (slug);
create index if not exists coding_problems_difficulty_idx on public.coding_problems (difficulty);
create index if not exists coding_problems_category_idx on public.coding_problems (category);
create index if not exists coding_problems_published_idx on public.coding_problems (is_published);
create index if not exists coding_problem_topics_topic_id_idx on public.coding_problem_topics (topic_id);
create index if not exists coding_test_cases_problem_id_idx on public.coding_test_cases (problem_id, order_index);
create index if not exists coding_submissions_user_id_idx on public.coding_submissions (user_id, created_at desc);
create index if not exists coding_submissions_problem_id_idx on public.coding_submissions (problem_id, created_at desc);
create index if not exists coding_submissions_status_idx on public.coding_submissions (status);
create index if not exists coding_submissions_created_at_idx on public.coding_submissions (created_at desc);
create index if not exists coding_submission_cases_submission_id_idx on public.coding_submission_cases (submission_id);

drop trigger if exists coding_problems_set_updated_at on public.coding_problems;
create trigger coding_problems_set_updated_at
  before update on public.coding_problems
  for each row execute function public.set_updated_at();

commit;
