import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompanyHeader } from "@/components/companies/company-header";
import { CompanyRecentInterviews, CompanyRoleBreakdown } from "@/components/companies/company-sections";
import { CompanyDifficulty, CompanyInterviewEmphasis, RoundTypeDistribution, SeasonComparison, TypicalStructure } from "@/components/companies/company-insights";
import { CompanyTrendingQuestions, RecentChanges, TopCodingProblems, TopKnowledgeQuestions, TopTopics } from "@/components/companies/ranked-lists";
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: "Company not found" };
  return {
    title: `${company.name} Embodied AI Interview Guide — RoboPrep`,
    description: `What published ${company.name} interview records cover: roles, topics, questions, coding problems, and difficulty.`,
    alternates: { canonical: `/companies/${company.slug}` },
  };
}

/**
 * Task 18: company detail. Reading order prioritizes preparation (Task 59):
 * header → roles → topics → questions → coding → emphasis → structure →
 * difficulty → seasons → trends → recent → guide. Empty states never fake
 * data (Task 50).
 */
export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const [stats, positions, topics, questions, codingProblems, emphasis, structure, difficulty, roundTypes, seasons, recent] =
    await Promise.all([
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
      <Breadcrumbs items={[{ label: "Companies", href: "/companies" }, { label: company.name }]} />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <CompanyHeader company={company} stats={stats ?? { publishedInterviewCount: 0, positionCount: 0, latestInterviewAt: null }} />
        {hasData && (
          <div className="flex gap-2">
            <Link href={`/companies/${company.slug}/prepare`}>
              <Button size="sm">Preparation guide</Button>
            </Link>
            <Link href={`/interviews?company=${company.slug}`}>
              <Button size="sm" variant="secondary">All interviews</Button>
            </Link>
          </div>
        )}
      </div>

      {!hasData ? (
        <Card className="mt-8 p-8">
          <p className="text-ink font-medium">No published interview records yet.</p>
          <p className="text-ink-secondary mt-1 text-sm">
            Once interviews for {company.name} are reviewed and published, this page will show topics, questions,
            coding problems, and difficulty — always with the sample size they are based on.
          </p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Roles</h2>
            <div className="mt-3">
              <CompanyRoleBreakdown companyId={company.id} companySlug={company.slug} positions={positions} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Most asked topics</h2>
            <div className="mt-3">
              <TopTopics topics={topics} totalInterviews={totalInterviews} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Most asked knowledge questions</h2>
            <div className="mt-3">
              <TopKnowledgeQuestions questions={questions} totalInterviews={totalInterviews} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Most asked coding problems</h2>
            <div className="mt-3">
              <TopCodingProblems problems={codingProblems} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Interview emphasis</h2>
            <div className="mt-3">
              <CompanyInterviewEmphasis emphasis={emphasis} sampleSize={totalInterviews} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Interview structure</h2>
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
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Difficulty</h2>
            <div className="mt-3">
              <CompanyDifficulty difficulty={difficulty} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Season comparison</h2>
            <div className="mt-3">
              <SeasonComparison seasons={seasons} />
            </div>
          </Card>

          {isFeatureEnabled("company_trends") && (
          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Trends</h2>
            <div className="mt-3">
              <CompanyTrendingQuestions trends={trends} />
            </div>
          </Card>
          )}

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Recent changes</h2>
            <div className="mt-3">
              {changes.length > 0 ? (
                <RecentChanges statements={changes} />
              ) : (
                <p className="text-ink-tertiary text-sm">No material changes between recent seasons yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Recent interviews</h2>
              <Link href={`/interviews?company=${company.slug}`} className="text-accent hover:text-accent-hover text-sm font-medium">
                View all →
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
