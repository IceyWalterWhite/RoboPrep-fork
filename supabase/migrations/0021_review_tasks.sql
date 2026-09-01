-- ---------------------------------------------------------------------------
-- RoboPrep — Review tasks, reviewer roles, publish provenance (Week 6,
-- Tasks 29, 30, 37)
--
-- review_tasks give the ingestion review queue lightweight ownership/status
-- that is separate from ingestion job status. Reviewer authorization uses a
-- single profiles.role column (user | reviewer | admin) — no RBAC framework.
-- interviews.source_submission_id preserves provenance from a published
-- interview back to its originating raw submission.
-- ---------------------------------------------------------------------------

begin;

-- --------------------------------------------------------------------------
-- profiles.role (Task 30): one simple reviewer/admin flag
-- --------------------------------------------------------------------------

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('user', 'reviewer', 'admin'));
  end if;
end;
$$;

comment on column public.profiles.role is
  'Reviewer authorization role. Checked server-side; admins/reviewers act through service-role routes only.';

-- --------------------------------------------------------------------------
-- interviews.source_submission_id (Task 37)
-- --------------------------------------------------------------------------

alter table public.interviews
  add column if not exists source_submission_id uuid references public.interview_submissions (id) on delete set null;

create index if not exists interviews_source_submission_idx
  on public.interviews (source_submission_id);

-- One published interview per submission: publish idempotency is enforced in
-- the database, so double-publishing cannot create two interviews (Task 36).
create unique index if not exists interviews_source_submission_unique_idx
  on public.interviews (source_submission_id)
  where source_submission_id is not null;

-- --------------------------------------------------------------------------
-- review_tasks (Task 29)
-- --------------------------------------------------------------------------

create table if not exists public.review_tasks (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.interview_submissions (id) on delete cascade,
  draft_id uuid references public.interview_drafts (id) on delete set null,
  status text not null default 'open',
  assigned_to uuid references auth.users (id) on delete set null,
  priority integer not null default 0,
  duplicate_score numeric,
  review_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  constraint review_tasks_status_check
    check (status in ('open', 'in_review', 'approved', 'rejected', 'blocked'))
);

create index if not exists review_tasks_status_idx
  on public.review_tasks (status);
create unique index if not exists review_tasks_submission_unique_idx
  on public.review_tasks (submission_id);

commit;
