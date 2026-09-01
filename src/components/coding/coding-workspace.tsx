"use client";

import * as React from "react";
import { Play, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CODING_FRAMEWORK_LABELS } from "@/lib/coding/constants";
import type { PublicEvaluationMetadata } from "@/types/coding";
import type { PublicMLEvaluationResult } from "@/types/ml-judge";

import { CodeEditor } from "./code-editor";
import { JudgeResult, type JudgeFeedback } from "./judge-result";
import { MLResultPanel } from "./ml-result-panel";

/**
 * Coding workspace for both evaluation modes (Week 5 Tasks 18, 49).
 *
 * The mode is taken from the server-rendered problem metadata, never from the
 * client. Run and Submit hit the same endpoints in both modes; the response
 * shape decides which panel is rendered:
 * - `evaluation` present → structured ML panel with per-category results
 * - otherwise           → compact program-mode panel
 */
export function CodingWorkspace({
  slug,
  starterCode,
  evaluation,
}: {
  slug: string;
  starterCode: string;
  evaluation: PublicEvaluationMetadata;
}) {
  const [sourceCode, setSourceCode] = React.useState(starterCode);
  const [result, setResult] = React.useState<MLRunResponse | null>(null);
  const [busy, setBusy] = React.useState<"run" | "submit" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const isStructured = evaluation.evaluationMode !== "program";

  async function execute(kind: "run" | "submit") {
    setBusy(kind);
    setError(null);
    try {
      const response = await fetch(`/api/coding/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, sourceCode }),
      });
      const payload = (await response.json()) as MLRunResponse & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "The judge could not process this request.");
        return;
      }
      setResult(payload);
    } catch {
      setError("The request failed. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="bg-surface-muted flex-row items-center justify-between gap-3 py-4">
          <CardTitle>Python editor</CardTitle>
          <span className="text-ink-tertiary text-xs">{editorHint(evaluation)}</span>
        </CardHeader>
        <CardContent className="p-0">
          <CodeEditor value={sourceCode} onChange={setSourceCode} />
          <div className="border-line-subtle flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-ink-tertiary text-xs">
              {isStructured
                ? "Run checks the visible examples. Submit runs the full hidden suite."
                : "Run checks visible examples. Submit checks the full test suite."}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => execute("run")} disabled={busy !== null}>
                <Play className="size-3.5" aria-hidden />
                {busy === "run" ? "Running…" : "Run"}
              </Button>
              <Button size="sm" onClick={() => execute("submit")} disabled={busy !== null}>
                <Send className="size-3.5" aria-hidden />
                {busy === "submit" ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {error ? (
        <p role="alert" className="border-danger/30 bg-danger/10 text-danger-ink rounded-sm border px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
      {result ? (
        <div aria-live="polite">
          <ResultView result={result} isStructured={isStructured} />
        </div>
      ) : null}
    </div>
  );
}

function ResultView({ result, isStructured }: { result: MLRunResponse; isStructured: boolean }) {
  if (result.evaluation) {
    return (
      <MLResultPanel
        status={result.evaluation.status}
        groups={result.evaluation.groups}
        cases={result.evaluation.cases}
        runtimeMs={result.evaluation.runtimeMs}
        entrypointError={result.evaluation.entrypointError}
        title={result.mode === "program" ? "Submission result" : "Run result"}
      />
    );
  }
  if (isStructured) return null;
  return (
    <JudgeResult
      result={{
        status: result.status,
        score: result.score ?? 0,
        runtimeMs: result.runtimeMs,
        memoryKb: result.memoryKb,
        cases: result.cases ?? [],
      }}
    />
  );
}

function editorHint(evaluation: PublicEvaluationMetadata): string {
  if (evaluation.evaluationMode === "program") return "Python 3 · stdin / stdout";
  const framework = evaluation.framework ? CODING_FRAMEWORK_LABELS[evaluation.framework] : "Python";
  const entrypoint = evaluation.entrypointName ? ` · ${evaluation.entrypointName}()` : "";
  return `Python 3 · ${framework} · ${evaluation.evaluationMode}${entrypoint}`;
}

/** Union of both API responses; the discriminating field is `evaluation`. */
interface MLRunResponse {
  mode?: "program" | "function" | "class";
  status: JudgeFeedback["status"];
  score?: number | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  evaluation?: PublicMLEvaluationResult;
  cases?: JudgeFeedback["cases"];
}
