import Link from "next/link";

import { SampleSizeNote } from "@/components/companies/sample-size-note";
import { EmptyState } from "@/components/ui/empty-state";
import { sampleBand } from "@/lib/companies/helpers";
import type {
  CompanyCodingProblemStat,
  CompanyQuestionStat,
  CompanyTopicStat,
  CompanyTrendItem,
} from "@/types/company-intelligence";

/**
 * Week 7 ranked-list components (Tasks 23, 25, 26, 36, 65).
 *
 * Copy principle (Task 82): state evidence — "appeared in 7 of 18 published
 * interview records" — never "you will be asked". Percentages are only
 * primary at ≥ 10 interviews (Task 24).
 */

function formatShare(
  share: number | null,
  interviewCount: number,
  totalInterviews: number,
): string {
  if (totalInterviews === 0) return "";
  if (sampleBand(totalInterviews) !== "percentage") {
    return `出现在 ${totalInterviews} 条记录中的 ${interviewCount} 条`;
  }
  return `占面试记录的 ${Math.round((share ?? 0) * 100)}%`;
}

function Bar({ value }: { value: number | null }) {
  if (value === null) return null;
  return (
    <div
      className="bg-surface-sunken h-1.5 w-24 overflow-hidden rounded-full"
      aria-hidden="true"
    >
      <div
        className="bg-accent h-full rounded-full"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
      />
    </div>
  );
}

export function TopTopics({
  topics,
  totalInterviews,
}: {
  topics: CompanyTopicStat[];
  totalInterviews: number;
}) {
  if (topics.length === 0) {
    return (
      <EmptyState
        title="暂时还没有主题数据"
        description="已发布面试完成分析后，主题会显示在这里。"
      />
    );
  }
  return (
    <div>
      <ol className="flex flex-col divide-y">
        {topics.map((topic, index) => (
          <li
            key={topic.topicId}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="text-ink-tertiary w-6 text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link
                href={`/knowledge?topic=${topic.topicSlug}`}
                className="text-ink hover:text-accent truncate text-sm font-medium"
              >
                {topic.topicName}
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Bar value={topic.shareOfInterviews} />
              <span className="text-ink-secondary w-36 text-right text-xs tabular-nums">
                {formatShare(
                  topic.shareOfInterviews,
                  topic.interviewCount,
                  totalInterviews,
                )}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <SampleSizeNote sampleSize={totalInterviews} className="mt-2" />
    </div>
  );
}

export function TopKnowledgeQuestions({
  questions,
  totalInterviews,
}: {
  questions: CompanyQuestionStat[];
  totalInterviews: number;
}) {
  if (questions.length === 0) {
    return (
      <EmptyState
        title="暂时还没有关联问题"
        description="面试审核时会逐步建立标准问题关联。"
      />
    );
  }
  return (
    <ol className="flex flex-col divide-y">
      {questions.map((question, index) => (
        <li key={question.questionId} className="py-2.5">
          <Link
            href={`/knowledge/${question.slug}`}
            className="text-ink hover:text-accent text-sm font-medium"
          >
            <span className="text-ink-tertiary mr-2 text-xs tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            {question.title}
          </Link>
          <p className="text-ink-tertiary mt-0.5 pl-7 text-xs">
            {question.interviewCount === 1
              ? `出现在 ${totalInterviews} 条已发布面试记录中的 1 条`
              : `出现在 ${totalInterviews} 条已发布面试记录中的 ${question.interviewCount} 条`}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function TopCodingProblems({
  problems,
}: {
  problems: CompanyCodingProblemStat[];
}) {
  if (problems.length === 0) {
    return (
      <EmptyState
        title="暂时还没有关联 Coding 题"
        description="面试记录引用标准 Coding 题后，关联内容会显示在这里。"
      />
    );
  }
  return (
    <ol className="flex flex-col divide-y">
      {problems.map((problem, index) => (
        <li key={problem.problemId} className="py-2.5">
          <Link
            href={`/coding/${problem.slug}`}
            className="text-ink hover:text-accent text-sm font-medium"
          >
            <span className="text-ink-tertiary mr-2 text-xs tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            {problem.title}
          </Link>
          <p className="text-ink-tertiary mt-0.5 pl-7 text-xs">
            {problem.interviewCount === 1
              ? "出现在 1 条已发布面试记录中"
              : `出现在 ${problem.interviewCount} 条已发布面试记录中`}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Task 36: trending questions/topics with sample-size caveats (Task 37/38). */
export function CompanyTrendingQuestions({ trends }: { trends: CompanyTrendItem[] }) {
  const rising = trends.filter((item) => item.direction === "rising");
  const falling = trends.filter((item) => item.direction === "falling");
  if (rising.length === 0 && falling.length === 0) {
    return (
      <EmptyState
        title="面试数据不足，暂时无法估计趋势"
        description="每个项目至少需要 3 次出现记录才能计算趋势。"
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {rising.length > 0 && (
        <div>
          <h4 className="text-ink text-xs font-semibold tracking-wide uppercase">
            近期更常见
          </h4>
          <ul className="text-ink-secondary mt-1.5 flex flex-col gap-1 text-sm">
            {rising.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                {item.label}{" "}
                <span className="text-ink-tertiary text-xs">
                  （出现 {item.totalCount} 次）
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {falling.length > 0 && (
        <div>
          <h4 className="text-ink-tertiary text-xs font-semibold tracking-wide uppercase">
            近期较少见
          </h4>
          <ul className="text-ink-tertiary mt-1.5 flex flex-col gap-1 text-sm">
            {falling.map((item) => (
              <li key={`${item.kind}-${item.id}`}>{item.label}</li>
            ))}
          </ul>
        </div>
      )}
      <SampleSizeNote
        sampleSize={TREND_SAMPLE_NOTE}
        noun="occurrences per item minimum"
      />
    </div>
  );
}

const TREND_SAMPLE_NOTE = 3;

/** Task 65: deterministic metric-backed statements. */
export function RecentChanges({ statements }: { statements: string[] }) {
  if (statements.length === 0) return null;
  return (
    <ul className="text-ink-secondary flex flex-col gap-1.5 text-sm">
      {statements.map((statement) => (
        <li key={statement} className="flex gap-2">
          <span aria-hidden="true">·</span>
          <span>{statement}</span>
        </li>
      ))}
    </ul>
  );
}
