# SEO & indexability audit (Week 8 Tasks 16–23)

- **Metadata**: every public route has unique, real title/description
  (`buildMetadata` helper centralizes canonical + OG/Twitter).
- **Canonical**: detail pages set `alternates.canonical`; filtered list URLs
  (`?company=`, `?topic=`, `?q=`) do not emit canonical — they are indexable
  discovery paths but the sitemap only lists canonical detail URLs.
- **robots.txt**: allows public content; disallows `/admin`, `/api/`,
  `/interviews/submissions/`, `/settings`, `/onboarding`, `/auth/`.
  Preview deployments set `FLAG_ROBOTS_INDEX=off` (fully disallowed).
- **Sitemap** (`/sitemap.xml`): homepage, section roots, published knowledge
  questions, published interviews, coding problems, companies, role pages.
  Drafts, admin, and dev-only pages excluded.
- **SSR**: all public list/detail pages are server-rendered with real content
  (verified in `next build` output: dynamic server-rendered routes; no
  client-only shells on content pages).
- **JSON-LD**: `WebSite` structured data only; no fabricated
  `JobPosting`/`ReviewPage` markup.
- **OG image**: static `/og.png` placeholder ships in `public/`; replace with
  branded artwork before announcement (no dynamic OG needed for V1).
