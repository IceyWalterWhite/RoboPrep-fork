-- ---------------------------------------------------------------------------
-- RoboPrep — Coding System RLS and public-safe projections (Week 4)
--
-- PostgreSQL table policies are row-based, so public clients query views that
-- deliberately omit solution code and hidden test content. Direct table
-- SELECT is revoked from anonymous users to prevent column leakage.
-- ---------------------------------------------------------------------------

alter table public.coding_problems enable row level security;
alter table public.coding_problem_topics enable row level security;
alter table public.coding_test_cases enable row level security;
alter table public.coding_submissions enable row level security;
alter table public.coding_submission_cases enable row level security;

drop policy if exists "coding_problems_public_read_published" on public.coding_problems;
create policy "coding_problems_public_read_published"
  on public.coding_problems
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "coding_problem_topics_public_read_published" on public.coding_problem_topics;
create policy "coding_problem_topics_public_read_published"
  on public.coding_problem_topics
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.coding_problems p
      where p.id = coding_problem_topics.problem_id and p.is_published = true
    )
  );

drop policy if exists "coding_test_cases_public_read_visible" on public.coding_test_cases;
create policy "coding_test_cases_public_read_visible"
  on public.coding_test_cases
  for select
  to anon, authenticated
  using (
    is_hidden = false
    and exists (
      select 1 from public.coding_problems p
      where p.id = coding_test_cases.problem_id and p.is_published = true
    )
  );

drop policy if exists "coding_submissions_owner_read" on public.coding_submissions;
create policy "coding_submissions_owner_read"
  on public.coding_submissions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "coding_submission_cases_owner_read" on public.coding_submission_cases;
create policy "coding_submission_cases_owner_read"
  on public.coding_submission_cases
  for select
  to authenticated
  using (
    exists (
      select 1 from public.coding_submissions s
      where s.id = coding_submission_cases.submission_id and s.user_id = auth.uid()
    )
  );

-- No normal-client mutation policies. Trusted server routes use the service
-- role after validating auth, problem publication and source limits.

create or replace view public.coding_problem_catalog
with (security_invoker = true)
as
select
  id, title, slug, difficulty, category, description, constraints,
  starter_code, function_name, language, time_limit_ms, memory_limit_mb,
  comparison_mode, tolerance, is_published, is_featured, created_at, updated_at
from public.coding_problems
where is_published = true;

create or replace view public.coding_visible_test_cases
with (security_invoker = true)
as
select id, problem_id, name, input_data, expected_output, weight, order_index, created_at
from public.coding_test_cases
where is_hidden = false;

revoke all on public.coding_problems from anon, authenticated;
revoke all on public.coding_test_cases from anon, authenticated;
revoke all on public.coding_problem_catalog from anon, authenticated;
revoke all on public.coding_visible_test_cases from anon, authenticated;

-- `security_invoker` views still need the querying role to have SELECT on the
-- underlying columns. Grant only the columns used by the public projections;
-- solution_code and hidden test data remain outside this grant entirely.
grant select (
  id, title, slug, difficulty, category, description, constraints,
  starter_code, function_name, language, time_limit_ms, memory_limit_mb,
  comparison_mode, tolerance, is_published, is_featured, created_at, updated_at
) on public.coding_problems to anon, authenticated;
grant select (
  id, problem_id, name, input_data, expected_output, is_hidden,
  weight, order_index, created_at
) on public.coding_test_cases to anon, authenticated;

grant select on public.coding_problem_catalog to anon, authenticated;
grant select on public.coding_visible_test_cases to anon, authenticated;

-- Submission rows are owner-scoped. The provider token and internal error are
-- intentionally absent from the granted column set.
revoke all on public.coding_submissions from anon, authenticated;
grant select (
  id, user_id, problem_id, language, source_code, status, score,
  runtime_ms, memory_kb, created_at, completed_at
) on public.coding_submissions to authenticated;

revoke all on public.coding_submission_cases from anon, authenticated;
grant select (
  id, submission_id, test_case_id, status, runtime_ms, memory_kb, stdout, stderr, created_at
) on public.coding_submission_cases to authenticated;

grant select on public.coding_problem_topics to anon, authenticated;
