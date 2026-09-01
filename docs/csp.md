# CSP configuration (Week 8 Task 86)

Defined in `next.config.ts`. Directives and reasons:

| Directive | Value | Reason |
| --- | --- | --- |
| default-src | 'self' | Everything else is enumerated |
| connect-src | 'self', Supabase project origin, https://*.supabase.co | Auth + database REST calls |
| script-src | 'self' 'unsafe-inline' 'unsafe-eval' | Next.js runtime + Monaco worker bootstrap; tightening requires a nonce pipeline (P2) |
| style-src | 'self' 'unsafe-inline' | Tailwind + editor inline styles |
| img-src | 'self' data: blob: | Avatars/logos, editor assets |
| worker-src | 'self' blob: | Monaco web workers (Task 86 requirement) |
| frame-ancestors / X-Frame-Options | 'none' / DENY | Clickjacking protection |
| base-uri, form-action | 'self' | Standard hardening |

Do not add domains without documenting the reason here.
