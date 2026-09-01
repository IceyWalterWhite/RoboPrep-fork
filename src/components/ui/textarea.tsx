import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "bg-surface text-ink w-full rounded-sm border px-3 py-2 text-sm leading-relaxed",
          "placeholder:text-ink-tertiary",
          "transition-colors duration-150",
          "focus:outline-accent focus:outline-2 focus:outline-offset-0",
          "disabled:bg-surface-sunken disabled:cursor-not-allowed",
          invalid ? "border-danger" : "border-line",
          className,
        )}
        {...props}
      />
    );
  },
);
