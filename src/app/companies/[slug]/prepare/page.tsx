import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  CompanyTrendingQuestions,
  TopCodingProblems,
  TopKnowledgeQuestions,
  TopTopics,
} from "@/components/companies/ranked-lists";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { classifyTrends } from "@/lib/companies/intelligence";
import {
  getCompanyBySlug,
  getCompanyStats,
  getCompanyTopCodingProblems,
  getCompanyTopQuestions,
  getCompanyTopTopics,
} from "@/lib/companies/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: "未找到公司" };
  return {
    title: `${company.name} 准备指南 — RoboPrep`,
    description: `根据已发布面试记录，为 ${company.name} 面试整理的排序学习清单。`,
    alternates: { canonical: `/companies/${company.slug}/prepare` },
  };
}

/**
 * Task 45: suggested study set route — reuses the intelligence components and
 * links into real Knowledge/Coding content. No duplicate content tables.
 */
export default async function CompanyPreparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const [stats, topics, questions, codingProblems] = await Promise.all([
    getCompanyStats(company.id),
    getCompanyTopTopics(company.id, 8),
    getCompanyTopQuestions(company.id, 8),
    getCompanyTopCodingProblems(company.id, 8),
  ]);
  const totalInterviews = stats?.publishedInterviewCount ?? 0;
  const guide = {
    mustStudyTopics: topics,
    mustStudyQuestions: questions,
    recommendedCodingProblems: codingProblems,
    trends: classifyTrends({ topics, questions, codingProblems }),
  };

  return (
    <Container width="wide" className="py-10 sm:py-14">
      <Breadcrumbs
        items={[
          { label: "公司", href: "/companies" },
          { label: company.name, href: `/companies/${company.slug}` },
          { label: "准备指南" },
        ]}
      />

      <header className="mt-6">
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">
          {company.name} 学习清单
        </h1>
        <p className="text-ink-secondary mt-1 max-w-2xl text-sm leading-relaxed">
          按主题和问题在 {company.name} 已发布面试记录中的出现频率排序。
          {totalInterviews > 0 ? ` 当前共 ${totalInterviews} 条记录。` : ""}
        </p>
      </header>

      {totalInterviews === 0 ? (
        <Card className="mt-8 p-8">
          <p className="text-ink font-medium">暂时还没有已发布的面试记录。</p>
          <p className="text-ink-secondary mt-1 text-sm">
            面试通过审核并发布后，学习清单会显示在这里。{" "}
            <Link
              href={`/companies/${company.slug}`}
              className="text-accent hover:text-accent-hover"
            >
              返回公司页面
            </Link>
          </p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              核心主题
            </h2>
            <div className="mt-3">
              <TopTopics
                topics={guide.mustStudyTopics}
                totalInterviews={totalInterviews}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              高频知识题
            </h2>
            <div className="mt-3">
              <TopKnowledgeQuestions
                questions={guide.mustStudyQuestions}
                totalInterviews={totalInterviews}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              推荐 Coding 题
            </h2>
            <div className="mt-3">
              <TopCodingProblems problems={guide.recommendedCodingProblems} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              近期趋势
            </h2>
            <div className="mt-3">
              <CompanyTrendingQuestions trends={guide.trends} />
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
