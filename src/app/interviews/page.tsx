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
import {
  filtersToQueryString,
  parseInterviewFilters,
  toInterviewFilters,
} from "@/lib/interviews/filters";
import { getInterviewFilterOptions, getInterviews } from "@/lib/interviews/queries";

export const metadata: Metadata = {
  title: "面试",
  description: "按公司和年份整理的真实具身智能面试经历。",
};

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseInterviewFilters(await searchParams);
  const [interviews, options] = await Promise.all([
    getInterviews({
      filters: toInterviewFilters(params),
      sort: params.sort,
      page: params.page,
    }),
    getInterviewFilterOptions(),
  ]);

  return (
    <Container className="py-14">
      <PageHeader title="面试" description="按公司、岗位和问题整理的结构化面试经历。">
        <InterviewSearch params={params} />
      </PageHeader>

      <section className="mt-8 flex flex-col gap-6">
        <InterviewFilters options={options} params={params} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-ink text-lg font-semibold tracking-[-0.01em]">
            面试经历
          </h2>
          <p className="text-ink-tertiary text-sm">共 {interviews.total} 条结果</p>
        </div>

        {interviews.items.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title={
              interviews.total === 0 ? "没有符合筛选条件的面试" : "这一页暂时没有面试"
            }
            description="清除筛选条件，或尝试其他公司、岗位、年份、季节或搜索词。"
            action={
              params.page > 1 ||
              Object.values(params).some(
                (value) => value && value !== "latest" && value !== 1,
              ) ? (
                <Link
                  href="/interviews"
                  className="text-accent hover:text-accent-hover text-sm font-medium"
                >
                  清除筛选
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interviews.items.map((interview) => (
              <li key={interview.id}>
                <InterviewCard interview={interview} />
              </li>
            ))}
          </ul>
        )}
        <Pagination
          page={interviews.page}
          totalPages={interviews.totalPages}
          makeHref={(page) => `/interviews${filtersToQueryString(params, { page })}`}
        />
      </section>
    </Container>
  );
}
