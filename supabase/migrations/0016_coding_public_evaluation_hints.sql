-- ---------------------------------------------------------------------------
-- RoboPrep — Public evaluation hints (Week 5; fixed in Week 8)
--
-- Task 19 wants the problem page to show *how* a problem is evaluated
-- (correctness / shape / dtype / gradient) before the user starts coding,
-- while Task 2 requires that raw `evaluator_config` jsonb stays server-side
-- (the browser must never treat it as trusted evaluator instructions, and
-- tolerances are maintainer data, not user data).
--
-- Solution: the security-invoker catalog view calls a security-definer
-- function *by problem id*. The function reads `evaluator_config` with owner
-- rights internally and returns only the derived capability labels.
--
-- Week 8 fix: the previous version passed `evaluator_config` as a view
-- argument, which under `security_invoker` requires the caller to hold SELECT
-- on that column — either leaking the config or breaking anonymous reads
-- (42501). The definer-by-id shape keeps the column ungranted.
-- ---------------------------------------------------------------------------

begin;

-- Internal helper: derive hints from the config (definer so it can be called
-- with an already-fetched config only by the owner-side view below).
create or replace function public.coding_problem_public_checks(
  evaluation_mode text,
  config jsonb
) returns text[]
language sql
security definer
set search_path = public, pg_temp
immutable
as $$
  select case
    when evaluation_mode = 'program' then array['correctness']::text[]
    else array_remove(
      array[
        'correctness'::text,
        case when coalesce((config ->> 'check_shape')::boolean, true) then 'shape' end,
        case when coalesce((config ->> 'check_dtype')::boolean, true) then 'dtype' end,
        case when coalesce((config ->> 'check_gradient')::boolean, false) then 'gradient' end
      ],
      null
    )
  end;
$$;

comment on function public.coding_problem_public_checks(text, jsonb) is
  'Derives public capability hints from a problem evaluator_config. Returns capability labels only; the raw config never leaves the server.';

revoke all on function public.coding_problem_public_checks(text, jsonb) from public;

-- Public entry point: resolve hints by problem id. SECURITY DEFINER means the
-- caller never needs (and never gets) SELECT on evaluator_config.
create or replace function public.coding_problem_public_checks_for(
  problem_id uuid
) returns text[]
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select public.coding_problem_public_checks(
    evaluation_mode,
    evaluator_config
  )
  from public.coding_problems
  where id = problem_id and is_published = true;
$$;

revoke all on function public.coding_problem_public_checks_for(uuid) from public;
grant execute on function public.coding_problem_public_checks_for(uuid) to anon, authenticated;

-- Refresh the public projection with the derived hints column. The view now
-- references only granted columns; the config is read inside the definer.
create or replace view public.coding_problem_catalog
with (security_invoker = true)
as
select
  id, title, slug, difficulty, category, description, constraints,
  starter_code, function_name, language, time_limit_ms, memory_limit_mb,
  comparison_mode, tolerance, is_published, is_featured, created_at, updated_at,
  evaluation_mode, entrypoint_type, entrypoint_name, framework, resource_profile,
  public.coding_problem_public_checks_for(id) as public_checks
from public.coding_problems
where is_published = true;

revoke all on public.coding_problem_catalog from anon, authenticated;

grant select (
  id, title, slug, difficulty, category, description, constraints,
  starter_code, function_name, language, time_limit_ms, memory_limit_mb,
  comparison_mode, tolerance, is_published, is_featured, created_at, updated_at,
  evaluation_mode, entrypoint_type, entrypoint_name, framework, resource_profile
) on public.coding_problems to anon, authenticated;

grant select on public.coding_problem_catalog to anon, authenticated;

commit;
