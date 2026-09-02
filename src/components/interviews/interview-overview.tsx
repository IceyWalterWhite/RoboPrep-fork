import { Badge } from "@/components/ui/badge";
import { INTERVIEW_DIFFICULTY_LABELS } from "@/lib/interviews/constants";
import type { InterviewSummary } from "@/types/interview";

export function InterviewOverview({ interview }: { interview: InterviewSummary }) {
  if (!interview.summary && interview.stats.questionCount === 0) return null;
  return (
    <section
      aria-labelledby="interview-overview-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="interview-overview-heading"
          className="text-ink text-xl font-semibold tracking-[-0.015em]"
        >
          概览
        </h2>
        <div className="flex flex-wrap gap-2">
          {interview.stats.codingQuestionCount > 0 ? (
            <Badge variant="topic">
              {interview.stats.codingQuestionCount} 个 Coding 问题
            </Badge>
          ) : null}
          {interview.stats.topicCount > 0 ? (
            <Badge variant="default">{interview.stats.topicCount} 个主题</Badge>
          ) : null}
          <Badge
            variant="difficulty"
            tone={interview.difficulty === "unknown" ? undefined : interview.difficulty}
          >
            {INTERVIEW_DIFFICULTY_LABELS[interview.difficulty]}
          </Badge>
        </div>
      </div>
      {interview.summary ? (
        <p className="text-ink-secondary max-w-3xl text-[0.9375rem] leading-7">
          {interview.summary}
        </p>
      ) : null}
    </section>
  );
}
