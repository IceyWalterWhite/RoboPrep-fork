import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

/**
 * Week 8 Task 19: dynamic sitemap from published data only — Knowledge
 * questions, Interviews, Coding problems, Companies. Draft/admin/dev-only
 * pages are excluded (robots.ts also disallows them).
 */

interface SitemapRow {
  slug: string;
  updated_at?: string | null;
  published_at?: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.FLAG_ROBOTS_INDEX === "off") return [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/interviews`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/knowledge`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/coding`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/companies`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/content-policy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [questions, interviews, problems, companies, positions] = await Promise.all([
      supabase.from("questions").select("slug, updated_at").eq("is_published", true).limit(5000),
      supabase.from("interviews").select("slug, published_at").eq("status", "published").not("slug", "is", null).limit(5000),
      supabase.from("coding_problem_catalog").select("slug, updated_at").limit(5000),
      supabase.from("companies").select("slug").limit(2000),
      supabase.from("company_position_stats").select("company_id, position_id").limit(5000),
    ]);

    for (const row of (questions.data ?? []) as SitemapRow[]) {
      entries.push({ url: `${base}/knowledge/${row.slug}`, lastModified: row.updated_at ? new Date(row.updated_at) : undefined, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const row of (interviews.data ?? []) as SitemapRow[]) {
      if (!row.slug) continue;
      entries.push({ url: `${base}/interviews/${row.slug}`, lastModified: row.published_at ? new Date(row.published_at) : undefined, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const row of (problems.data ?? []) as SitemapRow[]) {
      entries.push({ url: `${base}/coding/${row.slug}`, lastModified: row.updated_at ? new Date(row.updated_at) : undefined, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const row of companies.data ?? []) {
      entries.push({ url: `${base}/companies/${row.slug}`, changeFrequency: "weekly", priority: 0.8 });
    }
    // Role pages: resolve position slugs against their company slugs.
    const positionIds = [...new Set((positions.data ?? []).map((row) => row.position_id))];
    if (positionIds.length > 0) {
      const { data: positionRows } = await supabase
        .from("positions")
        .select("id, slug, company_id")
        .in("id", positionIds);
      const companyIds = [...new Set((positionRows ?? []).map((row) => row.company_id))];
      const { data: companyRows } = companyIds.length
        ? await supabase.from("companies").select("id, slug").in("id", companyIds)
        : { data: [] };
      const slugByCompanyId = new Map((companyRows ?? []).map((row) => [row.id, row.slug]));
      for (const position of positionRows ?? []) {
        const companySlug = slugByCompanyId.get(position.company_id);
        if (!companySlug) continue;
        entries.push({ url: `${base}/companies/${companySlug}/roles/${position.slug}`, changeFrequency: "weekly", priority: 0.6 });
      }
    }
  } catch {
    // Sitemap degrades to the static entries when the DB is unreachable.
  }

  return entries;
}
