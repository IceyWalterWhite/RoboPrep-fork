import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import type { CompanyPreparationGuide } from "@/types/company-intelligence";
import type { CompanyPositionStat } from "@/types/company-intelligence";
import type { CompanyRecentInterview } from "@/lib/companies/queries";
import { displayEnum, displaySeason } from "@/lib/interviews/helpers";

/**
 * Task 20: role breakdown (real position entities, sorted by interview count).
 */
export function CompanyRoleBreakdown({
  companyId,
  companySlug,
  positions,
}: {
  companyId: string;
  companySlug: string;
  positions: CompanyPositionStat[];
}) {
  void companyId;
  if (positions.length === 0) {
    return (
      <EmptyState
        title="暂时还没有岗位数据"
        description="已发布面试关联到岗位后，岗位会显示在这里。"
      />
    );
  }
  return (
    <ol className="flex flex-col divide-y">
      {positions.map((position) => (
        <li
          key={position.positionId}
          className="flex items-center justify-between gap-3 py-2"
        >
          <Link
            href={`/companies/${companySlug}/roles/${position.positionSlug}`}
            className="text-ink hover:text-accent truncate text-sm font-medium"
          >
            {position.positionTitle}
          </Link>
          <span className="text-ink-secondary shrink-0 text-xs tabular-nums">
            {position.interviewCount} 条面试记录
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Task 39: recent published interview feed (5–10, latest first). */
export function CompanyRecentInterviews({
  companySlug,
  interviews,
}: {
  companySlug: string;
  interviews: CompanyRecentInterview[];
}) {
  void companySlug;
  if (interviews.length === 0) {
    return <EmptyState title="暂时还没有已发布的面试" />;
  }
  return (
    <ul className="flex flex-col divide-y">
      {interviews.map((interview) => (
        <li key={interview.id} className="py-2.5">
          <Link
            href={interview.slug ? `/interviews/${interview.slug}` : "/interviews"}
            className="text-ink hover:text-accent text-sm font-medium"
          >
            {interview.positionTitle ?? interview.title ?? "面试经历"}
          </Link>
          <p className="text-ink-tertiary mt-0.5 text-xs">
            {interview.year}
            {interview.season
              ? ` ${displaySeason(interview.season) ?? "未注明季节"}`
              : ""}{" "}
            · {interview.roundCount} 个轮次 · {interview.questionCount} 个问题
            {interview.publishedAt
              ? ` · 发布于 ${new Date(interview.publishedAt).toLocaleDateString()}`
              : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Task 43/67: preparation guide — ranked study plan with direct links and a
 * checklist presentation. No fake completion state (Task 67/68).
 */
export function CompanyPreparationGuideView({
  guide,
  companySlug,
  fallbackNote,
}: {
  guide: CompanyPreparationGuide;
  companySlug: string;
  fallbackNote?: string;
}) {
  const { interviewStructureNotes } = guide;
  if (guide.limitedDataNote) {
    return (
      <EmptyState
        title="数据有限"
        description="已发布的面试记录还不足以生成可靠的准备指南。更多面试通过审核后，请再回来查看。"
      />
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {fallbackNote && <p className="text-warning-ink text-sm">{fallbackNote}</p>}

      {guide.mustStudyTopics.length > 0 && (
        <section aria-labelledby="prepare-topics">
          <h3
            id="prepare-topics"
            className="text-ink text-sm font-semibold tracking-wide uppercase"
          >
            优先准备 — 核心主题
          </h3>
          <ol className="mt-2 flex flex-col gap-1.5">
            {guide.mustStudyTopics.map((topic, index) => (
              <li key={topic.topicId} className="text-sm">
                <span className="text-ink-tertiary mr-2 tabular-nums">
                  {index + 1}.
                </span>
                <Link
                  href={`/knowledge?topic=${topic.topicSlug}`}
                  className="text-ink hover:text-accent font-medium"
                >
                  {topic.topicName}
                </Link>
                <span className="text-ink-tertiary ml-2 text-xs">
                  {topic.interviewCount === 1
                    ? `出现在 ${interviewStructureNotes.sampleSize} 条记录中的 1 条`
                    : `出现在 ${interviewStructureNotes.sampleSize} 条记录中的 ${topic.interviewCount} 条`}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {guide.mustStudyQuestions.length > 0 && (
        <section aria-labelledby="prepare-questions">
          <h3
            id="prepare-questions"
            className="text-ink text-sm font-semibold tracking-wide uppercase"
          >
            必看问题
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {guide.mustStudyQuestions.map((question) => (
              <li key={question.questionId} className="text-sm">
                <Link
                  href={`/knowledge/${question.slug}`}
                  className="text-ink hover:text-accent font-medium"
                >
                  {question.title}
                </Link>
                <span className="text-ink-tertiary ml-2 text-xs">
                  出现在 {question.interviewCount} 条面试记录中
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guide.recommendedCodingProblems.length > 0 && (
        <section aria-labelledby="prepare-coding">
          <h3
            id="prepare-coding"
            className="text-ink text-sm font-semibold tracking-wide uppercase"
          >
            推荐 Coding 练习
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {guide.recommendedCodingProblems.map((problem) => (
              <li key={problem.problemId} className="text-sm">
                <Link
                  href={`/coding/${problem.slug}`}
                  className="text-ink hover:text-accent font-medium"
                >
                  {problem.title}
                </Link>
                <span className="text-ink-tertiary ml-2 text-xs">
                  出现在 {problem.interviewCount} 条面试记录中
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-ink-tertiary text-xs">
        典型面试：{" "}
        {interviewStructureNotes.medianRoundCount !== null
          ? `${interviewStructureNotes.medianRoundCount} 个轮次`
          : "轮次数未知"}
        {interviewStructureNotes.medianQuestionCount !== null
          ? `，${interviewStructureNotes.medianQuestionCount} 个问题`
          : ""}
        {interviewStructureNotes.dominantRoundType
          ? `，大多数轮次为${displayEnum(interviewStructureNotes.dominantRoundType) ?? "面试轮次"}`
          : ""}
        。{" "}
        <Link
          href={`/companies/${companySlug}/prepare`}
          className="text-accent hover:text-accent-hover"
        >
          打开完整学习清单 →
        </Link>
      </p>
    </div>
  );
}
