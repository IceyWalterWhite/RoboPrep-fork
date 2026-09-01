import type { Metadata } from "next";
import Link from "next/link";
import { Code2 } from "lucide-react";

import { CodingFilters } from "@/components/coding/coding-filters";
import { CodingProblemCard } from "@/components/coding/coding-problem-card";
import { CodingSearch } from "@/components/coding/coding-search";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { filtersToQueryString, parseCodingFilters, toCodingFilters } from "@/lib/coding/filters";
import { getCodingFilterOptions, getCodingProblems } from "@/lib/coding/queries";

export const metadata: Metadata = {
  title: "Coding",
  description: "LeetCode-style robotics and ML coding exercises for Embodied AI interviews.",
};

export default async function CodingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseCodingFilters(await searchParams);
  const [problems, options] = await Promise.all([
    getCodingProblems({ filters: toCodingFilters(params), sort: params.sort, page: params.page }),
    getCodingFilterOptions(),
  ]);

  return (
    <Container className="py-14">
      <PageHeader title="Coding" description="Practice Python problems built around robotics, ML, and embodied systems.">
        <CodingSearch params={params} />
      </PageHeader>

      <nav className="border-line-subtle mt-6 flex items-center gap-5 border-b" aria-label="Coding sections">
        <span className="text-accent border-accent border-b-2 pb-2 text-sm font-medium">Problems</span>
        <Link href="/coding/collections" className="text-ink-secondary hover:text-ink border-b-2 border-transparent pb-2 text-sm font-medium">Collections</Link>
        <Link href="/coding/progress" className="text-ink-secondary hover:text-ink border-b-2 border-transparent pb-2 text-sm font-medium">Progress</Link>
      </nav>

      <section className="mt-6 flex flex-col gap-6">
        <CodingFilters options={options} params={params} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-ink text-lg font-semibold tracking-[-0.01em]">Problem set</h2>
          <p className="text-ink-tertiary text-sm">{problems.total} problem{problems.total === 1 ? "" : "s"}</p>
        </div>

        {problems.items.length === 0 ? (
          <EmptyState
            icon={Code2}
            title={problems.total === 0 ? "No problems match these filters" : "No problems on this page"}
            description="Clear a filter or try a different topic, category, difficulty, or search term."
            action={params.page > 1 || hasFilters(params) ? <Link href="/coding" className="text-accent hover:text-accent-hover text-sm font-medium">Clear filters</Link> : undefined}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {problems.items.map((problem) => <li key={problem.id}><CodingProblemCard problem={problem} /></li>)}
          </ul>
        )}
        <Pagination
          page={problems.page}
          totalPages={problems.totalPages}
          makeHref={(page) => `/coding${filtersToQueryString(params, { page })}`}
        />
      </section>
    </Container>
  );
}

function hasFilters(params: ReturnType<typeof parseCodingFilters>): boolean {
  return Boolean(params.q || params.difficulty || params.category || params.topic || params.status || params.sort !== "recommended");
}
