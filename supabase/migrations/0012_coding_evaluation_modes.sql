-- ---------------------------------------------------------------------------
-- RoboPrep — Structured coding evaluation modes (Week 5)
--
-- Extends Week 4 stdin/stdout problems with function/class evaluation:
-- every problem declares how it is judged (evaluation_mode) and with which
-- framework; evaluator-specific knobs live in evaluator_config (jsonb) and
-- are validated server-side with Zod before they are ever trusted.
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- coding_problems: evaluation mode + evaluator configuration
-- ---------------------------------------------------------------------------

alter table public.coding_problems
  add column if not exists evaluation_mode text not null default 'program',
  add column if not exists entrypoint_type text,
  add column if not exists entrypoint_name text,
  add column if not exists framework text,
  add column if not exists resource_profile text not null default 'standard_python',
  add column if not exists evaluator_config jsonb;

alter table public.coding_problems drop constraint if exists coding_problems_evaluation_mode_check;
alter table public.coding_problems
  add constraint coding_problems_evaluation_mode_check
  check (evaluation_mode in ('program', 'function', 'class'));

alter table public.coding_problems drop constraint if exists coding_problems_entrypoint_type_check;
alter table public.coding_problems
  add constraint coding_problems_entrypoint_type_check
  check (entrypoint_type is null or entrypoint_type in ('function', 'class'));

alter table public.coding_problems drop constraint if exists coding_problems_framework_check;
alter table public.coding_problems
  add constraint coding_problems_framework_check
  check (framework is null or framework in ('python', 'numpy', 'pytorch'));

alter table public.coding_problems drop constraint if exists coding_problems_resource_profile_check;
alter table public.coding_problems
  add constraint coding_problems_resource_profile_check
  check (resource_profile in ('standard_python', 'ml_cpu_small', 'ml_cpu_medium'));

-- Function/class problems must declare a matching entrypoint; program problems
-- must not pretend to have one.
alter table public.coding_problems drop constraint if exists coding_problems_entrypoint_required_check;
alter table public.coding_problems
  add constraint coding_problems_entrypoint_required_check
  check (
    (evaluation_mode in ('function', 'class') and entrypoint_type is not null and entrypoint_name is not null)
    or (evaluation_mode = 'program')
  );

create index if not exists coding_problems_evaluation_mode_idx
  on public.coding_problems (evaluation_mode);
create index if not exists coding_problems_framework_idx
  on public.coding_problems (framework);

-- ---------------------------------------------------------------------------
-- coding_test_cases: structured (function/class) test representation
-- ---------------------------------------------------------------------------

alter table public.coding_test_cases
  add column if not exists test_type text,
  add column if not exists test_group text,
  add column if not exists input_json jsonb,
  add column if not exists expected_json jsonb,
  add column if not exists metadata jsonb;

alter table public.coding_test_cases drop constraint if exists coding_test_cases_test_type_check;
alter table public.coding_test_cases
  add constraint coding_test_cases_test_type_check
  check (test_type is null or test_type in ('example', 'value', 'shape', 'dtype', 'gradient', 'exception', 'performance'));

alter table public.coding_test_cases drop constraint if exists coding_test_cases_test_group_check;
alter table public.coding_test_cases
  add constraint coding_test_cases_test_group_check
  check (test_group is null or test_group in ('basic', 'edge', 'numerical', 'shape', 'gradient', 'performance'));

create index if not exists coding_test_cases_problem_group_idx
  on public.coding_test_cases (problem_id, test_group, order_index);

-- ---------------------------------------------------------------------------
-- Public-safe projection refresh: expose evaluation metadata only. Raw
-- evaluator_config stays server-side so the browser can never treat it as
-- trusted instructions; a small redacted subset is enough for the UI.
-- ---------------------------------------------------------------------------

create or replace view public.coding_problem_catalog
with (security_invoker = true)
as
select
  id, title, slug, difficulty, category, description, constraints,
  starter_code, function_name, language, time_limit_ms, memory_limit_mb,
  comparison_mode, tolerance, is_published, is_featured, created_at, updated_at,
  evaluation_mode, entrypoint_type, entrypoint_name, framework, resource_profile
from public.coding_problems
where is_published = true;

create or replace view public.coding_visible_test_cases
with (security_invoker = true)
as
select id, problem_id, name, input_data, expected_output, weight, order_index, created_at,
       test_type, test_group, input_json, expected_json, metadata
from public.coding_test_cases
where is_hidden = false;

revoke all on public.coding_problem_catalog from anon, authenticated;
revoke all on public.coding_visible_test_cases from anon, authenticated;

grant select (
  id, title, slug, difficulty, category, description, constraints,
  starter_code, function_name, language, time_limit_ms, memory_limit_mb,
  comparison_mode, tolerance, is_published, is_featured, created_at, updated_at,
  evaluation_mode, entrypoint_type, entrypoint_name, framework, resource_profile
) on public.coding_problems to anon, authenticated;

grant select (
  id, problem_id, name, input_data, expected_output, is_hidden,
  weight, order_index, created_at,
  test_type, test_group, input_json, expected_json, metadata
) on public.coding_test_cases to anon, authenticated;

grant select on public.coding_problem_catalog to anon, authenticated;
grant select on public.coding_visible_test_cases to anon, authenticated;

commit;
