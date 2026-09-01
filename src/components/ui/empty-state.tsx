import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Shown when a query returns nothing — never a blank page. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-line bg-surface flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="bg-surface-sunken text-ink-tertiary flex size-11 items-center justify-center rounded-full">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <h3 className="text-ink text-[1.0625rem] font-semibold tracking-[-0.01em]">
        {title}
      </h3>
      {description ? (
        <p className="text-ink-secondary max-w-sm text-sm leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
