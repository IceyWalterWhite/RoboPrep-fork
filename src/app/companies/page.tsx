import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { CompanyCard } from "@/components/companies/company-card";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { companyFiltersToQueryString, parseCompanyFilters } from "@/lib/companies/filters";
import { getCompanyDirectory } from "@/lib/companies/queries";

export const metadata: Metadata = {
  title: "Embodied AI Interview Companies — RoboPrep",
  description: "Browse companies hiring for Embodied AI roles and see what their published interview records cover.",
};

const DIRECTORY_FILTERS = [
  { key: "", label: "All" },
  { key: "has_interviews", label: "Has interviews" },
  { key: "has_coding", label: "Has coding evidence" },
  { key: "recent", label: "Recently active" },
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
        title="Companies"
        description="Prepare for Embodied AI interviews company by company, based on published interview records."
      >
        <form action="/companies" method="get" role="search" className="w-full max-w-sm">
          {params.filter && <input type="hidden" name="filter" value={params.filter} />}
          <Input name="q" defaultValue={params.q ?? ""} placeholder="Search companies…" aria-label="Search companies" />
        </form>
      </PageHeader>

      <nav className="border-line-subtle mt-6 flex flex-wrap gap-2 border-b pb-3" aria-label="Directory filters">
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
                active ? "bg-accent text-white" : "text-ink-secondary hover:bg-surface-sunken hover:text-ink"
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
          title={params.q ? `No companies match “${params.q}”` : "No companies yet"}
          description={params.q ? "Try a different name or clear the search." : "Run `supabase db reset` to load the development seed."}
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
