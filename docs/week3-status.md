# Week 3 status — Interview System MVP

Date: 2026-09-01

Week 3 is implemented as a structured, read-only interview intelligence layer. The product relationship is now:

```text
Company → Position → Interview → Round → Interview question occurrence → Knowledge question
```

## Implemented

- Added interview metadata, first-class rounds, tags, nullable canonical links, and round-level question provenance in migrations `0005`–`0007`.
- Added published-parent RLS for rounds, tags, and interview question occurrences, plus trigram search indexes.
- Added typed Interview summaries/details, source and verification states, filter parsing, stats, related-interview ranking, round grouping, and canonical-question mapping.
- Added database-backed `/interviews` search, filters, sorting, pagination, responsive cards, detail reading view, breadcrumbs, source metadata, related interviews, and explicit unresolved-question rendering.
- Refined Knowledge provenance cards so every linked occurrence resolves to `/interviews/[slug]` and shows company, role, period, round, and original wording.
- Connected the existing Knowledge query layer to `/knowledge`, including URL-driven search, topic, difficulty, type, company, sort, and pagination state. Interview and coding topic links now land on a real filtered page.
- Seeded 20 published interview records, 50 rounds, and 85 question occurrences while preserving three original Week 1 rows.

## Routes

| Route                | Purpose                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| `/interviews`        | Browse, search, filter, sort, and paginate published interviews                   |
| `/interviews/[slug]` | Read interview overview, rounds, occurrences, topics, source, and related records |
| `/knowledge`         | Browse canonical questions and follow topic/company filters                       |
| `/knowledge/[slug]`  | Read the canonical answer and navigate back to interview provenance               |

## Verification

```bash
supabase db reset --yes
pnpm check:interviews
pnpm test
pnpm lint
pnpm typecheck
```

The local integrity check currently passes with 20 published interviews, 50 rounds, and 85 occurrences. Core utility tests cover filter parsing, round grouping and ordering, stats, related ranking, source safety, and status normalization.

## Deliberate limitations

- Interview ingestion, moderation UI, user submissions, and company analytics remain out of scope.
- Development seed records use `source_type = development_seed` and are rendered as unverified; they are product fixtures rather than claims about real candidate experiences.
- The configured hosted Supabase project has not been migrated automatically. Run `supabase db push` only after reviewing and authorizing the target project.
