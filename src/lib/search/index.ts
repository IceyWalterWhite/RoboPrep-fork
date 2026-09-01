import "server-only";

import { createClient } from "@/lib/supabase/server";
import { COMPANY_ALIAS_FALLBACK, rankResults } from "./ranking";

/**
 * Week 8 Tasks 24, 26: grouped global search on the existing Postgres stack.
 * Each group is a bounded `ilike` candidate query; deterministic ranking and
 * the per-group limit are applied in-process. Published content only.
 */

export type SearchGroup = "knowledge" | "interviews" | "coding" | "companies" | "topics";

export interface SearchHit {
  title: string;
  subtitle: string | null;
  href: string;
  group: SearchGroup;
}

export interface GroupedSearchResults {
  query: string;
  groups: Array<{ group: SearchGroup; label: string; hits: SearchHit[] }>;
  total: number;
}

export const SEARCH_GROUP_LABELS: Record<SearchGroup, string> = {
  knowledge: "Knowledge",
  interviews: "Interviews",
  coding: "Coding",
  companies: "Companies",
  topics: "Topics",
};

const MAX_QUERY_LENGTH = 60;
const MIN_QUERY_LENGTH = 2;

export async function globalSearch(
  rawQuery: string,
  options: { limitPerGroup?: number } = {},
): Promise<GroupedSearchResults> {
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  const limit = options.limitPerGroup ?? 5;
  if (query.length < MIN_QUERY_LENGTH) {
    return { query, groups: [], total: 0 };
  }

  const supabase = await createClient();
  const pattern = `%${query.replace(/[%_]/g, "")}%`;

  const [questions, interviews, problems, companies, topics] = await Promise.all([
    supabase
      .from("questions")
      .select("id, title, slug, summary")
      .eq("is_published", true)
      .or(`title.ilike.${pattern},summary.ilike.${pattern}`)
      .limit(25),
    supabase
      .from("interviews")
      .select("id, title, slug, company_id, year")
      .eq("status", "published")
      .not("slug", "is", null)
      .or(`title.ilike.${pattern},summary.ilike.${pattern}`)
      .limit(25),
    supabase
      .from("coding_problem_catalog")
      .select("id, title, slug, category")
      .or(`title.ilike.${pattern},category.ilike.${pattern}`)
      .limit(25),
    supabase
      .from("companies")
      .select("id, name, slug, description")
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .limit(15),
    supabase.from("topics").select("id, name, slug, description").ilike("name", pattern).limit(15),
  ]);

  // Company alias resolution (Task 114): table first, code fallback second.
  const aliasPattern = query.toLowerCase();
  const { data: aliasRows } = await supabase
    .from("company_aliases")
    .select("alias, company_id")
    .ilike("alias", pattern);
  const aliasCompanyIds = new Set((aliasRows ?? []).map((row) => row.company_id));
  const fallbackCompanies = COMPANY_ALIAS_FALLBACK.filter((entry) =>
    entry.aliases.some((alias) => alias.toLowerCase().includes(aliasPattern)),
  ).map((entry) => entry.companySlug);
  let aliasCompanyNames: string[] = [];
  if (aliasCompanyIds.size > 0 || fallbackCompanies.length > 0) {
    const idList = [...aliasCompanyIds];
    const nameQuery = supabase.from("companies").select("id, name, slug, description");
    const { data: aliasCompanies } =
      idList.length > 0 ? await nameQuery.in("id", idList) : await nameQuery.in("slug", fallbackCompanies);
    aliasCompanyNames = (aliasCompanies ?? []).map((company) => company.name);
  }

  const companyHits = [
    ...(companies.data ?? []).map((company) => ({
      id: company.id,
      title: company.name,
      slug: company.slug,
      subtitle: company.description,
    })),
    ...aliasCompanyNames.map((name, index) => ({
      id: `alias-${index}`,
      title: name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      subtitle: "Company (alias match)",
    })),
  ];

  const knowledgeHits: SearchHit[] = rankResults(
    query,
    (questions.data ?? []).map((row) => ({ id: row.id, title: row.title, slug: row.slug, subtitle: row.summary })),
  ).map((entry) => ({
    title: entry.item.title,
    subtitle: entry.item.subtitle,
    href: `/knowledge/${entry.item.slug}`,
    group: "knowledge" as const,
  }));

  const interviewHits: SearchHit[] = rankResults(
    query,
    (interviews.data ?? []).map((row) => ({
      id: row.id,
      title: row.title ?? row.slug ?? "Interview",
      slug: row.slug ?? "",
      subtitle: row.year ? String(row.year) : null,
    })),
  )
    .filter((entry) => entry.item.slug.length > 0)
    .map((entry) => ({
      title: entry.item.title,
      subtitle: entry.item.subtitle,
      href: `/interviews/${entry.item.slug}`,
      group: "interviews" as const,
    }));

  const codingHits: SearchHit[] = rankResults(
    query,
    (problems.data ?? []).map((row) => ({ id: row.id, title: row.title, slug: row.slug, subtitle: row.category })),
  ).map((entry) => ({
    title: entry.item.title,
    subtitle: entry.item.subtitle,
    href: `/coding/${entry.item.slug}`,
    group: "coding" as const,
  }));

  const companyHitsRanked: SearchHit[] = rankResults(query, companyHits).map((entry) => ({
    title: entry.item.title,
    subtitle: entry.item.subtitle,
    href: `/companies/${entry.item.slug}`,
    group: "companies" as const,
  }));

  const topicHits: SearchHit[] = rankResults(
    query,
    (topics.data ?? []).map((row) => ({ id: row.id, title: row.name, slug: row.slug, subtitle: row.description })),
  ).map((entry) => ({
    title: entry.item.title,
    subtitle: entry.item.subtitle,
    href: `/knowledge?topic=${entry.item.slug}`,
    group: "topics" as const,
  }));

  const grouped: Array<{ group: SearchGroup; label: string; hits: SearchHit[] }> = [
    { group: "knowledge", label: SEARCH_GROUP_LABELS.knowledge, hits: knowledgeHits.slice(0, limit) },
    { group: "interviews", label: SEARCH_GROUP_LABELS.interviews, hits: interviewHits.slice(0, limit) },
    { group: "coding", label: SEARCH_GROUP_LABELS.coding, hits: codingHits.slice(0, limit) },
    { group: "companies", label: SEARCH_GROUP_LABELS.companies, hits: companyHitsRanked.slice(0, limit) },
    { group: "topics", label: SEARCH_GROUP_LABELS.topics, hits: topicHits.slice(0, limit) },
  ];

  const total = grouped.reduce((sum, entry) => sum + entry.hits.length, 0);
  return {
    query,
    groups: grouped.filter((entry) => entry.hits.length > 0),
    total,
  };
}
