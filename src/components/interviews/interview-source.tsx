import { ExternalLink, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { displayEnum } from "@/lib/interviews/helpers";
import type { InterviewSource } from "@/types/interview";

const verificationLabels = {
  unverified: "未验证",
  reviewed: "已审核",
  verified: "已验证",
} as const;

export function InterviewSource({ source }: { source: InterviewSource }) {
  const tone =
    source.verification === "verified"
      ? "published"
      : source.verification === "reviewed"
        ? "review"
        : "draft";
  return (
    <aside
      className="border-line-subtle bg-surface-muted rounded-md border p-5"
      aria-label="来源与验证"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="bg-accent-soft text-accent mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-ink text-sm font-semibold">来源与验证</h2>
            <p className="text-ink-secondary text-sm">{source.label}</p>
          </div>
        </div>
        <Badge variant="status" tone={tone}>
          {verificationLabels[source.verification]}
        </Badge>
      </div>
      {source.type === "development_seed" ? (
        <p className="text-ink-tertiary mt-4 text-xs leading-relaxed">
          这是用于测试面试系统的结构化开发数据，不代表经过验证的真实面经。
        </p>
      ) : null}
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:text-accent-hover mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
        >
          查看原始来源
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : null}
      {source.type && source.type !== "development_seed" ? (
        <p className="text-ink-tertiary mt-3 text-xs">{displayEnum(source.type)}</p>
      ) : null}
    </aside>
  );
}
