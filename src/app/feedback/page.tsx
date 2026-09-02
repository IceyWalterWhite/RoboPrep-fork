import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata: Metadata = {
  title: "反馈 — RoboPrep",
  description: "报告问题、纠正内容或提出功能建议。",
  robots: { index: false, follow: false },
};

/** Week 8 Task 116: feedback route. */
export default function FeedbackPage() {
  return (
    <Container className="py-14">
      <PageHeader
        title="反馈"
        description="问题报告、内容纠正和功能建议都能帮助我们改进。如有隐私或来源方面的疑问，请查看“内容与来源政策”。"
      />
      <div className="mt-8">
        <FeedbackForm />
      </div>
    </Container>
  );
}
