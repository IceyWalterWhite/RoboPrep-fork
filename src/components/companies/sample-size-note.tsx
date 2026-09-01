import { sampleBand } from "@/lib/companies/helpers";
import { cn } from "@/lib/utils";

/**
 * Task 51: consistent sample-size context for every company metric.
 * Task 24 policy: < 3 = Limited data; 3–9 = counts primary; ≥ 10 = share may
 * be primary.
 */
export function SampleSizeNote({
  sampleSize,
  noun = "interviews",
  className,
}: {
  sampleSize: number;
  noun?: string;
  className?: string;
}) {
  const band = sampleBand(sampleSize);
  return (
    <p className={cn("text-ink-tertiary text-xs", band === "limited" && "text-warning-ink", className)}>
      {band === "limited"
        ? `Limited data · ${sampleSize} ${sampleSize === 1 ? noun.replace(/s$/, "") : noun}`
        : `Based on ${sampleSize} ${noun}`}
    </p>
  );
}
