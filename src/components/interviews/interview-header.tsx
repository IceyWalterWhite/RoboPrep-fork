import { Badge } from "@/components/ui/badge";
import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  INTERVIEW_DIFFICULTY_LABELS,
} from "@/lib/interviews/constants";
import { displayEnum, displaySeason } from "@/lib/interviews/helpers";
import type { InterviewSummary } from "@/types/interview";

export function InterviewHeader({ interview }: { interview: InterviewSummary }) {
  const difficultyTone =
    interview.difficulty === "unknown" ? undefined : interview.difficulty;
  return (
    <header className="border-line-subtle flex flex-col gap-6 border-b pb-8">
      <div className="flex flex-col gap-3">
        <p className="text-accent text-sm font-semibold">
          {interview.company?.name ?? "面试经历"}
        </p>
        <h1 className="text-ink max-w-4xl text-3xl leading-tight font-semibold tracking-[-0.025em] sm:text-4xl">
          {interview.title}
        </h1>
        {interview.position ? (
          <p className="text-ink-secondary text-base">{interview.position.title}</p>
        ) : null}
      </div>
      <dl className="text-ink-secondary grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <Meta
          label="时间"
          value={`${interview.year}${displaySeason(interview.season) ? ` · ${displaySeason(interview.season)}` : ""}`}
        />
        <Meta label="地点" value={interview.location} />
        <Meta
          label="雇佣类型"
          value={
            interview.employmentType === "unknown"
              ? null
              : EMPLOYMENT_TYPE_LABELS[interview.employmentType]
          }
        />
        <Meta
          label="经验"
          value={
            interview.experienceLevel === "unknown"
              ? null
              : EXPERIENCE_LEVEL_LABELS[interview.experienceLevel]
          }
        />
        <Meta label="轮次" value={String(interview.stats.roundCount)} />
        <Meta label="问题数" value={String(interview.stats.questionCount)} />
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="difficulty" tone={difficultyTone}>
          {INTERVIEW_DIFFICULTY_LABELS[interview.difficulty]}
        </Badge>
        {interview.interviewType ? (
          <Badge variant="default">{displayEnum(interview.interviewType)}</Badge>
        ) : null}
        {interview.applicationStage !== "unknown" ? (
          <Badge variant="default">{displayEnum(interview.applicationStage)}</Badge>
        ) : null}
      </div>
    </header>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-ink-tertiary text-xs">{label}</dt>
      <dd className="truncate">{value}</dd>
    </div>
  );
}
