import * as React from "react";

import { cn } from "@/lib/utils";

export type ContainerWidth = "wide" | "content" | "reading";

const widthStyles: Record<ContainerWidth, string> = {
  wide: "max-w-wide",
  content: "max-w-content",
  reading: "max-w-reading",
};

/** Shared horizontal page container — keeps every route on the same rhythm. */
export function Container({
  width = "content",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { width?: ContainerWidth }) {
  return (
    <div
      className={cn("mx-auto w-full px-5 sm:px-8", widthStyles[width], className)}
      {...props}
    />
  );
}
