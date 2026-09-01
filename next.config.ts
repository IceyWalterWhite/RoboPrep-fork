import type { NextConfig } from "next";

/**
 * Week 8 Task 85: security headers. CSP notes (docs/csp.md):
 * - Monaco loads its workers from a blob: URL → worker-src blob:
 * - Supabase (auth + database) needs connect-src to the project origin
 * - script/styles keep 'unsafe-inline'/'unsafe-eval' for the Next.js runtime
 *   and Tailwind; tightening further requires a nonce pipeline (documented).
 * Every directive has a reason; do not loosen without documenting why.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const connectSrc = ["'self'", supabaseUrl, "https://*.supabase.co"].filter(Boolean).join(" ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `connect-src ${connectSrc}`,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
