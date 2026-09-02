import { sampleBand } from "@/lib/companies/helpers";
import { cn } from "@/lib/utils";

/**
 * Task 51: consistent sample-size context for every company metric.
 * Task 24 policy: < 3 = Limited data; 3–9 = counts primary; ≥ 10 = share may
 * be primary.
 */
export function SampleSizeNote({
  sampleSize,
  noun = "面试记录",
  className,
}: {
  sampleSize: number;
  noun?: string;
  className?: string;
}) {
  const band = sampleBand(sampleSize);
  const displayNoun =
    noun === "interviews"
      ? "面试记录"
      : noun === "occurrences per item minimum"
        ? "每个项目至少出现次数"
        : noun;
  return (
    <p
      className={cn(
        "text-ink-tertiary text-xs",
        band === "limited" && "text-warning-ink",
        className,
      )}
    >
      {band === "limited"
        ? `数据有限 · ${sampleSize} ${displayNoun}`
        : `基于 ${sampleSize} ${displayNoun}`}
    </p>
  );
}
