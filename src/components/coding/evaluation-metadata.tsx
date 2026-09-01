import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CODING_EVALUATION_MODE_LABELS,
  CODING_CHECK_LABELS,
  CODING_FRAMEWORK_LABELS,
  CODING_RESOURCE_PROFILE_LABELS,
} from "@/lib/coding/constants";
import type { PublicEvaluationMetadata } from "@/types/coding";

/**
 * Evaluation metadata shown before coding starts (Week 5 Task 19).
 *
 * Only derived capability hints are displayed. Tolerances, hidden group
 * weights, reference tensors and raw `evaluator_config` stay server-side —
 * the catalog view does not even select that column.
 *
 * Program-mode problems render nothing, keeping the classic stdin/stdout
 * page uncluttered.
 */
export function EvaluationMetadata({ evaluation }: { evaluation: PublicEvaluationMetadata }) {
  if (evaluation.evaluationMode === "program") return null;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Evaluation", value: CODING_EVALUATION_MODE_LABELS[evaluation.evaluationMode] },
  ];
  if (evaluation.framework) {
    rows.push({ label: "Framework", value: CODING_FRAMEWORK_LABELS[evaluation.framework] });
  }
  if (evaluation.entrypointName) {
    rows.push({ label: "Entrypoint", value: evaluation.entrypointName });
  }
  rows.push({ label: "Runtime", value: CODING_RESOURCE_PROFILE_LABELS[evaluation.resourceProfile] });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">How this is evaluated</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-ink-tertiary text-xs">{row.label}</dt>
              <dd className="text-ink mt-1 font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="border-line-subtle flex flex-wrap items-center gap-2 border-t pt-4">
          <span className="text-ink-tertiary text-xs">Checks</span>
          {evaluation.checks.map((check) => (
            <span
              key={check}
              className="bg-surface-sunken text-ink-secondary rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              {CODING_CHECK_LABELS[check]}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
