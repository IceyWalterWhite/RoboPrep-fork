import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompanyHeader } from "@/components/companies/company-header";
import {
  CompanyRecentInterviews,
  CompanyRoleBreakdown,
} from "@/components/companies/company-sections";
import {
  CompanyDifficulty,
  CompanyInterviewEmphasis,
  RoundTypeDistribution,
  SeasonComparison,
  TypicalStructure,
} from "@/components/companies/company-insights";
import {
  CompanyTrendingQuestions,
  RecentChanges,
  TopCodingProblems,
  TopKnowledgeQuestions,
  TopTopics,
} from "@/components/companies/ranked-lists";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { classifyTrends, recentChanges } from "@/lib/companies/intelligence";
import {
  getCompanyBySlug,
  getCompanyDifficultyStats,
  getCompanyEmphasis,
  getCompanyPositions,
  getCompanyRecentInterviews,
  getCompanyRoundTypeStats,
  getCompanySeasonStats,
  getCompanyStats,
  getCompanyTopCodingProblems,
  getCompanyTopQuestions,
  getCompanyTopTopics,
  getCompanyTypicalStructure,
} from "@/lib/companies/queries";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: "未找到公司" };
  return {
    title: `${company.name} 具身智能面试指南 — RoboPrep`,
    description: `了解 ${company.name} 已发布面试记录覆盖的岗位、主题、问题、Coding 题和难度。`,
    alternates: { canonical: `/companies/${company.slug}` },
  };
}

/**
 * Task 18: company detail. Reading order prioritizes preparation (Task 59):
 * header → roles → topics → questions → coding → emphasis → structure →
 * difficulty → seasons → trends → recent → guide. Empty states never fake
 * data (Task 50).
 */
export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const [
    stats,
    positions,
    topics,
    questions,
    codingProblems,
    emphasis,
    structure,
    difficulty,
    roundTypes,
    seasons,
    recent,
  ] = await Promise.all([
    getCompanyStats(company.id),
    getCompanyPositions(company.id),
    getCompanyTopTopics(company.id, 8),
    getCompanyTopQuestions(company.id, 8),
    getCompanyTopCodingProblems(company.id, 8),
    getCompanyEmphasis(company.id),
    getCompanyTypicalStructure(company.id),
    getCompanyDifficultyStats(company.id),
    getCompanyRoundTypeStats(company.id),
    getCompanySeasonStats(company.id),
    getCompanyRecentInterviews(company.id, 8),
  ]);

  const trends = classifyTrends({ topics, questions, codingProblems });
  const changes = recentChanges({
    risingTopics: topics.filter((topic) => topic.trendScore > 0),
    seasonStats: seasons,
  });
  const totalInterviews = stats?.publishedInterviewCount ?? 0;
  const hasData = totalInterviews > 0;

  return (
    <Container width="wide" className="py-10 sm:py-14">
      <Breadcrumbs
        items={[{ label: "公司", href: "/companies" }, { label: company.name }]}
      />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <CompanyHeader
          company={company}
          stats={
            stats ?? {
              publishedInterviewCount: 0,
              positionCount: 0,
              latestInterviewAt: null,
            }
          }
        />
        {hasData && (
          <div className="flex gap-2">
            <Link href={`/companies/${company.slug}/prepare`}>
              <Button size="sm">准备指南</Button>
            </Link>
            <Link href={`/interviews?company=${company.slug}`}>
              <Button size="sm" variant="secondary">
                全部面试
              </Button>
            </Link>
          </div>
        )}
      </div>

      {!hasData ? (
        <Card className="mt-8 p-8">
          <p className="text-ink font-medium">暂时还没有已发布的面试记录。</p>
          <p className="text-ink-secondary mt-1 text-sm">
            {company.name} 的面试通过审核并发布后，这里会展示主题、问题、Coding
            题和难度，并始终标注统计所依据的样本量。
          </p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              岗位
            </h2>
            <div className="mt-3">
              <CompanyRoleBreakdown
                companyId={company.id}
                companySlug={company.slug}
                positions={positions}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              高频主题
            </h2>
            <div className="mt-3">
              <TopTopics topics={topics} totalInterviews={totalInterviews} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              高频知识题
            </h2>
            <div className="mt-3">
              <TopKnowledgeQuestions
                questions={questions}
                totalInterviews={totalInterviews}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              高频 Coding 题
            </h2>
            <div className="mt-3">
              <TopCodingProblems problems={codingProblems} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              面试重点
            </h2>
            <div className="mt-3">
              <CompanyInterviewEmphasis
                emphasis={emphasis}
                sampleSize={totalInterviews}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              面试结构
            </h2>
            <div className="mt-3 flex flex-col gap-5">
              <TypicalStructure
                medianRoundCount={structure.medianRoundCount}
                medianQuestionCount={structure.medianQuestionCount}
                sampleSize={structure.sampleSize}
              />
              <RoundTypeDistribution roundTypes={roundTypes} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              难度
            </h2>
            <div className="mt-3">
              <CompanyDifficulty difficulty={difficulty} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              季节对比
            </h2>
            <div className="mt-3">
              <SeasonComparison seasons={seasons} />
            </div>
          </Card>

          {isFeatureEnabled("company_trends") && (
            <Card className="p-6">
              <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
                趋势
              </h2>
              <div className="mt-3">
                <CompanyTrendingQuestions trends={trends} />
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              近期变化
            </h2>
            <div className="mt-3">
              {changes.length > 0 ? (
                <RecentChanges statements={changes} />
              ) : (
                <p className="text-ink-tertiary text-sm">
                  近期季节之间暂时没有明显变化。
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
                最近面试
              </h2>
              <Link
                href={`/interviews?company=${company.slug}`}
                className="text-accent hover:text-accent-hover text-sm font-medium"
              >
                查看全部 →
              </Link>
            </div>
            <div className="mt-3">
              <CompanyRecentInterviews companySlug={company.slug} interviews={recent} />
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
