import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { InterviewCard } from "@/components/interviews/interview-card";
import { InterviewFilters } from "@/components/interviews/interview-filters";
import { InterviewSearch } from "@/components/interviews/interview-search";
import { filtersToQueryString, parseInterviewFilters, toInterviewFilters } from "@/lib/interviews/filters";
import { getInterviewFilterOptions, getInterviews } from "@/lib/interviews/queries";

export const metadata: Metadata = {
  title: "Interviews",
  description: "Real Embodied AI interview experiences, organised by company and year.",
};

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseInterviewFilters(await searchParams);
  const [interviews, options] = await Promise.all([
    getInterviews({ filters: toInterviewFilters(params), sort: params.sort, page: params.page }),
    getInterviewFilterOptions(),
  ]);

  return (
    <Container className="py-14">
      <PageHeader
        title="Interviews"
        description="Structured interview experiences, organized by company, role, and question."
      >
        <InterviewSearch params={params} />
      </PageHeader>

      <section className="mt-8 flex flex-col gap-6">
        <InterviewFilters options={options} params={params} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-ink text-lg font-semibold tracking-[-0.01em]">Interview experiences</h2>
          <p className="text-ink-tertiary text-sm">{interviews.total} result{interviews.total === 1 ? "" : "s"}</p>
        </div>

        {interviews.items.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title={interviews.total === 0 ? "No interviews match these filters" : "No interviews on this page"}
            description="Clear a filter or try a different company, role, year, season, or search term."
            action={params.page > 1 || Object.values(params).some((value) => value && value !== "latest" && value !== 1) ? <Link href="/interviews" className="text-accent hover:text-accent-hover text-sm font-medium">Clear filters</Link> : undefined}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interviews.items.map((interview) => <li key={interview.id}><InterviewCard interview={interview} /></li>)}
          </ul>
        )}
        <Pagination page={interviews.page} totalPages={interviews.totalPages} makeHref={(page) => `/interviews${filtersToQueryString(params, { page })}`} />
      </section>
    </Container>
  );
}
