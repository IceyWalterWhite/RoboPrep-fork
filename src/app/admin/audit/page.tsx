import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { requireReviewer } from "@/lib/auth/reviewer";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Ingestion audit log",
  robots: { index: false, follow: false },
};

/**
 * Week 8 Task 66: ingestion event audit viewer — publish/reject/reparse/
 * retry/canonical decisions, newest first. Admin-guarded; read-only.
 */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const viewer = await requireReviewer();
  if (!viewer) notFound();
  const admin = createAdminClient();
  if (!admin) notFound();
  void viewer;

  const { type } = await searchParams;
  let query = admin
    .from("ingestion_events")
    .select("id, submission_id, job_id, event_type, message, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (type) query = query.eq("event_type", type);

  const { data: events } = await query;
  const eventTypes = [...new Set((events ?? []).map((event) => event.event_type))];

  return (
    <Container width="wide" className="py-10">
      <header>
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">Audit log</h1>
        <p className="text-ink-tertiary mt-1 text-sm">Latest 100 ingestion events, newest first.</p>
      </header>

      <nav className="border-line-subtle mt-4 flex flex-wrap gap-2 border-b pb-3" aria-label="Event type filter">
        <a
          href="/admin/audit"
          className={`rounded-sm px-3 py-1.5 text-sm font-medium ${!type ? "bg-accent text-white" : "text-ink-secondary hover:bg-surface-sunken"}`}
        >
          All
        </a>
        {eventTypes.map((eventType) => (
          <a
            key={eventType}
            href={`/admin/audit?type=${eventType}`}
            className={`rounded-sm px-3 py-1.5 text-sm font-medium ${type === eventType ? "bg-accent text-white" : "text-ink-secondary hover:bg-surface-sunken"}`}
          >
            {eventType}
          </a>
        ))}
      </nav>

      <Card className="mt-4 p-5">
        <table className="text-ink w-full text-sm">
          <thead>
            <tr className="text-ink-tertiary border-line-subtle border-b text-left text-xs">
              <th scope="col" className="py-1.5 pr-3 font-medium">Time</th>
              <th scope="col" className="py-1.5 pr-3 font-medium">Event</th>
              <th scope="col" className="py-1.5 pr-3 font-medium">Message</th>
              <th scope="col" className="py-1.5 font-medium">Submission</th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((event) => (
              <tr key={event.id} className="border-line-subtle border-b last:border-0">
                <td className="text-ink-tertiary py-1.5 pr-3 text-xs tabular-nums">{new Date(event.created_at).toLocaleString()}</td>
                <td className="text-ink py-1.5 pr-3 font-medium">{event.event_type}</td>
                <td className="text-ink-secondary py-1.5 pr-3">{event.message ?? "—"}</td>
                <td className="py-1.5">
                  <a href={`/admin/interviews/review/${event.submission_id}`} className="text-accent hover:text-accent-hover text-xs">
                    open
                  </a>
                </td>
              </tr>
            ))}
            {(events ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="text-ink-tertiary py-3">No events.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </Container>
  );
}
