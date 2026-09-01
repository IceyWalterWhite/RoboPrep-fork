import { SampleSizeNote } from "@/components/companies/sample-size-note";
import { EmptyState } from "@/components/ui/empty-state";
import { sampleBand } from "@/lib/companies/helpers";
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
        <div className="bg-surface-sunken h-1.5 w-24 overflow-hidden rounded-full" aria-hidden="true">
          <div className="bg-accent h-full rounded-full" style={{ width: `${Math.round(share * 100)}%` }} />
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
    return <EmptyState title="No question data yet" description="Emphasis appears once published interviews contain questions." />;
  }
  return (
    <div>
      <ul>
        <StatRow label="Knowledge / Research" count={emphasis.knowledgeOccurrences} total={emphasis.totalOccurrences} />
        <StatRow label="Coding / Implementation" count={emphasis.codingOccurrences} total={emphasis.totalOccurrences} />
        {emphasis.unclassifiedOccurrences > 0 && (
          <StatRow label="Unclassified" count={emphasis.unclassifiedOccurrences} total={emphasis.totalOccurrences} />
        )}
      </ul>
      <SampleSizeNote sampleSize={sampleSize} noun="interviews" className="mt-2" />
    </div>
  );
}

/** Task 30: difficulty distribution; unknown excluded from the average. */
export function CompanyDifficulty({ difficulty }: { difficulty: CompanyDifficultyStat | null }) {
  if (!difficulty || difficulty.sampleSize === 0) {
    return <EmptyState title="No difficulty data yet" description="Difficulty appears once published interviews record an overall difficulty." />;
  }
  const known = difficulty.sampleSize;
  return (
    <div>
      <ul>
        <StatRow label="Easy" count={difficulty.easyCount} total={known} />
        <StatRow label="Medium" count={difficulty.mediumCount} total={known} />
        <StatRow label="Hard" count={difficulty.hardCount} total={known} />
      </ul>
      {difficulty.unknownCount > 0 && (
        <p className="text-ink-tertiary mt-1 text-xs">
          {difficulty.unknownCount} interview{difficulty.unknownCount === 1 ? "" : "s"} without a difficulty rating are excluded.
        </p>
      )}
      {sampleBand(known) !== "limited" && difficulty.averageScore !== null && (
        <p className="text-ink-secondary mt-1 text-xs">
          Average difficulty score {difficulty.averageScore.toFixed(1)} on a 1 (easy) – 3 (hard) scale.
        </p>
      )}
      <SampleSizeNote sampleSize={known} className="mt-2" />
    </div>
  );
}

/** Task 31: round-type distribution; share denominator = total published rounds. */
export function RoundTypeDistribution({ roundTypes }: { roundTypes: CompanyRoundTypeStat[] }) {
  const totalRounds = roundTypes.reduce((sum, entry) => sum + entry.roundCount, 0);
  if (totalRounds === 0) {
    return <EmptyState title="No round data yet" description="Round structure appears once published interviews include rounds." />;
  }
  return (
    <div>
      <ul>
        {roundTypes.map((entry) => (
          <StatRow key={entry.roundType} label={entry.roundType} count={entry.roundCount} total={totalRounds} />
        ))}
      </ul>
      <p className="text-ink-tertiary mt-2 text-xs">
        Share of {totalRounds} rounds across published interviews.
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
    return <EmptyState title="No structure data yet" />;
  }
  return (
    <div>
      <p className="text-ink text-sm">
        {medianRoundCount !== null && (
          <span>
            {medianRoundCount} round{medianRoundCount === 1 ? "" : "s"}
            {medianQuestionCount !== null ? " · " : ""}
          </span>
        )}
        {medianQuestionCount !== null && <span>{medianQuestionCount} questions (typical)</span>}
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
        title="Not enough interview data yet to compare seasons"
        description="Season comparison needs at least two seasons with published interviews."
      />
    );
  }
  const rows = seasons.slice(0, 4);
  return (
    <div className="overflow-x-auto">
      <table className="text-ink w-full min-w-96 text-sm">
        <caption className="sr-only">Season comparison of interview volume and emphasis</caption>
        <thead>
          <tr className="text-ink-tertiary border-line-subtle border-b text-left text-xs">
            <th scope="col" className="py-1.5 pr-4 font-medium">Metric</th>
            {rows.map((season) => (
              <th scope="col" key={`${season.year}-${season.season}`} className="py-1.5 pr-4 font-medium tabular-nums">
                {season.year} {season.season}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-line-subtle border-b">
            <th scope="row" className="text-ink py-1.5 pr-4 text-left text-sm font-normal">Interviews</th>
            {rows.map((season) => (
              <td key={`${season.year}-${season.season}`} className="py-1.5 pr-4 tabular-nums">{season.interviewCount}</td>
            ))}
          </tr>
          <tr className="border-line-subtle border-b">
            <th scope="row" className="text-ink py-1.5 pr-4 text-left text-sm font-normal">Coding share</th>
            {rows.map((season) => (
              <td key={`${season.year}-${season.season}`} className="text-ink-secondary py-1.5 pr-4 tabular-nums">
                {season.codingShare !== null ? `${Math.round(season.codingShare * 100)}%` : "—"}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="text-ink py-1.5 pr-4 text-left text-sm font-normal">Questions per interview</th>
            {rows.map((season) => (
              <td key={`${season.year}-${season.season}`} className="text-ink-secondary py-1.5 pr-4 tabular-nums">
                {season.avgQuestionCount !== null ? season.avgQuestionCount.toFixed(1) : "—"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <SampleSizeNote sampleSize={rows.reduce((sum, season) => sum + season.interviewCount, 0)} className="mt-2" />
    </div>
  );
}
