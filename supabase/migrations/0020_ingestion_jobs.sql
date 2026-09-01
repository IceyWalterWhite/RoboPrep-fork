-- ---------------------------------------------------------------------------
-- RoboPrep — Ingestion jobs and event log (Week 6, Tasks 6–7)
--
-- Jobs track parsing work independently of submissions; submission status is
-- never overloaded as a job log. Events are an append-only audit timeline.
-- Cost tracking (Task 73) is optional and provider-independent.
-- ---------------------------------------------------------------------------

begin;

create table if not exists public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.interview_submissions (id) on delete cascade,
  job_type text not null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  provider text,
  model text,
  parser_version text,
  prompt_version text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ingestion_jobs_type_check
    check (job_type in ('parse_interview', 'canonicalize_questions', 'classify_topics', 'duplicate_check')),
  constraint ingestion_jobs_status_check
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  constraint ingestion_jobs_attempts_check
    check (attempt_count >= 0 and max_attempts > 0)
);

create index if not exists ingestion_jobs_submission_idx
  on public.ingestion_jobs (submission_id);
create index if not exists ingestion_jobs_status_idx
  on public.ingestion_jobs (status);

create table if not exists public.ingestion_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.interview_submissions (id) on delete cascade,
  job_id uuid references public.ingestion_jobs (id) on delete set null,
  event_type text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ingestion_events_submission_created_idx
  on public.ingestion_events (submission_id, created_at);

commit;
