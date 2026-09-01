import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompanyTrendingQuestions, TopCodingProblems, TopKnowledgeQuestions, TopTopics } from "@/components/companies/ranked-lists";
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: "Company not found" };
  return {
    title: `${company.name} Preparation Guide — RoboPrep`,
    description: `A ranked study set for ${company.name} interviews, derived from published interview records.`,
    alternates: { canonical: `/companies/${company.slug}/prepare` },
  };
}

/**
 * Task 45: suggested study set route — reuses the intelligence components and
 * links into real Knowledge/Coding content. No duplicate content tables.
 */
export default async function CompanyPreparePage({ params }: { params: Promise<{ slug: string }> }) {
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
          { label: "Companies", href: "/companies" },
          { label: company.name, href: `/companies/${company.slug}` },
          { label: "Prepare" },
        ]}
      />

      <header className="mt-6">
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">{company.name} study set</h1>
        <p className="text-ink-secondary mt-1 max-w-2xl text-sm leading-relaxed">
          Ranked by how often each topic and question appeared in published {company.name} interview records.
          {totalInterviews > 0 ? ` Currently ${totalInterviews} record${totalInterviews === 1 ? "" : "s"}.` : ""}
        </p>
      </header>

      {totalInterviews === 0 ? (
        <Card className="mt-8 p-8">
          <p className="text-ink font-medium">No published interview records yet.</p>
          <p className="text-ink-secondary mt-1 text-sm">
            The study set appears once interviews are reviewed and published.{" "}
            <Link href={`/companies/${company.slug}`} className="text-accent hover:text-accent-hover">
              Back to company page
            </Link>
          </p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Core topics</h2>
            <div className="mt-3">
              <TopTopics topics={guide.mustStudyTopics} totalInterviews={totalInterviews} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Top knowledge questions</h2>
            <div className="mt-3">
              <TopKnowledgeQuestions questions={guide.mustStudyQuestions} totalInterviews={totalInterviews} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Recommended coding problems</h2>
            <div className="mt-3">
              <TopCodingProblems problems={guide.recommendedCodingProblems} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Recent trends</h2>
            <div className="mt-3">
              <CompanyTrendingQuestions trends={guide.trends} />
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
