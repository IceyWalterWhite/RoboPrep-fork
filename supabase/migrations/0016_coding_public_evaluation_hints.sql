-- ---------------------------------------------------------------------------
-- RoboPrep — Public evaluation hints (Week 5)
--
-- Task 19 wants the problem page to show *how* a problem is evaluated
-- (correctness / shape / dtype / gradient) before the user starts coding,
-- while Task 2 requires that raw `evaluator_config` jsonb stays server-side
-- (the browser must never treat it as trusted evaluator instructions, and
-- tolerances are maintainer data, not user data).
--
-- Solution: publish only a derived text[] of capability hints through a
-- security-definer helper. The function reads evaluator_config with owner
-- rights but returns only the derived labels — never the config itself.
-- ---------------------------------------------------------------------------

begin;

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
grant execute on function public.coding_problem_public_checks(text, jsonb) to anon, authenticated;

-- Refresh the public projection with the derived hints column.
create or replace view public.coding_problem_catalog
with (security_invoker = true)
as
select
  id, title, slug, difficulty, category, description, constraints,
  starter_code, function_name, language, time_limit_ms, memory_limit_mb,
  comparison_mode, tolerance, is_published, is_featured, created_at, updated_at,
  evaluation_mode, entrypoint_type, entrypoint_name, framework, resource_profile,
  public.coding_problem_public_checks(evaluation_mode, evaluator_config) as public_checks
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
