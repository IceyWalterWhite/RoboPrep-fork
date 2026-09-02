import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  CompanyDifficulty,
  CompanyInterviewEmphasis,
  SeasonComparison,
} from "@/components/companies/company-insights";
import { CompanyPreparationGuideView } from "@/components/companies/company-sections";
import {
  TopCodingProblems,
  TopKnowledgeQuestions,
  TopTopics,
} from "@/components/companies/ranked-lists";
import { SampleSizeNote } from "@/components/companies/sample-size-note";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildPreparationGuide } from "@/lib/companies/intelligence";
import { roleUsesFallback } from "@/lib/companies/helpers";
import {
  getCompanyBySlug,
  getRoleIntelligence,
  getCompanyTypicalStructure,
  getCompanyStats,
} from "@/lib/companies/queries";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string; positionSlug: string }>;
}): Promise<Metadata> {
  const { companySlug, positionSlug } = await params;
  const [company, role] = await resolveRole(companySlug, positionSlug);
  if (!company || !role) return { title: "未找到岗位" };
  return {
    title: `${company.name} ${role.title} 面试指南 — RoboPrep`,
    description: `了解 ${company.name} ${role.title} 已发布面试记录覆盖的主题、问题和 Coding 重点。`,
    alternates: { canonical: `/companies/${company.slug}/roles/${positionSlug}` },
  };
}

/**
 * Task 21: role-specific company page. The position must belong to the
 * company — any other combination 404s. Role-scoped stats reuse the same
 * intelligence components (Task 22) and the guide falls back to company-wide
 * stats explicitly labeled (Task 44).
 */
export default async function CompanyRolePage({
  params,
}: {
  params: Promise<{ companySlug: string; positionSlug: string }>;
}) {
  const { companySlug, positionSlug } = await params;
  const [company, role] = await resolveRole(companySlug, positionSlug);
  if (!company || !role) notFound();

  const roleData = await getRoleIntelligence(company.id, role.id);
  const structure = await getCompanyTypicalStructure(company.id);
  const companyStats = await getCompanyStats(company.id);
  const fallback = roleUsesFallback(roleData.interviewCount);

  // Role guide: role relevance comes from the role's own topic share.
  const guide = buildPreparationGuide({
    topics: fallback
      ? await (
          await import("@/lib/companies/queries")
        ).getCompanyTopTopics(company.id, 12)
      : roleData.topics,
    questions: fallback
      ? await (
          await import("@/lib/companies/queries")
        ).getCompanyTopQuestions(company.id, 12)
      : roleData.questions,
    codingProblems: fallback
      ? await (
          await import("@/lib/companies/queries")
        ).getCompanyTopCodingProblems(company.id, 12)
      : roleData.codingProblems,
    structure,
    publishedInterviewCount: fallback
      ? (companyStats?.publishedInterviewCount ?? 0)
      : roleData.interviewCount,
    roleRelevance: new Map(
      roleData.topics.map((topic) => [topic.topicId, topic.shareOfInterviews ?? 0]),
    ),
  });

  return (
    <Container width="wide" className="py-10 sm:py-14">
      <Breadcrumbs
        items={[
          { label: "公司", href: "/companies" },
          { label: company.name, href: `/companies/${company.slug}` },
          { label: role.title },
        ]}
      />

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">
            {company.name} · {role.title}
          </h1>
          <p className="text-ink-secondary mt-1 text-sm">
            {roleData.interviewCount === 1
              ? "基于 1 条已发布面试记录"
              : `基于 ${roleData.interviewCount} 条已发布面试记录`}
          </p>
          <SampleSizeNote sampleSize={roleData.interviewCount} className="mt-1" />
        </div>
        <Link href={`/companies/${company.slug}/prepare`}>
          <Button size="sm" variant="secondary">
            公司整体指南
          </Button>
        </Link>
      </header>

      {roleData.interviewCount === 0 ? (
        <Card className="mt-8 p-8">
          <p className="text-ink font-medium">该岗位暂时还没有已发布的面试记录。</p>
          <p className="text-ink-secondary mt-1 text-sm">
            查看{" "}
            <Link
              href={`/companies/${company.slug}`}
              className="text-accent hover:text-accent-hover"
            >
              公司整体页面
            </Link>{" "}
            ，了解目前已发布的全部内容。
          </p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              高频主题
            </h2>
            <div className="mt-3">
              <TopTopics
                topics={roleData.topics}
                totalInterviews={roleData.interviewCount}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              高频知识题
            </h2>
            <div className="mt-3">
              <TopKnowledgeQuestions
                questions={roleData.questions}
                totalInterviews={roleData.interviewCount}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              Coding 题
            </h2>
            <div className="mt-3">
              <TopCodingProblems problems={roleData.codingProblems} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              面试重点
            </h2>
            <div className="mt-3">
              <CompanyInterviewEmphasis
                emphasis={{
                  knowledgeOccurrences: roleData.knowledgeOccurrences,
                  codingOccurrences: roleData.codingOccurrences,
                  unclassifiedOccurrences:
                    roleData.totalOccurrences -
                    roleData.knowledgeOccurrences -
                    roleData.codingOccurrences,
                  totalOccurrences: roleData.totalOccurrences,
                }}
                sampleSize={roleData.interviewCount}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              难度
            </h2>
            <div className="mt-3">
              <CompanyDifficulty difficulty={roleData.difficulty} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              季节
            </h2>
            <div className="mt-3">
              <SeasonComparison seasons={roleData.seasons} />
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
              准备指南
            </h2>
            <div className="mt-3">
              <CompanyPreparationGuideView
                guide={guide}
                companySlug={company.slug}
                fallbackNote={
                  fallback
                    ? "该岗位的数据有限，下面的指南使用公司整体统计数据。"
                    : undefined
                }
              />
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}

interface ResolvedCompany {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  country: string | null;
}

interface ResolvedPosition {
  id: string;
  title: string;
  slug: string;
}

async function resolveRole(
  companySlug: string,
  positionSlug: string,
): Promise<[ResolvedCompany | null, ResolvedPosition | null]> {
  const company = await getCompanyBySlug(companySlug);
  if (!company) return [null, null];
  const supabase = await createClient();
  const { data: position } = await supabase
    .from("positions")
    .select("id, title, slug, company_id")
    .eq("slug", positionSlug)
    .eq("company_id", company.id)
    .maybeSingle();
  return [company, position ?? null];
}
