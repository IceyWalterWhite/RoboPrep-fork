import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCompanyBySlug } from "@/lib/companies/queries";
import { normalizeSeason } from "@/lib/companies/helpers";
import { SOURCE_TYPE_LABELS } from "@/lib/interviews/constants";
import { displayEnum } from "@/lib/interviews/helpers";

export const metadata: Metadata = {
  title: "公司数据质量",
  robots: { index: false, follow: false },
};

/**
 * Task 61: read-only data-quality view (admin-guarded by the /admin layout).
 * Task 64: the internal confidence score is 0–1, admin-only.
 */
export default async function CompanyQualityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const supabase = await createClient();
  const { data: interviews } = await supabase
    .from("interviews")
    .select(
      "id, position_id, year, season, source_type, verified_at, difficulty_overall",
    )
    .eq("company_id", company.id)
    .eq("status", "published");
  const rows = interviews ?? [];
  const interviewIds = rows.map((row) => row.id);

  const { data: occurrences } = interviewIds.length
    ? await supabase
        .from("interview_questions")
        .select("interview_id, question_id, coding_problem_id")
        .in("interview_id", interviewIds)
    : { data: [] };

  let linkedKnowledge = 0;
  let linkedCoding = 0;
  let unlinked = 0;
  for (const row of occurrences ?? []) {
    if (row.coding_problem_id) linkedCoding += 1;
    else if (row.question_id) linkedKnowledge += 1;
    else unlinked += 1;
  }
  const totalOccurrences = linkedKnowledge + linkedCoding + unlinked;

  const sourceMix = new Map<string, number>();
  for (const row of rows) {
    const source = row.source_type ?? "unknown";
    sourceMix.set(source, (sourceMix.get(source) ?? 0) + 1);
  }
  const reviewedCount = rows.filter((row) => row.verified_at !== null).length;
  const positionsCovered = new Set(rows.map((row) => row.position_id).filter(Boolean))
    .size;
  const seasonsCovered = new Set(
    rows
      .filter((row) => row.year !== null && normalizeSeason(row.season))
      .map((row) => `${row.year}:${normalizeSeason(row.season)}`),
  ).size;

  // Task 64: internal confidence score — sample size, canonical-link coverage,
  // source mix, season and role coverage. Not exposed publicly.
  const sampleScore = Math.min(1, rows.length / 10);
  const linkCoverage =
    totalOccurrences > 0 ? (linkedKnowledge + linkedCoding) / totalOccurrences : 0;
  const seasonScore = Math.min(1, seasonsCovered / 3);
  const roleScore = positionsCovered > 0 ? 1 : 0;
  const confidenceScore =
    rows.length > 0
      ? Math.round(
          (sampleScore * 0.35 +
            linkCoverage * 0.3 +
            seasonScore * 0.2 +
            roleScore * 0.15) *
            100,
        ) / 100
      : null;

  return (
    <Container width="wide" className="py-10">
      <Breadcrumbs
        items={[
          { label: "公司", href: "/companies" },
          { label: company.name, href: `/companies/${company.slug}` },
          { label: "数据质量" },
        ]}
      />

      <header className="mt-6">
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">
          {company.name} — 数据质量
        </h1>
        <p className="text-ink-tertiary mt-1 text-sm">
          内部分析质量快照，仅管理员可见，不会展示在公开页面。
        </p>
      </header>

      <Card className="mt-6 p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <QualityItem label="已发布面经" value={String(rows.length)} />
          <QualityItem
            label="未关联记录占比"
            value={
              totalOccurrences > 0
                ? `${Math.round((unlinked / totalOccurrences) * 100)}%`
                : "—"
            }
          />
          <QualityItem label="已关联知识库记录" value={String(linkedKnowledge)} />
          <QualityItem label="已关联 Coding 记录" value={String(linkedCoding)} />
          <QualityItem label="覆盖岗位数" value={String(positionsCovered)} />
          <QualityItem label="覆盖季节数" value={String(seasonsCovered)} />
          <QualityItem
            label="已审核（已设置 verified_at）"
            value={`${reviewedCount} / ${rows.length}`}
          />
          <QualityItem
            label="内部置信度分数"
            value={confidenceScore !== null ? confidenceScore.toFixed(2) : "—"}
          />
        </dl>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
          来源构成
        </h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {[...sourceMix.entries()].map(([source, count]) => (
            <li key={source} className="text-ink-secondary flex justify-between">
              <span>
                {SOURCE_TYPE_LABELS[source] ?? displayEnum(source) ?? "未知来源"}
              </span>
              <span className="tabular-nums">{count}</span>
            </li>
          ))}
          {sourceMix.size === 0 && (
            <li className="text-ink-tertiary">暂无已发布面经。</li>
          )}
        </ul>
      </Card>

      <p className="mt-4 text-sm">
        <Link
          href={`/companies/${company.slug}`}
          className="text-accent hover:text-accent-hover"
        >
          ← 返回公司页面
        </Link>
      </p>
    </Container>
  );
}

function QualityItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-tertiary text-xs tracking-wide uppercase">{label}</dt>
      <dd className="text-ink mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
