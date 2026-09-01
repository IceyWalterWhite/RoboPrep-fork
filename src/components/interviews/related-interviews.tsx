import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { displaySeason } from "@/lib/interviews/helpers";
import type { RelatedInterview } from "@/types/interview";

export function RelatedInterviews({ interviews }: { interviews: RelatedInterview[] }) {
  if (interviews.length === 0) return null;
  return (
    <section aria-labelledby="related-interviews-heading" className="flex flex-col gap-4">
      <div><h2 id="related-interviews-heading" className="text-ink text-xl font-semibold tracking-[-0.015em]">Related interviews</h2><p className="text-ink-secondary mt-1 text-sm">Matched deterministically by company, role, season and metadata.</p></div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {interviews.map((interview) => <li key={interview.id}><Card className="h-full transition-shadow hover:shadow-raised"><Link href={`/interviews/${interview.slug}`} className="block h-full"><CardContent className="flex h-full flex-col gap-3 p-5"><p className="text-ink text-sm font-semibold">{interview.company?.name ?? "Interview"}</p><h3 className="text-ink leading-snug font-medium">{interview.position?.title ?? interview.title}</h3><p className="text-ink-secondary text-sm">{interview.year}{displaySeason(interview.season) ? ` · ${displaySeason(interview.season)}` : ""}</p><div className="mt-auto flex flex-wrap gap-2"><Badge variant="default">{interview.stats.questionCount} questions</Badge>{interview.position?.category ? <Badge variant="topic">{interview.position.category}</Badge> : null}</div></CardContent></Link></Card></li>)}
      </ul>
    </section>
  );
}
