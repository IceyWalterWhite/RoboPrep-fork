import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDot } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CODING_CATEGORY_LABELS,
  CODING_DIFFICULTY_LABELS,
} from "@/lib/coding/constants";
import type { CodingProblemSummary } from "@/types/coding";

export function CodingProblemCard({ problem }: { problem: CodingProblemSummary }) {
  const difficultyTone = problem.difficulty;
  return (
    <Card className="group hover:shadow-raised h-full transition-shadow">
      <Link
        href={`/coding/${problem.slug}`}
        className="flex h-full flex-col"
        aria-label={`打开：${problem.title}`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="difficulty" tone={difficultyTone}>
                {CODING_DIFFICULTY_LABELS[problem.difficulty]}
              </Badge>
              {problem.category ? (
                <span className="text-ink-tertiary text-xs">
                  {CODING_CATEGORY_LABELS[problem.category] ??
                    formatLabel(problem.category)}
                </span>
              ) : null}
            </div>
            <ArrowUpRight
              className="text-ink-tertiary size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </div>
          <CardTitle className="mt-3">{problem.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {problem.topics.slice(0, 3).map((topic) => (
              <Badge key={topic.slug} variant="topic">
                {topic.name}
              </Badge>
            ))}
          </div>
          <div className="text-ink-tertiary mt-auto flex flex-wrap items-center gap-3 text-xs">
            {problem.acceptanceRate !== null ? (
              <span>通过率 {problem.acceptanceRate}%</span>
            ) : (
              <span>新题目</span>
            )}
            {problem.userStatus === "solved" ? (
              <span className="text-success-ink inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5" aria-hidden />
                已解决
              </span>
            ) : problem.userStatus === "attempted" ? (
              <span className="text-warning-ink inline-flex items-center gap-1">
                <CircleDot className="size-3.5" aria-hidden />
                已尝试
              </span>
            ) : null}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

function formatLabel(value: string): string {
  const labels: Record<string, string> = {
    robot_learning: "机器人学习",
    software_engineering: "软件工程",
    machine_learning: "机器学习",
    transformer: "Transformer",
    diffusion: "Diffusion",
    robotics: "机器人学",
    algorithms: "算法",
  };
  return labels[value.toLowerCase()] ?? "其他";
}
