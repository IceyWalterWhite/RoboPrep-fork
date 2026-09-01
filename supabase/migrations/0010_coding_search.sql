-- ---------------------------------------------------------------------------
-- RoboPrep — Coding search support (Week 4)
-- ---------------------------------------------------------------------------

create extension if not exists pg_trgm;

create index if not exists coding_problems_title_trgm_idx
  on public.coding_problems using gin (title gin_trgm_ops);
create index if not exists coding_problems_description_trgm_idx
  on public.coding_problems using gin (description gin_trgm_ops);
create index if not exists coding_problems_constraints_trgm_idx
  on public.coding_problems using gin (constraints gin_trgm_ops);
