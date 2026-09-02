import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { CompanyCard } from "@/components/companies/company-card";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  companyFiltersToQueryString,
  parseCompanyFilters,
} from "@/lib/companies/filters";
import { getCompanyDirectory } from "@/lib/companies/queries";

export const metadata: Metadata = {
  title: "具身智能面试公司 — RoboPrep",
  description: "浏览招聘具身智能岗位的公司，了解其已发布面试记录覆盖的内容。",
};

const DIRECTORY_FILTERS = [
  { key: "", label: "全部" },
  { key: "has_interviews", label: "有面试记录" },
  { key: "has_coding", label: "有 Coding 记录" },
  { key: "recent", label: "近期活跃" },
] as const;

/**
 * Task 14: company directory; Task 15: URL-driven case-insensitive search;
 * Task 16: real-data filters. Filter semantics are explicit (Task 75):
 * "recently active" = published interview record within the last 180 days.
 * No prestige ranking anywhere.
 */
export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseCompanyFilters(await searchParams);
  const companies = await getCompanyDirectory({
    q: params.q,
    hasInterviews: params.filter === "has_interviews",
    hasCoding: params.filter === "has_coding",
    recentActivity: params.filter === "recent",
  });

  return (
    <Container className="py-14">
      <PageHeader
        title="公司"
        description="根据已发布的面试记录，逐家公司准备具身智能面试。"
      >
        <form
          action="/companies"
          method="get"
          role="search"
          className="w-full max-w-sm"
        >
          {params.filter && <input type="hidden" name="filter" value={params.filter} />}
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="搜索公司…"
            aria-label="搜索公司"
          />
        </form>
      </PageHeader>

      <nav
        className="border-line-subtle mt-6 flex flex-wrap gap-2 border-b pb-3"
        aria-label="公司目录筛选"
      >
        {DIRECTORY_FILTERS.map((filter) => {
          const active = (params.filter ?? "") === filter.key;
          const href = filter.key
            ? `/companies${companyFiltersToQueryString(params, { filter: filter.key })}`
            : "/companies";
          return (
            <Link
              key={filter.key || "all"}
              href={href}
              className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "text-ink-secondary hover:bg-surface-sunken hover:text-ink"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          className="mt-10"
          title={params.q ? `没有匹配“${params.q}”的公司` : "暂时还没有公司"}
          description={
            params.q
              ? "请尝试其他名称，或清除搜索条件。"
              : "运行 `supabase db reset` 以加载开发示例数据。"
          }
        />
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <li key={company.id}>
              <CompanyCard
                company={{
                  id: company.id,
                  name: company.name,
                  slug: company.slug,
                  description: company.description,
                  country: company.country,
                  interviewCount: company.interviewCount,
                  positionCount: company.positionCount,
                  latestInterviewAt: company.latestInterviewAt,
                  topTopics: [],
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
