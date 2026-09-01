import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders the error treatment and sets `aria-invalid`. */
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "bg-surface text-ink h-10 w-full rounded-sm border px-3 text-sm",
        "placeholder:text-ink-tertiary",
        "transition-colors duration-150",
        "focus:outline-accent focus:outline-2 focus:outline-offset-0",
        "disabled:bg-surface-sunken disabled:text-ink-tertiary disabled:cursor-not-allowed",
        invalid ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    />
  );
});
