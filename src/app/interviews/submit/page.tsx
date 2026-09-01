import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { SubmissionForm } from "@/components/interviews/submission-form";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "Submit an interview",
  description: "Share a real Embodied AI interview experience for review and publication.",
};

export default async function SubmitInterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    const { next } = await searchParams;
    redirect(`/sign-in?next=${encodeURIComponent(next ?? "/interviews/submit")}`);
  }

  return (
    <Container className="py-14">
      <PageHeader
        title="Share an interview experience"
        description="Tell us about a real interview. Our team reviews every submission before anything is published."
      />
      {isFeatureEnabled("interview_submission") ? (
        <SubmissionForm />
      ) : (
        <div className="border-line-subtle bg-surface shadow-card mt-8 max-w-2xl rounded-md border p-8">
          <p className="text-ink font-medium">Interview submissions are temporarily paused</p>
          <p className="text-ink-secondary mt-1 text-sm leading-relaxed">
            Browsing interviews, knowledge, coding and companies is unaffected. Please check back soon.
          </p>
        </div>
      )}
    </Container>
  );
}
