-- ---------------------------------------------------------------------------
-- RoboPrep — Coding problem collections (Week 5)
--
-- Curated ordered learning paths (many-to-many via a join table, no ID arrays).
-- ---------------------------------------------------------------------------

begin;

create table if not exists public.coding_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  is_published boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coding_collection_problems (
  collection_id uuid not null references public.coding_collections (id) on delete cascade,
  problem_id uuid not null references public.coding_problems (id) on delete cascade,
  order_index integer not null default 0,
  primary key (collection_id, problem_id)
);

alter table public.coding_collections enable row level security;
alter table public.coding_collection_problems enable row level security;

drop policy if exists "coding_collections_public_read_published" on public.coding_collections;
create policy "coding_collections_public_read_published"
  on public.coding_collections
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "coding_collection_problems_public_read" on public.coding_collection_problems;
create policy "coding_collection_problems_public_read"
  on public.coding_collection_problems
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.coding_collections c
      join public.coding_problems p on p.id = coding_collection_problems.problem_id
      where c.id = coding_collection_problems.collection_id
        and c.is_published = true
        and p.is_published = true
    )
  );

create index if not exists coding_collections_slug_idx on public.coding_collections (slug);
create index if not exists coding_collections_order_idx on public.coding_collections (order_index);
create index if not exists coding_collection_problems_collection_idx
  on public.coding_collection_problems (collection_id, order_index);
create index if not exists coding_collection_problems_problem_idx
  on public.coding_collection_problems (problem_id);

drop trigger if exists coding_collections_set_updated_at on public.coding_collections;
create trigger coding_collections_set_updated_at
  before update on public.coding_collections
  for each row execute function public.set_updated_at();

revoke all on public.coding_collections from anon, authenticated;
revoke all on public.coding_collection_problems from anon, authenticated;
grant select on public.coding_collections to anon, authenticated;
grant select on public.coding_collection_problems to anon, authenticated;

commit;
