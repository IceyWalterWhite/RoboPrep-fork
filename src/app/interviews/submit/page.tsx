import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { SubmissionForm } from "@/components/interviews/submission-form";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "提交面试经历",
  description: "分享真实的具身智能面试经历，供审核和发布。",
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
        title="分享面试经历"
        description="告诉我们一次真实的面试经历。所有投稿都会经过团队审核后再发布。"
      />
      {isFeatureEnabled("interview_submission") ? (
        <SubmissionForm />
      ) : (
        <div className="border-line-subtle bg-surface shadow-card mt-8 max-w-2xl rounded-md border p-8">
          <p className="text-ink font-medium">面试投稿暂时暂停</p>
          <p className="text-ink-secondary mt-1 text-sm leading-relaxed">
            浏览面试、知识库、Coding 和公司的功能不受影响，请稍后再来查看。
          </p>
        </div>
      )}
    </Container>
  );
}
