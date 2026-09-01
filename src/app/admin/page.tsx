import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { describeFeatureFlags } from "@/lib/feature-flags";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireReviewer } from "@/lib/auth/reviewer";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin operations",
  robots: { index: false, follow: false },
};

/**
 * Week 8 Task 67: action-oriented admin operations home — open reviews,
 * failed/stuck jobs, stats freshness, judge/ingestion posture. Admin-guarded
 * by the /admin layout.
 */
export default async function AdminDashboardPage() {
  const viewer = await requireReviewer();
  if (!viewer) notFound();
  const admin = createAdminClient();
  if (!admin) notFound();

  const [openTasks, failedJobs, stuckJobs, published, statsFreshness, recentEvents] = await Promise.all([
    admin.from("review_tasks").select("id", { count: "exact" }).in("status", ["open", "in_review"]),
    admin.from("ingestion_jobs").select("id, submission_id, error_code", { count: "exact" }).eq("status", "failed").order("updated_at", { ascending: false }).limit(5),
    admin.from("ingestion_jobs").select("id", { count: "exact" }).eq("status", "running").lt("updated_at", staleCutoffIso()),
    admin.from("interviews").select("id", { count: "exact" }).eq("status", "published"),
    admin.from("company_stats").select("updated_at").order("updated_at", { ascending: false }).limit(1),
    admin.from("ingestion_events").select("id, event_type, message, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const statsUpdatedAt = statsFreshness.data?.[0]?.updated_at ?? null;
  const flags = describeFeatureFlags();

  return (
    <Container width="wide" className="py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">Operations</h1>
        <nav className="flex gap-3 text-sm">
          <Link href="/admin/interviews/review" className="text-accent hover:text-accent-hover font-medium">Review queue →</Link>
          <Link href="/admin/audit" className="text-accent hover:text-accent-hover font-medium">Audit log →</Link>
          <Link href="/admin/system" className="text-accent hover:text-accent-hover font-medium">System →</Link>
        </nav>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Open reviews"
          value={String(openTasks.count ?? 0)}
          href="/admin/interviews/review"
          attention={(openTasks.count ?? 0) > 0}
        />
        <MetricCard
          label="Failed parse jobs"
          value={String(failedJobs.count ?? 0)}
          href="/admin/interviews/review?filter=failed"
          attention={(failedJobs.count ?? 0) > 0}
        />
        <MetricCard
          label="Stuck jobs (>30 min running)"
          value={String(stuckJobs.count ?? 0)}
          href="/admin/audit"
          attention={(stuckJobs.count ?? 0) > 0}
        />
        <MetricCard label="Published interviews" value={String(published.count ?? 0)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Company stats freshness</h2>
          <p className="text-ink-secondary mt-2 text-sm">
            {statsUpdatedAt ? `Last refreshed ${new Date(statsUpdatedAt).toLocaleString()}.` : "Never refreshed — run pnpm refresh:companies after seeding."}
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Feature flags</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {flags.map((entry) => (
              <li key={entry.flag} className="text-ink-secondary flex justify-between">
                <span>{entry.flag}</span>
                <span className={entry.enabled ? "text-success-ink" : "text-warning-ink"}>
                  {entry.enabled ? "on" : "off"} ({entry.envKey})
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Recent events</h2>
          <ol className="mt-2 flex flex-col gap-1 text-xs">
            {(recentEvents.data ?? []).map((event) => (
              <li key={event.id} className="text-ink-secondary flex gap-2">
                <span className="text-ink-tertiary tabular-nums">{new Date(event.created_at).toLocaleString()}</span>
                <span className="text-ink font-medium">{event.event_type}</span>
                <span>{event.message}</span>
              </li>
            ))}
            {(recentEvents.data ?? []).length === 0 && <li className="text-ink-tertiary">No events yet.</li>}
          </ol>
        </Card>
      </div>
    </Container>
  );
}

/** Deterministic stuck-job cutoff (Task 98); computed outside render. */
function staleCutoffIso(): string {
  return new Date(Date.now() - 30 * 60_000).toISOString();
}

function MetricCard({ label, value, href, attention }: { label: string; value: string; href?: string; attention?: boolean }) {
  const body = (
    <Card className={`p-5 ${attention ? "border-warning" : ""}`}>
      <p className="text-ink-tertiary text-xs tracking-wide uppercase">{label}</p>
      <p className="text-ink mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
