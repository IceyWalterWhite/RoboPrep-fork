import * as React from "react";

import { cn } from "@/lib/utils";

/** Placeholder block used while Server Components stream in. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("bg-surface-sunken animate-pulse rounded-sm", className)}
      {...props}
    />
  );
}
