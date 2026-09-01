import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCompanyBySlug } from "@/lib/companies/queries";
import { normalizeSeason } from "@/lib/companies/helpers";

export const metadata: Metadata = {
  title: "Company data quality",
  robots: { index: false, follow: false },
};

/**
 * Task 61: read-only data-quality view (admin-guarded by the /admin layout).
 * Task 64: the internal confidence score is 0–1, admin-only.
 */
export default async function CompanyQualityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const supabase = await createClient();
  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, position_id, year, season, source_type, verified_at, difficulty_overall")
    .eq("company_id", company.id)
    .eq("status", "published");
  const rows = interviews ?? [];
  const interviewIds = rows.map((row) => row.id);

  const { data: occurrences } = interviewIds.length
    ? await supabase.from("interview_questions").select("interview_id, question_id, coding_problem_id").in("interview_id", interviewIds)
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
  const positionsCovered = new Set(rows.map((row) => row.position_id).filter(Boolean)).size;
  const seasonsCovered = new Set(
    rows.filter((row) => row.year !== null && normalizeSeason(row.season)).map((row) => `${row.year}:${normalizeSeason(row.season)}`),
  ).size;

  // Task 64: internal confidence score — sample size, canonical-link coverage,
  // source mix, season and role coverage. Not exposed publicly.
  const sampleScore = Math.min(1, rows.length / 10);
  const linkCoverage = totalOccurrences > 0 ? (linkedKnowledge + linkedCoding) / totalOccurrences : 0;
  const seasonScore = Math.min(1, seasonsCovered / 3);
  const roleScore = positionsCovered > 0 ? 1 : 0;
  const confidenceScore = rows.length > 0
    ? Math.round(((sampleScore * 0.35 + linkCoverage * 0.3 + seasonScore * 0.2 + roleScore * 0.15) * 100)) / 100
    : null;

  return (
    <Container width="wide" className="py-10">
      <Breadcrumbs
        items={[
          { label: "Companies", href: "/companies" },
          { label: company.name, href: `/companies/${company.slug}` },
          { label: "Data quality" },
        ]}
      />

      <header className="mt-6">
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">{company.name} — data quality</h1>
        <p className="text-ink-tertiary mt-1 text-sm">
          Internal analytics-quality snapshot. Admin-only; not shown on public pages.
        </p>
      </header>

      <Card className="mt-6 p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <QualityItem label="Published interviews" value={String(rows.length)} />
          <QualityItem
            label="Unlinked occurrence rate"
            value={totalOccurrences > 0 ? `${Math.round((unlinked / totalOccurrences) * 100)}%` : "—"}
          />
          <QualityItem label="Linked knowledge occurrences" value={String(linkedKnowledge)} />
          <QualityItem label="Linked coding occurrences" value={String(linkedCoding)} />
          <QualityItem label="Roles covered" value={String(positionsCovered)} />
          <QualityItem label="Seasons covered" value={String(seasonsCovered)} />
          <QualityItem label="Reviewed (verified_at set)" value={`${reviewedCount} of ${rows.length}`} />
          <QualityItem
            label="Internal confidence score"
            value={confidenceScore !== null ? confidenceScore.toFixed(2) : "—"}
          />
        </dl>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Source mix</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {[...sourceMix.entries()].map(([source, count]) => (
            <li key={source} className="text-ink-secondary flex justify-between">
              <span>{source}</span>
              <span className="tabular-nums">{count}</span>
            </li>
          ))}
          {sourceMix.size === 0 && <li className="text-ink-tertiary">No published interviews.</li>}
        </ul>
      </Card>

      <p className="mt-4 text-sm">
        <Link href={`/companies/${company.slug}`} className="text-accent hover:text-accent-hover">
          ← Back to company page
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
