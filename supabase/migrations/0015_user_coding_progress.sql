-- ---------------------------------------------------------------------------
-- RoboPrep — User coding progress cache (Week 5)
--
-- Submissions remain the source of truth; this table is a rebuildable cache
-- owned by the server so list views can render solved/attempted efficiently.
-- ---------------------------------------------------------------------------

begin;

create table if not exists public.user_coding_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id uuid not null references public.coding_problems (id) on delete cascade,
  status text not null default 'attempted',
  attempt_count integer not null default 0,
  best_runtime_ms integer,
  first_solved_at timestamptz,
  last_attempt_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, problem_id),
  constraint user_coding_progress_status_check check (status in ('solved', 'attempted', 'unsolved'))
);

alter table public.user_coding_progress enable row level security;

drop policy if exists "user_coding_progress_owner_read" on public.user_coding_progress;
create policy "user_coding_progress_owner_read"
  on public.user_coding_progress
  for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists user_coding_progress_problem_idx on public.user_coding_progress (problem_id);
create index if not exists user_coding_progress_status_idx on public.user_coding_progress (user_id, status);

drop trigger if exists user_coding_progress_set_updated_at on public.user_coding_progress;
create trigger user_coding_progress_set_updated_at
  before update on public.user_coding_progress
  for each row execute function public.set_updated_at();

revoke all on public.user_coding_progress from anon, authenticated;
grant select on public.user_coding_progress to authenticated;

commit;
