"use client";

import * as React from "react";
import { Play, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CODING_EVALUATION_MODE_LABELS,
  CODING_FRAMEWORK_LABELS,
} from "@/lib/coding/constants";
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
        setError(payload.error ?? "判题服务无法处理这次请求。");
        return;
      }
      setResult(payload);
    } catch {
      setError("请求失败，请检查网络连接后重试。");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="bg-surface-muted flex-row items-center justify-between gap-3 py-4">
          <CardTitle>Python 编辑器</CardTitle>
          <span className="text-ink-tertiary text-xs">{editorHint(evaluation)}</span>
        </CardHeader>
        <CardContent className="p-0">
          <CodeEditor value={sourceCode} onChange={setSourceCode} />
          <div className="border-line-subtle flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-ink-tertiary text-xs">
              {isStructured
                ? "运行会检查可见示例，提交会运行完整的隐藏测试。"
                : "运行会检查可见示例，提交会检查完整测试集。"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => execute("run")}
                disabled={busy !== null}
              >
                <Play className="size-3.5" aria-hidden />
                {busy === "run" ? "运行中…" : "运行"}
              </Button>
              <Button
                size="sm"
                onClick={() => execute("submit")}
                disabled={busy !== null}
              >
                <Send className="size-3.5" aria-hidden />
                {busy === "submit" ? "提交中…" : "提交"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {error ? (
        <p
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger-ink rounded-sm border px-4 py-3 text-sm"
        >
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

function ResultView({
  result,
  isStructured,
}: {
  result: MLRunResponse;
  isStructured: boolean;
}) {
  if (result.evaluation) {
    return (
      <MLResultPanel
        status={result.evaluation.status}
        groups={result.evaluation.groups}
        cases={result.evaluation.cases}
        runtimeMs={result.evaluation.runtimeMs}
        entrypointError={result.evaluation.entrypointError}
        title={result.mode === "program" ? "提交结果" : "运行结果"}
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
  if (evaluation.evaluationMode === "program") return "Python 3 · 标准输入 / 标准输出";
  const framework = evaluation.framework
    ? CODING_FRAMEWORK_LABELS[evaluation.framework]
    : "Python";
  const entrypoint = evaluation.entrypointName
    ? ` · ${evaluation.entrypointName}()`
    : "";
  const mode =
    CODING_EVALUATION_MODE_LABELS[evaluation.evaluationMode] ??
    evaluation.evaluationMode;
  return `Python 3 · ${framework} · ${mode}${entrypoint}`;
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
