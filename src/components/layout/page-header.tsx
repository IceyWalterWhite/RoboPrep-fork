import * as React from "react";

import { cn } from "@/lib/utils";

/** Title + short description used at the top of every feature route. */
export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line-subtle flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">
          {title}
        </h1>
        {description ? (
          <p className="text-ink-secondary max-w-2xl text-[0.9375rem] leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}
