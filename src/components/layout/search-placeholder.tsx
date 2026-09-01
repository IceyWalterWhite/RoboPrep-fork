import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

/**
 * Visual placeholder for the Week 2 search box.
 *
 * Rendered as a read-only input so it is focusable and announced, but never
 * pretends to run a query.
 */
export function SearchPlaceholder({
  placeholder = "Search questions, topics, companies…",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full sm:w-80 ${className ?? ""}`}>
      <Search
        className="text-ink-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        readOnly
        aria-label="Search (coming soon)"
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
