-- ---------------------------------------------------------------------------
-- RoboPrep — prepare Interview → Coding provenance (Week 4)
-- ---------------------------------------------------------------------------

alter table public.interview_questions
  add column if not exists coding_problem_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'interview_questions_coding_problem_id_fkey'
  ) then
    alter table public.interview_questions
      add constraint interview_questions_coding_problem_id_fkey
      foreign key (coding_problem_id) references public.coding_problems (id) on delete set null;
  end if;
end;
$$;

create index if not exists interview_questions_coding_problem_id_idx
  on public.interview_questions (coding_problem_id);
