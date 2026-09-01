# Week 5 Collection Progress UX Audit (Task 46)

**Status:** Complete — no blocking issues

## Scope

`/coding/collections` (index) and `/coding/collections/[slug]` (detail) built by
Task 27, plus the progress surface on `/coding/progress` (Task 47). Seeded
collections (Task 45): 6 published collections with 63 ordered problem links.

## Required display elements

| Element | Index page | Detail page |
| --- | --- | --- |
| Title | ✅ `collection.name` card title | ✅ `<h1>` |
| Description | ✅ card description | ✅ under h1 |
| Progress | ✅ `N problems · M solved` | ✅ `N problems · X solved · Y attempted` |
| Ordered problems | — (link to detail) | ✅ numbered `<ol>` with `index + 1` |
| Difficulty | — | ✅ difficulty badge per problem |
| Status | ✅ per-collection solved count | ✅ Solved / Attempted status per problem |

## Acceptance criteria

- **Dense but readable** — index is a compact 3-column card grid (1 col on
  mobile, 2 at 768px, 3 at lg); detail is a single divide-y list, no cards per
  problem, no wasted vertical space. ✅
- **Mobile works** — grid collapses to 1 column; list rows wrap status to a
  new line on narrow screens; no horizontal overflow observed at 375/430 px
  (see `docs/week5-mobile-audit.md`). ✅
- **No oversized marketing hero** — both pages use the shared compact
  `PageHeader` / border-bottom header, not a hero block. ✅

## Progress source of truth

Progress is derived server-side from persisted submissions
(`getCodingCollections` / `getCodingCollectionBySlug` in
`src/lib/coding/queries.ts`), so the numbers are consistent with the progress
page and are never client-guessed.

## Notes

- Collection ordering is explicit (`order_index` on
  `coding_collection_problems`); the detail page renders it 1-based.
- Status chips carry text (Solved / Attempted), so state is not conveyed by
  colour alone (consistent with `docs/week5-accessibility-audit.md`).

No changes were required.
