# Week 5 — Accessibility audit

Date: 2026-09-01

Week 5 Task 54. Audit of the Week 5 additions: test result semantics,
progress indicators, collection navigation, error announcements, tabs,
editor labels, submission state.

## Findings

| Check | Status | Notes |
| ----- | ------ | ----- |
| Pass/fail not colour-only | ✅ | `MLCheckResults` renders an icon (`Check` / `X` / `Minus`) **plus** text ("Passed" / "Failed" / "Info"); `MLResultPanel` uses icons + `n / m` tally |
| Progress has text equivalent | ✅ | Stat cards render `Solved 18 / 50` as text; `GroupRow` adds `sr-only` text ("3 checks passed, some failed") so screen readers get the verdict, not just colour |
| Collection navigation | ✅ | Links carry `aria-label="Open <collection name>"`; breadcrumbs use labelled `Breadcrumbs` |
| Error announcements | ✅ | Runtime/API errors use `role="alert"` (`coding-workspace`, `EntrypointError`); entrypoint failures render a categorized alert |
| Tabs / test details | ✅ | Per-test sections use `aria-label` ("Results by category", "Per-test results"); no unlabeled tab group was added in Week 5 |
| Editor labels | ✅ | Editor card has a visible `CardTitle` "Python editor" and the mode hint (`Python 3 · PyTorch · function · layer_norm()`) |
| Submission state | ✅ | Submit button shows busy state ("Submitting…") and is disabled while running; final verdict is text + icon |
| Keyboard navigation | ✅ | All Week 5 interactive elements are native buttons/links; no custom focus traps introduced |

## Issues found

1. **Minor — gradient row labels are code-flavoured.** `humanizeGradientLabel`
   converts `arg0` → "Input gradient · argument 1" and `param:w` →
   "Parameter gradient · w", which is readable but not localised. Accepted;
   English is the platform language.
2. **Resolved — result arrival now announced.** The result container in
   `coding-workspace.tsx` wraps `ResultView` in `aria-live="polite"`, so a
   screen reader user hears the verdict when it appears.

## Verification

- All pass/fail states remain understandable with colour disabled.
- `sr-only` tally text present in `GroupRow`.
- No colour-only conveyances in `MLCheckResults` / `MLResultPanel` /
  collections / progress components.
