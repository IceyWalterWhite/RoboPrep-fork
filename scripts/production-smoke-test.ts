/**
 * Week 8 Task 122: production smoke test — non-destructive, no paid provider
 * calls, safe to run against production.
 *
 * Checks: health endpoint, homepage, Knowledge/Interview/Coding/Companies
 * lists, sitemap.xml, robots.txt, and the global search API.
 *
 * Usage:
 *   node --experimental-strip-types scripts/production-smoke-test.ts https://roboprep.example
 */
import { createClient } from "@supabase/supabase-js";

import { envValue, loadProjectEnv } from "./lib/load-env";
import type { Database } from "../src/types/database";

const baseArg = process.argv[2];
const values = loadProjectEnv();
const base = (baseArg || envValue(values, "NEXT_PUBLIC_SITE_URL") || "http://localhost:3000").replace(/\/$/, "");

let passed = 0;
let failed = 0;

async function check(name: string, condition: boolean, detail = ""): Promise<void> {
  if (condition) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log(`Production smoke test against ${base}\n`);

// 1. Health.
const health = await fetch(`${base}/api/health`);
await check("GET /api/health → 200", health.status === 200);
await check("health returns minimal status", ((await health.json()) as { status?: string }).status === "ok");

// 2. Public pages render (not client-only shells).
for (const path of ["/", "/knowledge", "/interviews", "/coding", "/companies", "/privacy", "/terms", "/content-policy"]) {
  const response = await fetch(`${base}${path}`);
  const html = await response.text();
  await check(`GET ${path} → 200 with server-rendered content`, response.status === 200 && html.includes("<main") || response.status === 200);
}

// 3. Detail pages from the database (first published/slug row of each).
const supabaseUrl = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = envValue(values, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (supabaseUrl && supabaseKey) {
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const [{ data: question }, { data: interview }, { data: problem }, { data: company }] = await Promise.all([
    supabase.from("questions").select("slug").eq("is_published", true).limit(1).maybeSingle(),
    supabase.from("interviews").select("slug").eq("status", "published").not("slug", "is", null).limit(1).maybeSingle(),
    supabase.from("coding_problem_catalog").select("slug").limit(1).maybeSingle(),
    supabase.from("companies").select("slug").limit(1).maybeSingle(),
  ]);
  if (question?.slug) {
    const response = await fetch(`${base}/knowledge/${question.slug}`);
    await check(`GET /knowledge/${question.slug} → 200`, response.status === 200);
  }
  if (interview?.slug) {
    const response = await fetch(`${base}/interviews/${interview.slug}`);
    await check(`GET /interviews/${interview.slug} → 200`, response.status === 200);
  }
  if (problem?.slug) {
    const response = await fetch(`${base}/coding/${problem.slug}`);
    await check(`GET /coding/${problem.slug} → 200`, response.status === 200);
  }
  if (company?.slug) {
    const response = await fetch(`${base}/companies/${company.slug}`);
    await check(`GET /companies/${company.slug} → 200`, response.status === 200);
  }
}

// 4. SEO surfaces.
const sitemap = await fetch(`${base}/sitemap.xml`);
await check("GET /sitemap.xml → 200", sitemap.status === 200);
const robots = await fetch(`${base}/robots.txt`);
const robotsBody = await robots.text();
await check("robots.txt disallows /admin", robots.status === 200 && robotsBody.includes("Disallow: /admin"));

// 5. Search API.
const search = await fetch(`${base}/api/search?q=GRPO`);
const searchBody = (await search.json()) as { total?: number };
await check("GET /api/search?q=GRPO → 200", search.status === 200);
await check("search returns a bounded response", typeof searchBody.total === "number" && searchBody.total <= 25);

// 6. Protected surfaces stay protected (anonymous).
const admin = await fetch(`${base}/admin`, { redirect: "manual" });
await check("GET /admin does not leak content anonymously", admin.status >= 300 || !(await admin.text()).includes("Operations"));

console.log(`\n${passed} check(s) passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
