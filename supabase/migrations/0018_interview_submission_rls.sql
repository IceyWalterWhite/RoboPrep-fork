-- ---------------------------------------------------------------------------
-- RoboPrep — Interview submission RLS (Week 6, Task 2)
--
-- Users may create and read their own submissions. They may never read other
-- users' submissions, approve/publish, or touch parsed admin fields.
--
-- All reviewer/admin operations (parsing, review decisions, publishing) go
-- through server-authorized routes using the service-role client, which
-- bypasses RLS. Anonymous mutation is denied by default.
-- ---------------------------------------------------------------------------

begin;

alter table public.interview_submissions enable row level security;

drop policy if exists "submissions_insert_own" on public.interview_submissions;
create policy "submissions_insert_own"
  on public.interview_submissions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "submissions_select_own" on public.interview_submissions;
create policy "submissions_select_own"
  on public.interview_submissions
  for select
  to authenticated
  using (user_id = auth.uid());

-- No update/delete policies: once created, the raw record is immutable for the
-- user. Moderation flags, review notes, and status transitions are server-only.

commit;
