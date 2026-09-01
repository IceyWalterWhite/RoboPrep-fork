-- ---------------------------------------------------------------------------
-- RoboPrep — Interview submissions (Week 6, Task 1)
--
-- First-class raw interview submission entity. The raw text is an immutable
-- source record: parsing and review happen in separate draft tables, and
-- nothing in this table is ever overwritten with parsed content.
--
-- Submission status is a lifecycle of the *ingestion pipeline*, distinct from
-- the published `interviews.status` column.
-- ---------------------------------------------------------------------------

begin;

create table if not exists public.interview_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  submission_type text not null default 'user_text',
  raw_text text not null,
  source_url text,
  company_hint text,
  position_hint text,
  year_hint integer,
  season_hint text,
  location_hint text,
  language text not null default 'zh-CN',
  status text not null default 'submitted',
  moderation_flags jsonb not null default '[]'::jsonb,
  review_notes text,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'interview_submissions_type_check'
  ) then
    alter table public.interview_submissions
      add constraint interview_submissions_type_check
      check (submission_type in ('user_text', 'public_source', 'editorial', 'development'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'interview_submissions_status_check'
  ) then
    alter table public.interview_submissions
      add constraint interview_submissions_status_check
      check (status in ('submitted', 'processing', 'parsed', 'needs_review', 'approved', 'rejected', 'failed', 'published'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'interview_submissions_raw_text_check'
  ) then
    -- Server-side size guard (Task 53); the application enforces friendlier
    -- limits, the database enforces the pathological floor/ceiling.
    add constraint interview_submissions_raw_text_check
      check (char_length(raw_text) between 1 and 200000);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'interview_submissions_year_check'
  ) then
    alter table public.interview_submissions
      add constraint interview_submissions_year_check
      check (year_hint is null or year_hint between 1990 and 2100);
  end if;
end;
$$;

create index if not exists interview_submissions_status_idx
  on public.interview_submissions (status);
create index if not exists interview_submissions_user_idx
  on public.interview_submissions (user_id);
create index if not exists interview_submissions_created_idx
  on public.interview_submissions (created_at desc);

comment on table public.interview_submissions is
  'Raw interview experiences awaiting ingestion. Raw text is immutable; parsed content lives in interview_drafts.';

commit;
