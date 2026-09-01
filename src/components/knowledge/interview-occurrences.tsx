import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { displaySeason } from "@/lib/interviews/helpers";
import type { QuestionOccurrence } from "@/types/knowledge";

export function InterviewOccurrences({ occurrences }: { occurrences: QuestionOccurrence[] }) {
  if (occurrences.length === 0) return null;
  return (
    <section aria-labelledby="seen-in-interviews-heading" className="flex flex-col gap-4">
      <div><h2 id="seen-in-interviews-heading" className="text-ink text-xl font-semibold tracking-[-0.015em]">Seen in interviews</h2><p className="text-ink-secondary mt-1 text-sm">Original wording and provenance for this canonical question.</p></div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {occurrences.map((occurrence) => {
          const label = `${occurrence.companyName ?? "Interview"}${occurrence.positionTitle ? ` · ${occurrence.positionTitle}` : ""}`;
          const period = `${occurrence.year}${displaySeason(occurrence.season) ? ` · ${displaySeason(occurrence.season)}` : ""}`;
          return <li key={`${occurrence.interviewId}-${occurrence.roundNumber ?? ""}`}><Card className="h-full transition-shadow hover:shadow-raised"><CardContent className="flex h-full flex-col gap-3 p-5">{occurrence.interviewSlug ? <Link href={`/interviews/${occurrence.interviewSlug}`} className="group flex items-start justify-between gap-3"><span className="text-ink text-sm font-semibold">{label}</span><ArrowUpRight className="text-ink-tertiary size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></Link> : <p className="text-ink text-sm font-semibold">{label}</p>}<p className="text-ink-secondary text-sm">{period}{occurrence.roundNumber ? ` · Round ${occurrence.roundNumber}` : ""}{occurrence.roundTitle ? ` · ${occurrence.roundTitle}` : ""}</p>{occurrence.originalWording ? <blockquote className="border-line-subtle text-ink-secondary mt-auto border-l-2 pl-3 text-sm leading-relaxed">{occurrence.originalWording}</blockquote> : null}</CardContent></Card></li>;
        })}
      </ul>
    </section>
  );
}
