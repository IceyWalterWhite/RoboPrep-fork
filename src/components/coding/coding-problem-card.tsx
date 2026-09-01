import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDot } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CODING_DIFFICULTY_LABELS } from "@/lib/coding/constants";
import type { CodingProblemSummary } from "@/types/coding";

export function CodingProblemCard({ problem }: { problem: CodingProblemSummary }) {
  const difficultyTone = problem.difficulty;
  return (
    <Card className="group h-full transition-shadow hover:shadow-raised">
      <Link href={`/coding/${problem.slug}`} className="flex h-full flex-col" aria-label={`Open ${problem.title}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="difficulty" tone={difficultyTone}>{CODING_DIFFICULTY_LABELS[problem.difficulty]}</Badge>
              {problem.category ? <span className="text-ink-tertiary text-xs">{formatLabel(problem.category)}</span> : null}
            </div>
            <ArrowUpRight className="text-ink-tertiary size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </div>
          <CardTitle className="mt-3">{problem.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {problem.topics.slice(0, 3).map((topic) => <Badge key={topic.slug} variant="topic">{topic.name}</Badge>)}
          </div>
          <div className="text-ink-tertiary mt-auto flex flex-wrap items-center gap-3 text-xs">
            {problem.acceptanceRate !== null ? <span>{problem.acceptanceRate}% acceptance</span> : <span>New problem</span>}
            {problem.userStatus === "solved" ? (
              <span className="text-success-ink inline-flex items-center gap-1"><CheckCircle2 className="size-3.5" aria-hidden />Solved</span>
            ) : problem.userStatus === "attempted" ? (
              <span className="text-warning-ink inline-flex items-center gap-1"><CircleDot className="size-3.5" aria-hidden />Attempted</span>
            ) : null}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
