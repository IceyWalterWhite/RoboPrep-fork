-- ---------------------------------------------------------------------------
-- RoboPrep — Week 8 production hardening schema
--
-- 1. Onboarding fields on profiles (Tasks 38–39): minimal, no CRM.
-- 2. company_aliases (Task 114): the single alias source shared by global
--    search and ingestion company matching (Week 6 code constant remains as
--    a fallback; the table is authoritative when populated).
-- 3. content_reports (Task 94): structured report reasons, reporter private.
-- 4. user_feedback (Task 116): lightweight feedback form storage.
-- ---------------------------------------------------------------------------

begin;

-- 1. Onboarding (Tasks 38, 39)
alter table public.profiles
  add column if not exists target_role_category text,
  add column if not exists primary_focus text,
  add column if not exists onboarding_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_target_role_category_check'
  ) then
    alter table public.profiles
      add constraint profiles_target_role_category_check
      check (target_role_category in ('research', 'engineering', 'mixed', 'unsure'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_primary_focus_check'
  ) then
    alter table public.profiles
      add constraint profiles_primary_focus_check
      check (primary_focus in ('knowledge', 'coding', 'both'));
  end if;
end;
$$;

-- 2. Company aliases (Task 114) — one alias source for search + ingestion.
create table if not exists public.company_aliases (
  alias text primary key,
  company_id uuid not null references public.companies (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists company_aliases_company_idx
  on public.company_aliases (company_id);

alter table public.company_aliases enable row level security;
create policy "company_aliases_public_read"
  on public.company_aliases
  for select
  to anon, authenticated
  using (true);

-- 3. Content reports (Task 94). Reporter identity is private (owner-only
-- select); moderators act through the service role.
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  constraint content_reports_entity_type_check
    check (entity_type in ('interview', 'question', 'coding_problem', 'company', 'other')),
  constraint content_reports_reason_check
    check (reason in ('inaccuracy', 'privacy', 'duplicate', 'inappropriate', 'other')),
  constraint content_reports_status_check
    check (status in ('open', 'resolved', 'dismissed'))
);

create index if not exists content_reports_status_idx
  on public.content_reports (status);

alter table public.content_reports enable row level security;
create policy "content_reports_insert_own"
  on public.content_reports
  for insert
  to authenticated
  with check (user_id = auth.uid());
create policy "content_reports_select_own"
  on public.content_reports
  for select
  to authenticated
  using (user_id = auth.uid());

-- 4. User feedback (Task 116). Auth optional; rate limited server-side.
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  category text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_feedback_category_check
    check (category in ('bug', 'content_error', 'feature', 'other')),
  constraint user_feedback_message_check
    check (char_length(message) between 10 and 5000)
);

alter table public.user_feedback enable row level security;
create policy "user_feedback_insert_own"
  on public.user_feedback
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- No public read on feedback or reports: review happens server-side.

commit;
