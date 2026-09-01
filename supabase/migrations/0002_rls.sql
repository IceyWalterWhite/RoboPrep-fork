-- ---------------------------------------------------------------------------
-- RoboPrep — Row Level Security (Week 1 baseline)
--
-- Principles:
--   * Published content is readable by everyone, including anonymous visitors.
--   * Nobody but the service role can mutate content. Editors/admin flows land
--     in a later week.
--   * Profile rows are private to their owner.
--
-- Every table below is protected by RLS; tables without a SELECT policy are
-- deny-by-default.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.positions enable row level security;
alter table public.interviews enable row level security;
alter table public.questions enable row level security;
alter table public.interview_questions enable row level security;
alter table public.topics enable row level security;
alter table public.question_topics enable row level security;

-- ---------------------------------------------------------------------------
-- profiles — owner only
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Deliberately no INSERT/DELETE policy: rows are created by the trigger below
-- and removed by the cascade from auth.users.

-- ---------------------------------------------------------------------------
-- public reference data — read only
-- ---------------------------------------------------------------------------

drop policy if exists "companies_public_read" on public.companies;
create policy "companies_public_read"
  on public.companies
  for select
  to anon, authenticated
  using (true);

drop policy if exists "positions_public_read" on public.positions;
create policy "positions_public_read"
  on public.positions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "questions_public_read" on public.questions;
create policy "questions_public_read"
  on public.questions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "topics_public_read" on public.topics;
create policy "topics_public_read"
  on public.topics
  for select
  to anon, authenticated
  using (true);

drop policy if exists "question_topics_public_read" on public.question_topics;
create policy "question_topics_public_read"
  on public.question_topics
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- interviews — only published rows are public
-- ---------------------------------------------------------------------------

drop policy if exists "interviews_public_read_published" on public.interviews;
create policy "interviews_public_read_published"
  on public.interviews
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "interviews_owner_read_own" on public.interviews;
create policy "interviews_owner_read_own"
  on public.interviews
  for select
  to authenticated
  using (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- interview_questions — visible only through a published interview
--
-- The join keeps unpublished rounds hidden even when the canonical question
-- itself is public.
-- ---------------------------------------------------------------------------

drop policy if exists "interview_questions_public_read" on public.interview_questions;
create policy "interview_questions_public_read"
  on public.interview_questions
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.interviews i
      where i.id = interview_questions.interview_id
        and i.status = 'published'
    )
  );

-- ---------------------------------------------------------------------------
-- profile bootstrap — mirror new auth.users rows into public.profiles
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'username',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
