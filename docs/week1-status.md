# Week 1 Status

> RoboPrep foundation — repository, database, authentication, design system,
> global layout, CI.
>
> Last updated: 2026-09-01

## Implemented

| Area                   | Status | Notes                                                                               |
| ---------------------- | ------ | ----------------------------------------------------------------------------------- |
| Next.js 16 App Router  | ✅     | TypeScript strict, `src/` directory, `@/*` alias, pnpm                              |
| Environment validation | ✅     | Zod-validated, public/server split, throws in production                            |
| Supabase clients       | ✅     | Browser, server (cookie-backed), service-role (server-only), session proxy          |
| Core schema            | ✅     | 8 tables, indexes, FK rules, `updated_at` triggers                                  |
| Row Level Security     | ✅     | Public read of published content; owner-only profiles                               |
| Seed data              | ✅     | 7 companies, 5 positions, 14 topics, 10 questions, 3 interviews                     |
| Authentication         | ✅     | Sign up / sign in / sign out, email + password, Zod-validated forms                 |
| Design tokens          | ✅     | CSS-first Tailwind v4 tokens in `src/app/globals.css`                               |
| UI primitives          | ✅     | button, card, badge, input, textarea, tabs, separator, skeleton, modal, empty-state |
| Global layout          | ✅     | Sticky translucent navbar, responsive drawer, ⌘K search placeholder, footer         |
| Landing page           | ✅     | Hero, product pillars, latest interviews, knowledge categories, coding preview      |
| Placeholder routes     | ✅     | `/knowledge`, `/interviews`, `/coding`, `/companies` read real seed data            |
| Quality gates          | ✅     | ESLint, TypeScript strict, Prettier, GitHub Actions CI                              |
| README                 | ✅     | Zero-to-running instructions                                                        |

`pnpm lint`, `pnpm typecheck` and `pnpm build` all pass.

## Routes

| Route            | Rendering | Auth | Data source                                     |
| ---------------- | --------- | ---- | ----------------------------------------------- |
| `/`              | dynamic   | no   | `interviews`, `topics`, `questions`             |
| `/knowledge`     | dynamic   | no   | `questions` + `question_topics` + `topics`      |
| `/interviews`    | dynamic   | no   | `interviews` (status = published) + `companies` |
| `/coding`        | static    | no   | none — roadmap placeholder                      |
| `/companies`     | dynamic   | no   | `companies` + counts                            |
| `/sign-in`       | dynamic   | no   | redirects when already signed in                |
| `/sign-up`       | dynamic   | no   | redirects when already signed in                |
| `/auth/callback` | dynamic   | no   | exchanges the email-confirmation code           |

Every route is server-rendered on demand because the root layout reads the
session cookie to render the navbar.

## Database migrations

| File                                          | Applied by          | Contents                                  |
| --------------------------------------------- | ------------------- | ----------------------------------------- |
| `supabase/migrations/0001_initial_schema.sql` | `supabase db reset` | Tables, indexes, constraints, triggers    |
| `supabase/migrations/0002_rls.sql`            | `supabase db reset` | RLS policies, `handle_new_user()` trigger |
| `supabase/seed.sql`                           | `supabase db reset` | Deterministic development dataset         |

Verified query path:

```
company → interviews → interview_questions → questions → question_topics → topics
```

`interview_questions.question_id` uses `ON DELETE RESTRICT`, so removing an
interview cannot destroy canonical questions shared by other interviews.

## Environment requirements

| Variable                        | Required for       | Notes                                  |
| ------------------------------- | ------------------ | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | everything         | Local default `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | everything         | Safe in the browser                    |
| `NEXT_PUBLIC_SITE_URL`          | auth redirects     | `http://localhost:3000` in development |
| `SUPABASE_SERVICE_ROLE_KEY`     | admin scripts only | Optional; never `NEXT_PUBLIC_`         |

Without credentials the app still boots — `isSupabaseConfigured` is false, all
data helpers return empty arrays, and pages render empty states.

## Known limitations

- **No dark mode.** Week 1 tokens are light-only by design.
- **No question detail page.** Knowledge list shows summaries only.
- **No search.** The navbar button and the `/knowledge` input are placeholders;
  the ⌘K shortcut is wired but opens an informational modal.
- **No route protection.** `src/proxy.ts` refreshes sessions but performs no
  redirects; protected areas do not exist yet.
- **Email confirmation gates the happy path.** If your Supabase project has
  confirmation enabled, sign-up shows "check your email" instead of creating a
  session immediately. Local development uses Inbucket at
  <http://localhost:54324>. Disable confirmation in
  **Auth → Providers → Email** for a frictionless local flow.
- **Types are hand-maintained.** `src/types/database.ts` mirrors the SQL; it
  should be replaced by `supabase gen types typescript` once a project is linked.
- **`src/hooks/` is empty** — no shared client hooks were needed.
- **No coding submissions table** — intentionally deferred.

## Deferred to Week 2

Week 2 is the **Knowledge System**:

- Knowledge list with filtering and pagination
- Question detail page (Quick Answer, Deep Dive, Follow-up Questions)
- Topic hierarchy navigation
- Search across questions and topics (replaces the ⌘K placeholder)
- Related questions and question-frequency metadata
- Coding judge — do **not** start before the knowledge data model and question
  rendering flow are stable
