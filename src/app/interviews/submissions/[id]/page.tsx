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
  title: "投稿状态",
  description: "查看你的面试投稿状态。",
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
            {submission.status === "submitted" ? "已收到投稿" : "你的投稿"}
          </h1>
          <p className="text-ink-secondary text-sm leading-relaxed">
            感谢你为 RoboPrep 贡献内容。所有投稿都会经过人工审核后再发布。
          </p>
        </header>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-ink-tertiary text-xs tracking-wide uppercase">状态</p>
              <p className="text-ink mt-1 text-lg font-semibold">{status.label}</p>
            </div>
            <Badge
              variant="status"
              tone={
                status.tone === "success"
                  ? "published"
                  : status.tone === "attention"
                    ? "rejected"
                    : undefined
              }
            >
              {status.label}
            </Badge>
          </div>
          <p className="text-ink-secondary mt-3 text-sm leading-relaxed">
            {status.description}
          </p>
          <dl className="border-line-subtle mt-5 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-tertiary text-xs tracking-wide uppercase">
                提交时间
              </dt>
              <dd className="text-ink mt-0.5">
                {new Date(submission.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-ink-tertiary text-xs tracking-wide uppercase">
                公司提示
              </dt>
              <dd className="text-ink mt-0.5">{submission.companyHint ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary text-xs tracking-wide uppercase">
                岗位提示
              </dt>
              <dd className="text-ink mt-0.5">{submission.positionHint ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary text-xs tracking-wide uppercase">
                年份
              </dt>
              <dd className="text-ink mt-0.5">{submission.yearHint ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        {(submission.status === "rejected" || submission.status === "failed") && (
          <Card className="p-6">
            <p className="text-ink text-sm font-medium">
              {submission.status === "rejected"
                ? "这条投稿未通过审核并发布。"
                : "自动处理未能完成这条投稿。"}
            </p>
            <p className="text-ink-secondary mt-1 text-sm leading-relaxed">
              {submission.status === "rejected"
                ? "欢迎你补充提交更详细的经历——具体的问题和轮次结构最能帮助其他候选人。"
                : "团队已经收到通知并会进行查看，你暂时无需采取任何操作。"}
            </p>
          </Card>
        )}

        <p className="text-ink-tertiary text-sm">
          想找面试来学习？{" "}
          <Link
            href="/interviews"
            className="text-accent hover:text-accent-hover font-medium"
          >
            浏览已发布的面试
          </Link>
        </p>
      </div>
    </Container>
  );
}
