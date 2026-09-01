# RoboPrep — Week 1 Codex Implementation Tasks

> Goal: build the production-ready foundation for **RoboPrep**, an Embodied AI interview preparation platform with Apple-inspired UI.
>
> Week 1 only focuses on: **repository foundation, app skeleton, database schema, authentication, design system, global layout, CI, and deployment readiness**.
>
> Do **not** implement the full Knowledge, Interview, or Coding Judge products yet.

---

## Week 1 Definition of Done

By the end of Week 1, the project should have:

- Next.js + TypeScript application running locally
- Supabase/PostgreSQL connected
- Authentication working
- Core database schema created
- Apple-inspired design tokens defined
- Reusable UI primitives implemented
- Responsive global navigation and layout implemented
- Placeholder routes available:
  - `/`
  - `/knowledge`
  - `/interviews`
  - `/coding`
  - `/companies`
- Lint / typecheck / build passing
- `.env.example` documented
- Project deployable without code changes

Recommended stack:

```text
Frontend      Next.js + React + TypeScript
Styling       Tailwind CSS
Database      Supabase PostgreSQL
Auth          Supabase Auth
Validation    Zod
Icons         Lucide React
Package mgr   pnpm
Deployment    Vercel
```

---

# Task 1 — Bootstrap Repository

## Goal

Initialize a clean production-oriented Next.js repository for RoboPrep.

## Requirements

Create a Next.js application using:

- TypeScript
- App Router
- Tailwind CSS
- ESLint
- `src/` directory
- pnpm

Set up the repository so later tasks can build on a consistent structure.

## Target Structure

```text
roboprep/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── styles/
├── public/
├── supabase/
├── scripts/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

## Implementation Notes

1. Configure import alias:

```text
@/*
```

mapping to:

```text
src/*
```

2. Add npm scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}
```

3. Add basic dependencies:

```text
@supabase/ssr
@supabase/supabase-js
zod
lucide-react
clsx
tailwind-merge
```

4. Add utility:

```text
src/lib/utils.ts
```

with a standard `cn()` helper using `clsx` and `tailwind-merge`.

5. Replace default Next.js demo content with a minimal RoboPrep placeholder.

## Acceptance Criteria

- `pnpm install` succeeds
- `pnpm dev` starts the application
- `pnpm typecheck` passes
- `pnpm build` passes
- No default Next.js template content remains
- Repository structure matches the architecture above

## Do Not

- Do not add a component library such as MUI or Ant Design
- Do not implement feature pages
- Do not add Redux
- Do not add unnecessary state-management libraries

---

# Task 2 — Environment Configuration

## Goal

Create a safe and explicit environment-variable configuration layer.

## Required Environment Variables

Create `.env.example` containing:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Do not commit real secrets.

## Implementation

Create:

```text
src/lib/env.ts
```

Use Zod to validate server-side environment variables.

The project should fail early with a readable error if required variables are missing in production.

Separate:

```text
public environment variables
server-only environment variables
```

Do not expose the service-role key to browser bundles.

## Acceptance Criteria

- `.env.example` exists
- Secrets are excluded via `.gitignore`
- Server-only secrets cannot be imported from client components
- Environment validation is centralized
- README contains setup instructions

## Do Not

- Never hard-code credentials
- Never expose `SUPABASE_SERVICE_ROLE_KEY` through `NEXT_PUBLIC_*`

---

# Task 3 — Supabase Client Infrastructure

## Goal

Add reusable Supabase browser/server clients compatible with Next.js App Router.

## Files

Create:

```text
src/lib/supabase/
├── client.ts
├── server.ts
└── middleware.ts
```

## Requirements

### Browser client

Provide a function for Client Components.

### Server client

Provide a server-side client using cookies for:

- Server Components
- Route Handlers
- Server Actions

### Middleware

Support session refresh.

Add root middleware:

```text
src/middleware.ts
```

Do not apply authentication redirects yet except where strictly needed.

## Acceptance Criteria

- Browser and server Supabase clients work independently
- Session cookies persist correctly
- Middleware does not break static/public routes
- `pnpm build` passes

## Do Not

- Do not use service-role credentials for normal application reads
- Do not implement application-specific authorization here

---

# Task 4 — Core Database Schema

## Goal

Create the initial RoboPrep relational schema.

The schema must be designed around:

```text
Company
→ Position
→ Interview
→ Interview Question
→ Canonical Question
→ Topic
```

## Create SQL Migration

Create:

```text
supabase/migrations/0001_initial_schema.sql
```

## Required Tables

### profiles

```text
id uuid primary key
username text
display_name text
avatar_url text
created_at timestamptz
updated_at timestamptz
```

`id` references `auth.users(id)`.

---

### companies

```text
id uuid primary key
name text not null
slug text unique not null
logo_url text
country text
industry text
description text
created_at timestamptz
updated_at timestamptz
```

---

### positions

```text
id uuid primary key
company_id uuid not null
title text not null
slug text not null
category text
location text
created_at timestamptz
updated_at timestamptz
```

Foreign key:

```text
company_id → companies.id
```

---

### interviews

```text
id uuid primary key
company_id uuid not null
position_id uuid
year integer not null
season text
location text
interview_type text
source_type text
source_url text
status text
created_by uuid
created_at timestamptz
updated_at timestamptz
verified_at timestamptz
```

Status should support:

```text
draft
review
published
rejected
```

---

### questions

```text
id uuid primary key
title text not null
slug text unique not null
question_type text not null
difficulty text
summary text
canonical_answer text
deep_answer text
created_at timestamptz
updated_at timestamptz
```

Initial `question_type` values:

```text
knowledge
coding
system_design
research
behavioral
```

---

### interview_questions

```text
id uuid primary key
interview_id uuid not null
question_id uuid not null
round_number integer
order_index integer
original_wording text
created_at timestamptz
```

---

### topics

```text
id uuid primary key
name text not null
slug text unique not null
parent_id uuid
description text
created_at timestamptz
updated_at timestamptz
```

Self-reference:

```text
parent_id → topics.id
```

---

### question_topics

```text
question_id uuid not null
topic_id uuid not null
weight numeric
created_at timestamptz
```

Composite primary key:

```text
(question_id, topic_id)
```

---

## Indexes

Add indexes for:

```text
companies.slug
positions.company_id
interviews.company_id
interviews.position_id
interviews.year
interviews.status
questions.slug
questions.question_type
interview_questions.interview_id
interview_questions.question_id
topics.slug
question_topics.topic_id
```

## Trigger

Automatically update:

```text
updated_at
```

for mutable tables.

## Acceptance Criteria

- Migration executes successfully on a fresh database
- Foreign keys are correct
- Deleting referenced data does not accidentally destroy unrelated canonical questions
- Unique constraints work
- Query path below is possible:

```text
company
→ interviews
→ interview_questions
→ questions
→ question_topics
→ topics
```

## Do Not

- Do not store arrays of question IDs inside interviews
- Do not store topics as comma-separated strings
- Do not duplicate canonical questions per interview
- Do not add coding submissions yet

---

# Task 5 — Row Level Security

## Goal

Add minimal secure RLS policies.

Create:

```text
supabase/migrations/0002_rls.sql
```

## Rules

Public anonymous users may read:

```text
published interviews
companies
positions
questions
topics
interview_questions belonging to published interviews
question_topics
```

Authenticated users may:

```text
read their own profile
update their own profile
```

Do not allow normal users to directly publish interviews.

Admin operations will be added later.

## Acceptance Criteria

- RLS is enabled on exposed tables
- Anonymous user can read public content
- Anonymous user cannot mutate data
- Authenticated user cannot edit another profile
- Client-side use does not require service-role key

---

# Task 6 — Seed Development Data

## Goal

Create a small deterministic dataset for frontend development.

Create:

```text
supabase/seed.sql
```

## Add Companies

At minimum:

```text
ByteDance
NVIDIA
Physical Intelligence
Figure AI
Unitree
AgiBot
DJI
```

## Add Topics

At minimum:

```text
Embodied AI
Transformer
Attention
QKV
KV Cache
VLA
World Model
Diffusion Policy
RL
PPO
GRPO
Robot Data
Robotics
SE(3)
```

Use parent-child relationships where appropriate.

## Add Questions

At minimum 10 canonical questions, for example:

```text
What are Q, K and V in attention?
Why is KV Cache useful?
What is the difference between PPO and GRPO?
Why does GRPO not require a critic?
What is action chunking?
What is Diffusion Policy?
What is a Vision-Language-Action model?
What is an action-conditioned world model?
What is SE(3)?
What are the main stages of a robot data collection pipeline?
```

Add 3 sample interviews linking to those questions.

## Acceptance Criteria

A local development database contains enough data to render realistic placeholder pages.

## Do Not

- Do not generate hundreds of AI questions
- Do not optimize the seed for production completeness

---

# Task 7 — Authentication

## Goal

Implement minimal user authentication.

## Required Features

Support:

```text
Sign in
Sign up
Sign out
```

Preferred initial authentication:

```text
Email + password
```

OAuth can be added later.

## Routes

Create:

```text
/sign-in
/sign-up
```

## Components

Create:

```text
src/components/auth/
├── sign-in-form.tsx
├── sign-up-form.tsx
└── user-menu.tsx
```

## Requirements

- Use Supabase Auth
- Validate forms using Zod
- Provide readable errors
- Redirect authenticated users appropriately
- Navbar displays sign-in state
- User menu supports sign-out

## Acceptance Criteria

```text
new user
→ sign up
→ session created
→ refresh page
→ session persists
→ sign out
```

works correctly.

## Do Not

- Do not build password-reset flow unless trivial
- Do not build social auth yet
- Do not create custom JWT logic

---

# Task 8 — Design Tokens

## Goal

Define RoboPrep's Apple-inspired visual language before building product UI.

## Visual Principles

Use:

```text
high whitespace
strong typography hierarchy
minimal borders
subtle surfaces
restrained shadows
neutral palette
blue only for primary interaction
```

Avoid:

```text
neon gradients
cyberpunk visuals
heavy glassmorphism
excessive shadows
large amounts of decorative animation
```

## Color Tokens

Use approximately:

```css
--background: #f5f5f7;
--surface: #ffffff;

--text-primary: #1d1d1f;
--text-secondary: #6e6e73;
--text-tertiary: #86868b;

--border: #d2d2d7;
--border-subtle: rgba(0, 0, 0, 0.08);

--accent: #0071e3;
--accent-hover: #0077ed;

--success: #34c759;
--warning: #ff9f0a;
--danger: #ff3b30;
```

## Radius

```text
small      8px
medium     14px
large      20px
modal      24px
```

## Typography

Use system stack:

```css
-apple-system,
BlinkMacSystemFont,
"SF Pro Text",
"SF Pro Display",
"PingFang SC",
"Helvetica Neue",
Arial,
sans-serif
```

Do not bundle proprietary font files.

## Layout Width

Define reusable content widths:

```text
wide        1440px
content     1200px
reading      760px
```

## Acceptance Criteria

- Tokens live in one central place
- Feature pages should not need raw hex values
- Dark mode is not required in Week 1
- Typography looks consistent on macOS and Windows

---

# Task 9 — UI Primitives

## Goal

Create the small reusable UI layer used throughout RoboPrep.

## Components

Create:

```text
src/components/ui/
├── button.tsx
├── card.tsx
├── badge.tsx
├── input.tsx
├── textarea.tsx
├── tabs.tsx
├── separator.tsx
├── skeleton.tsx
├── modal.tsx
└── empty-state.tsx
```

Use existing Radix primitives only when useful; do not blindly introduce a full component framework.

## Required Button Variants

```text
primary
secondary
ghost
danger
```

## Required Badge Variants

```text
default
topic
difficulty
status
```

## Acceptance Criteria

- Keyboard accessibility works
- Focus states are visible
- Components accept `className`
- Components use central tokens
- No duplicated styling implementation
- Components look coherent together

---

# Task 10 — Global App Layout

## Goal

Build the main navigation shell.

## Navbar

Desktop structure:

```text
RoboPrep

Interview
Knowledge
Coding
Companies

                         Search
                         Sign in / User
```

Mobile:

```text
RoboPrep
Search
Menu
```

## Routes

Navbar should link to:

```text
/interviews
/knowledge
/coding
/companies
```

## Requirements

- Sticky or semi-sticky navbar
- Subtle translucent background is acceptable
- Avoid excessive blur
- Active route state
- Responsive navigation
- User authentication state
- Search button placeholder with keyboard shortcut hint:

```text
⌘ K
```

Search functionality itself belongs to Week 2.

## Acceptance Criteria

- Navigation works desktop/mobile
- No layout shift after auth state resolves
- Header does not dominate page height
- UI feels clean rather than dashboard-like

---

# Task 11 — Landing Page Skeleton

## Goal

Create a polished but minimal homepage.

Do not spend excessive time on marketing animation.

## Hero

Suggested copy:

```text
RoboPrep

Master Embodied AI.
One question at a time.

Real interview experiences, essential knowledge,
and hands-on coding for Embodied AI roles.
```

Primary CTA:

```text
Start Practicing
```

Secondary CTA:

```text
Explore Interviews
```

## Sections

Only add:

```text
Hero
Product pillars
Latest interview placeholder
Knowledge categories placeholder
Coding preview
Footer
```

## Product Pillars

```text
Real Interviews
Knowledge
Coding
```

## Acceptance Criteria

- High-quality responsive layout
- Strong whitespace and typography
- No fake statistics presented as real data
- Lighthouse performance is reasonable
- No large unnecessary JS animation library

---

# Task 12 — Placeholder Feature Routes

## Goal

Create consistent placeholder pages for the future core products.

## Routes

```text
/knowledge
/interviews
/coding
/companies
```

Each page should contain:

```text
title
short description
empty or seed-data preview
consistent page container
```

Where possible, read seed data from Supabase rather than hardcoding everything.

## Example

`/knowledge`:

```text
Knowledge

Core questions for Embodied AI interviews.

[search placeholder]

Recent Questions
...
```

## Acceptance Criteria

- All routes render
- Shared layout is reused
- Loading states are handled
- Empty database does not crash pages
- Server Components are used by default

---

# Task 13 — Repository Quality Gates

## Goal

Prevent low-quality code from accumulating.

## Add

```text
ESLint
TypeScript strict mode
Prettier
```

Optionally add simple pre-commit checks if they do not complicate setup.

## CI

Create:

```text
.github/workflows/ci.yml
```

Run on pull request:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

## Acceptance Criteria

- CI config is valid
- Build has no TypeScript errors
- No ignored lint errors without explanation
- `any` should be avoided in application code

---

# Task 14 — README and Developer Onboarding

## Goal

A new developer should be able to run RoboPrep without asking questions.

## README Must Include

```text
Project overview
Architecture
Tech stack
Prerequisites
Installation
Environment variables
Supabase setup
Database migration
Database seed
Development command
Build command
Project structure
Contribution conventions
```

## Include Quick Start

Example:

```bash
git clone ...
cd roboprep
pnpm install
cp .env.example .env.local

# configure Supabase

pnpm dev
```

Document actual commands used by this repository rather than fake placeholders.

## Acceptance Criteria

A developer with Node, pnpm, and Supabase credentials can follow README from zero to a running app.

---

# Task 15 — Week 1 Integration Audit

## Goal

Perform a final integration pass rather than adding new features.

## Test Flows

### Public flow

```text
/
→ /knowledge
→ /interviews
→ /coding
→ /companies
```

### Auth flow

```text
/sign-up
→ authenticated
→ refresh
→ user menu
→ sign out
```

### Database flow

Verify:

```text
company
→ interview
→ interview_question
→ canonical question
→ topic
```

using actual Supabase queries.

### Responsive flow

Test:

```text
375px
768px
1280px+
```

## Run

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Fix all errors.

## Deliverables

Create:

```text
docs/week1-status.md
```

with:

```text
Implemented
Known limitations
Deferred to Week 2
Database migrations
Routes
Environment requirements
```

## Acceptance Criteria

Week 1 is complete only if:

- application builds successfully
- authentication works
- database schema works
- responsive navigation works
- all four main feature routes load
- design system is reusable
- there are no blocking TODOs in foundational code

---

# Recommended Execution Order

Give Codex the tasks in this exact order:

```text
01 Bootstrap Repository
02 Environment Configuration
03 Supabase Client Infrastructure
04 Core Database Schema
05 Row Level Security
06 Seed Development Data
07 Authentication
08 Design Tokens
09 UI Primitives
10 Global App Layout
11 Landing Page Skeleton
12 Placeholder Feature Routes
13 Repository Quality Gates
14 README and Developer Onboarding
15 Week 1 Integration Audit
```

Do not ask Codex to execute all tasks in a single prompt.

Prefer:

```text
one task
→ inspect diff
→ run tests
→ commit
→ next task
```

---

# Codex Global Instruction

Paste this before individual task instructions when starting a fresh Codex session:

```text
You are implementing RoboPrep, a production-oriented Embodied AI interview preparation platform.

Engineering rules:

1. Read the existing repository before modifying code.
2. Preserve existing working functionality.
3. Use Next.js App Router, TypeScript strict mode, and Server Components by default.
4. Avoid introducing dependencies unless they materially simplify the implementation.
5. Keep the architecture simple and extensible.
6. Never hard-code secrets.
7. Never expose server-only credentials to client components.
8. Reuse shared UI components and design tokens.
9. Do not implement features outside the current task.
10. After implementation, run the relevant lint, typecheck, and build checks.
11. Fix errors caused by your changes.
12. Summarize:
    - files changed
    - architectural decisions
    - commands run
    - remaining limitations

Product direction:

RoboPrep is not a generic forum. Its core data model is:

Company
→ Position
→ Interview
→ Interview Question
→ Canonical Question
→ Topic

The long-term product combines:
- real Embodied AI interview experiences
- structured knowledge questions
- LeetCode-style robotics / ML coding exercises

Visual direction:
Apple-inspired, content-first, restrained, high whitespace, strong typography, neutral surfaces, minimal borders, and blue primary actions.

Do not use neon gradients, cyberpunk visual styles, excessive glassmorphism, or cluttered dashboard patterns.
```

---

# What Week 2 Should Start From

After Week 1 is accepted, Week 2 should focus entirely on:

```text
Knowledge System
```

including:

```text
Knowledge list
Question detail
Topic hierarchy
Search
Quick Answer
Deep Dive
Follow-up Questions
Related Questions
Question frequency metadata
```

Do not start Coding Judge before the Knowledge data model and question rendering flow are stable.
