import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "topic" | "difficulty" | "status";

/** Difficulty and status badges pick their own colour from `tone`. */
export type BadgeTone =
  "easy" | "medium" | "hard" | "published" | "draft" | "review" | "rejected";

const baseStyles =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-sunken text-ink-secondary",
  topic: "bg-accent-soft text-accent",
  difficulty: "bg-surface-sunken text-ink-secondary",
  status: "bg-surface-sunken text-ink-secondary",
};

const toneStyles: Record<BadgeTone, string> = {
  easy: "bg-success/10 text-success-ink",
  medium: "bg-warning/15 text-warning-ink",
  hard: "bg-danger/10 text-danger-ink",
  published: "bg-success/10 text-success-ink",
  draft: "bg-surface-sunken text-ink-tertiary",
  review: "bg-warning/15 text-warning-ink",
  rejected: "bg-danger/10 text-danger-ink",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  tone?: BadgeTone;
}

export function Badge({ className, variant = "default", tone, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        tone ? toneStyles[tone] : null,
        className,
      )}
      {...props}
    />
  );
}
