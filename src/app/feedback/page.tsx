import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata: Metadata = {
  title: "Feedback — RoboPrep",
  description: "Report a bug, a content error, or suggest a feature.",
  robots: { index: false, follow: false },
};

/** Week 8 Task 116: feedback route. */
export default function FeedbackPage() {
  return (
    <Container className="py-14">
      <PageHeader
        title="Feedback"
        description="Bug reports, content corrections, and suggestions all help. For privacy or source concerns, see the Content & Source Policy."
      />
      <div className="mt-8">
        <FeedbackForm />
      </div>
    </Container>
  );
}
