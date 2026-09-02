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
import {
  filtersToQueryString,
  parseCodingFilters,
  toCodingFilters,
} from "@/lib/coding/filters";
import { getCodingFilterOptions, getCodingProblems } from "@/lib/coding/queries";

export const metadata: Metadata = {
  title: "Coding",
  description: "面向具身智能面试的 LeetCode 风格机器人和 ML Coding 练习。",
};

export default async function CodingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseCodingFilters(await searchParams);
  const [problems, options] = await Promise.all([
    getCodingProblems({
      filters: toCodingFilters(params),
      sort: params.sort,
      page: params.page,
    }),
    getCodingFilterOptions(),
  ]);

  return (
    <Container className="py-14">
      <PageHeader
        title="Coding"
        description="练习围绕机器人、ML 和具身系统设计的 Python 题目。"
      >
        <CodingSearch params={params} />
      </PageHeader>

      <nav
        className="border-line-subtle mt-6 flex items-center gap-5 border-b"
        aria-label="Coding 栏目"
      >
        <span className="text-accent border-accent border-b-2 pb-2 text-sm font-medium">
          题目
        </span>
        <Link
          href="/coding/collections"
          className="text-ink-secondary hover:text-ink border-b-2 border-transparent pb-2 text-sm font-medium"
        >
          题单
        </Link>
        <Link
          href="/coding/progress"
          className="text-ink-secondary hover:text-ink border-b-2 border-transparent pb-2 text-sm font-medium"
        >
          进度
        </Link>
      </nav>

      <section className="mt-6 flex flex-col gap-6">
        <CodingFilters options={options} params={params} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-ink text-lg font-semibold tracking-[-0.01em]">
            题目列表
          </h2>
          <p className="text-ink-tertiary text-sm">共 {problems.total} 道题</p>
        </div>

        {problems.items.length === 0 ? (
          <EmptyState
            icon={Code2}
            title={
              problems.total === 0 ? "没有符合筛选条件的题目" : "这一页暂时没有题目"
            }
            description="清除筛选条件，或尝试其他主题、类别、难度或搜索词。"
            action={
              params.page > 1 || hasFilters(params) ? (
                <Link
                  href="/coding"
                  className="text-accent hover:text-accent-hover text-sm font-medium"
                >
                  清除筛选
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {problems.items.map((problem) => (
              <li key={problem.id}>
                <CodingProblemCard problem={problem} />
              </li>
            ))}
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
  return Boolean(
    params.q ||
    params.difficulty ||
    params.category ||
    params.topic ||
    params.status ||
    params.sort !== "recommended",
  );
}
