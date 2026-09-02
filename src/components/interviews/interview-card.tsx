import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INTERVIEW_DIFFICULTY_LABELS } from "@/lib/interviews/constants";
import { displaySeason, displayEnum } from "@/lib/interviews/helpers";
import type { InterviewSummary } from "@/types/interview";

export function InterviewCard({ interview }: { interview: InterviewSummary }) {
  const difficultyTone =
    interview.difficulty === "unknown" ? undefined : interview.difficulty;
  return (
    <Card className="group hover:shadow-raised h-full transition-shadow">
      <Link
        href={`/interviews/${interview.slug}`}
        className="flex h-full flex-col"
        aria-label={`打开：${interview.title}`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {interview.company ? (
                <span className="text-ink text-sm font-semibold">
                  {interview.company.name}
                </span>
              ) : null}
              <span className="text-ink-tertiary text-xs">
                {interview.year}
                {displaySeason(interview.season)
                  ? ` · ${displaySeason(interview.season)}`
                  : ""}
              </span>
            </div>
            <ArrowUpRight
              className="text-ink-tertiary size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </div>
          <CardTitle className="mt-2">
            {interview.position?.title ?? interview.title}
          </CardTitle>
          {interview.position?.title && interview.title !== interview.position.title ? (
            <p className="text-ink-tertiary text-xs">{interview.title}</p>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          {interview.location ? (
            <p className="text-ink-secondary flex items-center gap-1.5 text-sm">
              <MapPin className="size-3.5" aria-hidden />
              {interview.location}
            </p>
          ) : null}
          {interview.summary ? (
            <p className="text-ink-secondary line-clamp-3 text-sm leading-relaxed">
              {interview.summary}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-2">
            <Badge variant="default">{interview.stats.roundCount} 个轮次</Badge>
            <Badge variant="default">{interview.stats.questionCount} 个问题</Badge>
            <Badge variant="difficulty" tone={difficultyTone}>
              {INTERVIEW_DIFFICULTY_LABELS[interview.difficulty]}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {interview.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="topic">
                {displayEnum(tag) ?? tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
