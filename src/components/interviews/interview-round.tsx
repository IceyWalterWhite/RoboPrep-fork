import { Clock3, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ROUND_TYPE_LABELS } from "@/lib/interviews/constants";
import type { InterviewRound as InterviewRoundType } from "@/types/interview";

import { InterviewQuestion } from "./interview-question";

export function InterviewRound({ round }: { round: InterviewRoundType }) {
  return (
    <section aria-labelledby={`round-${round.roundNumber}-heading`} className="border-line-subtle border-t pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-accent text-xs font-semibold tracking-wide uppercase">Round {round.roundNumber}</p>
          <h2 id={`round-${round.roundNumber}-heading`} className="text-ink text-xl font-semibold tracking-[-0.015em]">{round.title}</h2>
          <div className="text-ink-secondary flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Badge variant="default">{ROUND_TYPE_LABELS[round.roundType] ?? round.roundType}</Badge>
            {round.durationMinutes ? <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" aria-hidden />{round.durationMinutes} min</span> : null}
            {round.interviewerRole ? <span className="inline-flex items-center gap-1.5"><UserRound className="size-3.5" aria-hidden />{round.interviewerRole}</span> : null}
          </div>
        </div>
        <span className="text-ink-tertiary text-sm">{round.questions.length} question{round.questions.length === 1 ? "" : "s"}</span>
      </div>
      {round.summary ? <p className="text-ink-secondary mt-4 max-w-3xl text-sm leading-relaxed">{round.summary}</p> : null}
      {round.questions.length > 0 ? <div className="mt-5"><div className="border-line-subtle border-b"><span className="sr-only">Questions</span></div>{round.questions.map((question) => <InterviewQuestion key={question.id} question={question} />)}</div> : <p className="text-ink-tertiary mt-5 text-sm italic">No questions were recorded for this round.</p>}
    </section>
  );
}
