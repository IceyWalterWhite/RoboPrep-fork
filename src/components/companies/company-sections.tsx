import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import type { CompanyPreparationGuide } from "@/types/company-intelligence";
import type { CompanyPositionStat } from "@/types/company-intelligence";
import type { CompanyRecentInterview } from "@/lib/companies/queries";

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
    return <EmptyState title="No role data yet" description="Roles appear once published interviews link to positions." />;
  }
  return (
    <ol className="flex flex-col divide-y">
      {positions.map((position) => (
        <li key={position.positionId} className="flex items-center justify-between gap-3 py-2">
          <Link
            href={`/companies/${companySlug}/roles/${position.positionSlug}`}
            className="text-ink hover:text-accent truncate text-sm font-medium"
          >
            {position.positionTitle}
          </Link>
          <span className="text-ink-secondary shrink-0 text-xs tabular-nums">
            {position.interviewCount === 1 ? "1 interview" : `${position.interviewCount} interviews`}
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
    return <EmptyState title="No published interviews yet" />;
  }
  return (
    <ul className="flex flex-col divide-y">
      {interviews.map((interview) => (
        <li key={interview.id} className="py-2.5">
          <Link
            href={interview.slug ? `/interviews/${interview.slug}` : "/interviews"}
            className="text-ink hover:text-accent text-sm font-medium"
          >
            {interview.positionTitle ?? interview.title ?? "Interview experience"}
          </Link>
          <p className="text-ink-tertiary mt-0.5 text-xs">
            {interview.year}
            {interview.season ? ` ${interview.season}` : ""} · {interview.roundCount} round
            {interview.roundCount === 1 ? "" : "s"} · {interview.questionCount} question
            {interview.questionCount === 1 ? "" : "s"}
            {interview.publishedAt ? ` · published ${new Date(interview.publishedAt).toLocaleDateString()}` : ""}
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
        title="Limited data"
        description="Not enough published interview records yet to build a reliable preparation guide. Check back as more interviews are reviewed."
      />
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {fallbackNote && (
        <p className="text-warning-ink text-sm">{fallbackNote}</p>
      )}

      {guide.mustStudyTopics.length > 0 && (
        <section aria-labelledby="prepare-topics">
          <h3 id="prepare-topics" className="text-ink text-sm font-semibold tracking-wide uppercase">
            Prepare first — core topics
          </h3>
          <ol className="mt-2 flex flex-col gap-1.5">
            {guide.mustStudyTopics.map((topic, index) => (
              <li key={topic.topicId} className="text-sm">
                <span className="text-ink-tertiary mr-2 tabular-nums">{index + 1}.</span>
                <Link href={`/knowledge?topic=${topic.topicSlug}`} className="text-ink hover:text-accent font-medium">
                  {topic.topicName}
                </Link>
                <span className="text-ink-tertiary ml-2 text-xs">
                  {topic.interviewCount === 1
                    ? `in 1 of ${interviewStructureNotes.sampleSize} records`
                    : `in ${topic.interviewCount} of ${interviewStructureNotes.sampleSize} records`}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {guide.mustStudyQuestions.length > 0 && (
        <section aria-labelledby="prepare-questions">
          <h3 id="prepare-questions" className="text-ink text-sm font-semibold tracking-wide uppercase">
            Must-review questions
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {guide.mustStudyQuestions.map((question) => (
              <li key={question.questionId} className="text-sm">
                <Link href={`/knowledge/${question.slug}`} className="text-ink hover:text-accent font-medium">
                  {question.title}
                </Link>
                <span className="text-ink-tertiary ml-2 text-xs">
                  asked in {question.interviewCount} interview record{question.interviewCount === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guide.recommendedCodingProblems.length > 0 && (
        <section aria-labelledby="prepare-coding">
          <h3 id="prepare-coding" className="text-ink text-sm font-semibold tracking-wide uppercase">
            Recommended coding practice
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {guide.recommendedCodingProblems.map((problem) => (
              <li key={problem.problemId} className="text-sm">
                <Link href={`/coding/${problem.slug}`} className="text-ink hover:text-accent font-medium">
                  {problem.title}
                </Link>
                <span className="text-ink-tertiary ml-2 text-xs">
                  seen in {problem.interviewCount} interview record{problem.interviewCount === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-ink-tertiary text-xs">
        Typical interview:{" "}
        {interviewStructureNotes.medianRoundCount !== null
          ? `${interviewStructureNotes.medianRoundCount} rounds`
          : "round count unknown"}
        {interviewStructureNotes.medianQuestionCount !== null ? `, ${interviewStructureNotes.medianQuestionCount} questions` : ""}
        {interviewStructureNotes.dominantRoundType ? `, most rounds are ${interviewStructureNotes.dominantRoundType}` : ""}.{" "}
        <Link href={`/companies/${companySlug}/prepare`} className="text-accent hover:text-accent-hover">
          Open the full study set →
        </Link>
      </p>
    </div>
  );
}
