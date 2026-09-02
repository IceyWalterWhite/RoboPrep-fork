import { SampleSizeNote } from "@/components/companies/sample-size-note";
import { EmptyState } from "@/components/ui/empty-state";
import { sampleBand } from "@/lib/companies/helpers";
import {
  INTERVIEW_DIFFICULTY_LABELS,
  ROUND_TYPE_LABELS,
} from "@/lib/interviews/constants";
import { displayEnum, displaySeason } from "@/lib/interviews/helpers";
import type {
  CompanyDifficultyStat,
  CompanyRoundTypeStat,
  CompanySeasonStat,
} from "@/types/company-intelligence";
import type { CompanyEmphasis } from "@/lib/companies/queries";

/**
 * Week 7 insight panels (Tasks 28–32, 34): simple ranked lists, small tables,
 * subtle bars — no chart libraries, no color-only encoding (Task 60).
 */

function StatRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const share = total > 0 ? count / total : 0;
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-ink w-40 truncate text-sm">{label}</span>
        <div
          className="bg-surface-sunken h-1.5 w-24 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          <div
            className="bg-accent h-full rounded-full"
            style={{ width: `${Math.round(share * 100)}%` }}
          />
        </div>
      </div>
      <span className="text-ink-secondary text-xs tabular-nums">
        {Math.round(share * 100)}% ({count})
      </span>
    </li>
  );
}

/** Task 28: coding vs knowledge emphasis over classified occurrences. */
export function CompanyInterviewEmphasis({
  emphasis,
  sampleSize,
}: {
  emphasis: CompanyEmphasis;
  sampleSize: number;
}) {
  if (emphasis.totalOccurrences === 0) {
    return (
      <EmptyState
        title="暂时还没有问题数据"
        description="已发布面试包含问题后，面试重点会显示在这里。"
      />
    );
  }
  return (
    <div>
      <ul>
        <StatRow
          label="知识 / 研究"
          count={emphasis.knowledgeOccurrences}
          total={emphasis.totalOccurrences}
        />
        <StatRow
          label="Coding / 实现"
          count={emphasis.codingOccurrences}
          total={emphasis.totalOccurrences}
        />
        {emphasis.unclassifiedOccurrences > 0 && (
          <StatRow
            label="未分类"
            count={emphasis.unclassifiedOccurrences}
            total={emphasis.totalOccurrences}
          />
        )}
      </ul>
      <SampleSizeNote sampleSize={sampleSize} noun="interviews" className="mt-2" />
    </div>
  );
}

/** Task 30: difficulty distribution; unknown excluded from the average. */
export function CompanyDifficulty({
  difficulty,
}: {
  difficulty: CompanyDifficultyStat | null;
}) {
  if (!difficulty || difficulty.sampleSize === 0) {
    return (
      <EmptyState
        title="暂时还没有难度数据"
        description="已发布面试记录总体难度后，难度信息会显示在这里。"
      />
    );
  }
  const known = difficulty.sampleSize;
  return (
    <div>
      <ul>
        <StatRow
          label={INTERVIEW_DIFFICULTY_LABELS.easy}
          count={difficulty.easyCount}
          total={known}
        />
        <StatRow
          label={INTERVIEW_DIFFICULTY_LABELS.medium}
          count={difficulty.mediumCount}
          total={known}
        />
        <StatRow
          label={INTERVIEW_DIFFICULTY_LABELS.hard}
          count={difficulty.hardCount}
          total={known}
        />
      </ul>
      {difficulty.unknownCount > 0 && (
        <p className="text-ink-tertiary mt-1 text-xs">
          {difficulty.unknownCount} 条未评级的面试记录未计入统计。
        </p>
      )}
      {sampleBand(known) !== "limited" && difficulty.averageScore !== null && (
        <p className="text-ink-secondary mt-1 text-xs">
          平均难度分数为 {difficulty.averageScore.toFixed(1)}，采用 1（简单）–
          3（困难）的量表。
        </p>
      )}
      <SampleSizeNote sampleSize={known} className="mt-2" />
    </div>
  );
}

/** Task 31: round-type distribution; share denominator = total published rounds. */
export function RoundTypeDistribution({
  roundTypes,
}: {
  roundTypes: CompanyRoundTypeStat[];
}) {
  const totalRounds = roundTypes.reduce((sum, entry) => sum + entry.roundCount, 0);
  if (totalRounds === 0) {
    return (
      <EmptyState
        title="暂时还没有轮次数据"
        description="已发布面试包含轮次后，面试结构会显示在这里。"
      />
    );
  }
  return (
    <div>
      <ul>
        {roundTypes.map((entry) => (
          <StatRow
            key={entry.roundType}
            label={
              ROUND_TYPE_LABELS[entry.roundType.toLowerCase()] ??
              displayEnum(entry.roundType) ??
              "面试轮次"
            }
            count={entry.roundCount}
            total={totalRounds}
          />
        ))}
      </ul>
      <p className="text-ink-tertiary mt-2 text-xs">
        已发布面试中共 {totalRounds} 个轮次的占比。
      </p>
    </div>
  );
}

/** Task 32: typical interview structure using medians. */
export function TypicalStructure({
  medianRoundCount,
  medianQuestionCount,
  sampleSize,
}: {
  medianRoundCount: number | null;
  medianQuestionCount: number | null;
  sampleSize: number;
}) {
  if (sampleSize === 0 || (medianRoundCount === null && medianQuestionCount === null)) {
    return <EmptyState title="暂时还没有结构数据" />;
  }
  return (
    <div>
      <p className="text-ink text-sm">
        {medianRoundCount !== null && (
          <span>
            {medianRoundCount} 个轮次
            {medianQuestionCount !== null ? " · " : ""}
          </span>
        )}
        {medianQuestionCount !== null && (
          <span>{medianQuestionCount} 个问题（典型值）</span>
        )}
      </p>
      <SampleSizeNote sampleSize={sampleSize} className="mt-1.5" />
    </div>
  );
}

/** Task 34: season comparison as a small table. */
export function SeasonComparison({ seasons }: { seasons: CompanySeasonStat[] }) {
  if (seasons.length < 2) {
    return (
      <EmptyState
        title="面试数据不足，暂时无法对比季节"
        description="季节对比至少需要两个有已发布面试的季节。"
      />
    );
  }
  const rows = seasons.slice(0, 4);
  return (
    <div className="overflow-x-auto">
      <table className="text-ink w-full min-w-96 text-sm">
        <caption className="sr-only">面试数量和重点的季节对比</caption>
        <thead>
          <tr className="text-ink-tertiary border-line-subtle border-b text-left text-xs">
            <th scope="col" className="py-1.5 pr-4 font-medium">
              指标
            </th>
            {rows.map((season) => (
              <th
                scope="col"
                key={`${season.year}-${season.season}`}
                className="py-1.5 pr-4 font-medium tabular-nums"
              >
                {season.year} {displaySeason(season.season) ?? "未注明季节"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-line-subtle border-b">
            <th
              scope="row"
              className="text-ink py-1.5 pr-4 text-left text-sm font-normal"
            >
              面试记录
            </th>
            {rows.map((season) => (
              <td
                key={`${season.year}-${season.season}`}
                className="py-1.5 pr-4 tabular-nums"
              >
                {season.interviewCount}
              </td>
            ))}
          </tr>
          <tr className="border-line-subtle border-b">
            <th
              scope="row"
              className="text-ink py-1.5 pr-4 text-left text-sm font-normal"
            >
              Coding 占比
            </th>
            {rows.map((season) => (
              <td
                key={`${season.year}-${season.season}`}
                className="text-ink-secondary py-1.5 pr-4 tabular-nums"
              >
                {season.codingShare !== null
                  ? `${Math.round(season.codingShare * 100)}%`
                  : "—"}
              </td>
            ))}
          </tr>
          <tr>
            <th
              scope="row"
              className="text-ink py-1.5 pr-4 text-left text-sm font-normal"
            >
              每条面试的问题数
            </th>
            {rows.map((season) => (
              <td
                key={`${season.year}-${season.season}`}
                className="text-ink-secondary py-1.5 pr-4 tabular-nums"
              >
                {season.avgQuestionCount !== null
                  ? season.avgQuestionCount.toFixed(1)
                  : "—"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <SampleSizeNote
        sampleSize={rows.reduce((sum, season) => sum + season.interviewCount, 0)}
        className="mt-2"
      />
    </div>
  );
}
