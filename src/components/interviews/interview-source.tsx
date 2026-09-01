import { ExternalLink, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { displayEnum } from "@/lib/interviews/helpers";
import type { InterviewSource } from "@/types/interview";

const verificationLabels = {
  unverified: "Unverified",
  reviewed: "Reviewed",
  verified: "Verified",
} as const;

export function InterviewSource({ source }: { source: InterviewSource }) {
  const tone = source.verification === "verified" ? "published" : source.verification === "reviewed" ? "review" : "draft";
  return (
    <aside className="border-line-subtle bg-surface-muted rounded-md border p-5" aria-label="Source and verification">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="bg-accent-soft text-accent mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"><ShieldCheck className="size-4" aria-hidden /></span>
          <div className="flex flex-col gap-1">
            <h2 className="text-ink text-sm font-semibold">Source and verification</h2>
            <p className="text-ink-secondary text-sm">{source.label}</p>
          </div>
        </div>
        <Badge variant="status" tone={tone}>{verificationLabels[source.verification]}</Badge>
      </div>
      {source.type === "development_seed" ? <p className="text-ink-tertiary mt-4 text-xs leading-relaxed">This is structured development data for testing the Interview System. It is not presented as a verified real-world report.</p> : null}
      {source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-hover mt-4 inline-flex items-center gap-1.5 text-sm font-medium">View original source<ExternalLink className="size-3.5" aria-hidden /></a> : null}
      {source.type && source.type !== "development_seed" ? <p className="text-ink-tertiary mt-3 text-xs">{displayEnum(source.type)}</p> : null}
    </aside>
  );
}
