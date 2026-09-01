import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { CodingSearchParams } from "@/lib/coding/filters";

export function CodingSearch({ params }: { params: CodingSearchParams }) {
  return (
    <form action="/coding" method="get" className="relative w-full sm:w-96">
      <Search
        className="text-ink-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        name="q"
        defaultValue={params.q ?? ""}
        placeholder="Search coding problems…"
        aria-label="Search coding problems"
        className="pl-9 pr-20"
      />
      {hiddenFields(params)}
      <button
        type="submit"
        className="text-accent hover:text-accent-hover absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium"
      >
        Search
      </button>
    </form>
  );
}

function hiddenFields(params: CodingSearchParams) {
  return (
    <>
      {params.difficulty ? <input type="hidden" name="difficulty" value={params.difficulty} /> : null}
      {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
      {params.topic ? <input type="hidden" name="topic" value={params.topic} /> : null}
      {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
      {params.sort !== "recommended" ? <input type="hidden" name="sort" value={params.sort} /> : null}
    </>
  );
}
