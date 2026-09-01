-- ---------------------------------------------------------------------------
-- RoboPrep — Interview System RLS (Week 3)
-- ---------------------------------------------------------------------------

alter table public.interview_rounds enable row level security;
alter table public.interview_tags enable row level security;

drop policy if exists "interview_rounds_public_read_published" on public.interview_rounds;
create policy "interview_rounds_public_read_published"
  on public.interview_rounds
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.interviews i
      where i.id = interview_rounds.interview_id
        and i.status = 'published'
    )
  );

drop policy if exists "interview_tags_public_read_published" on public.interview_tags;
create policy "interview_tags_public_read_published"
  on public.interview_tags
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.interviews i
      where i.id = interview_tags.interview_id
        and i.status = 'published'
    )
  );

-- Re-state this policy after the nullable question_id migration so unresolved
-- occurrences remain visible without weakening the parent interview check.
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

-- No public INSERT/UPDATE/DELETE policies. Interview publishing and edits stay
-- in trusted service-role/editor workflows.
