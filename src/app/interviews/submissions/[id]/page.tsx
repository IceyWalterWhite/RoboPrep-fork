import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { USER_FACING_STATUS } from "@/lib/ingestion/constants";
import { getOwnSubmission } from "@/lib/ingestion/queries";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Submission status",
  description: "Status of your interview submission.",
};

/**
 * Submission confirmation/status page (Task 11). Users read only their own
 * submission (defense in depth: RLS + explicit ownership check). Internal
 * pipeline error details are mapped to friendly states (Task 42).
 */
export default async function SubmissionStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const admin = createAdminClient();
  if (!admin) notFound();

  const submission = await getOwnSubmission(admin, id, user.id).catch(() => null);
  if (!submission) notFound();

  const status = USER_FACING_STATUS[submission.status];

  return (
    <Container className="py-14">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">
            {submission.status === "submitted" ? "Submission received" : "Your submission"}
          </h1>
          <p className="text-ink-secondary text-sm leading-relaxed">
            Thank you for contributing to RoboPrep. Every submission is reviewed by a
            human before anything is published.
          </p>
        </header>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-ink-tertiary text-xs tracking-wide uppercase">Status</p>
              <p className="text-ink mt-1 text-lg font-semibold">{status.label}</p>
            </div>
            <Badge
              variant="status"
              tone={status.tone === "success" ? "published" : status.tone === "attention" ? "rejected" : undefined}
            >
              {status.label}
            </Badge>
          </div>
          <p className="text-ink-secondary mt-3 text-sm leading-relaxed">{status.description}</p>
          <dl className="border-line-subtle mt-5 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-tertiary text-xs tracking-wide uppercase">Submitted at</dt>
              <dd className="text-ink mt-0.5">{new Date(submission.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary text-xs tracking-wide uppercase">Company hint</dt>
              <dd className="text-ink mt-0.5">{submission.companyHint ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary text-xs tracking-wide uppercase">Position hint</dt>
              <dd className="text-ink mt-0.5">{submission.positionHint ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary text-xs tracking-wide uppercase">Year</dt>
              <dd className="text-ink mt-0.5">{submission.yearHint ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        {(submission.status === "rejected" || submission.status === "failed") && (
          <Card className="p-6">
            <p className="text-ink text-sm font-medium">
              {submission.status === "rejected"
                ? "This submission was not published after review."
                : "Automatic processing could not complete this submission."}
            </p>
            <p className="text-ink-secondary mt-1 text-sm leading-relaxed">
              {submission.status === "rejected"
                ? "You are welcome to submit a more detailed experience — anything with specific questions and round structure helps other candidates most."
                : "Our team has been notified and will take a look. No action is needed from you."}
            </p>
          </Card>
        )}

        <p className="text-ink-tertiary text-sm">
          Looking for interviews to study?{" "}
          <Link href="/interviews" className="text-accent hover:text-accent-hover font-medium">
            Browse published interviews
          </Link>
        </p>
      </div>
    </Container>
  );
}
