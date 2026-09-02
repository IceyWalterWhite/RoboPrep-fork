import { Search } from "lucide-react";

import type { InterviewSearchParams } from "@/lib/interviews/filters";
import { Input } from "@/components/ui/input";

export function InterviewSearch({ params }: { params: InterviewSearchParams }) {
  return (
    <form action="/interviews" method="get" className="relative w-full sm:w-96">
      <Search
        className="text-ink-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        name="q"
        defaultValue={params.q ?? ""}
        placeholder="搜索面试、问题和主题…"
        aria-label="搜索面试"
        className="pr-20 pl-9"
      />
      {hiddenFilterFields(params)}
      <button
        type="submit"
        className="text-accent hover:text-accent-hover absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium"
      >
        搜索
      </button>
    </form>
  );
}

export function hiddenFilterFields(params: InterviewSearchParams) {
  return (
    <>
      {params.company ? (
        <input type="hidden" name="company" value={params.company} />
      ) : null}
      {params.position ? (
        <input type="hidden" name="position" value={params.position} />
      ) : null}
      {params.year ? <input type="hidden" name="year" value={params.year} /> : null}
      {params.season ? (
        <input type="hidden" name="season" value={params.season} />
      ) : null}
      {params.experienceLevel ? (
        <input type="hidden" name="experienceLevel" value={params.experienceLevel} />
      ) : null}
      {params.employmentType ? (
        <input type="hidden" name="employmentType" value={params.employmentType} />
      ) : null}
      {params.difficulty ? (
        <input type="hidden" name="difficulty" value={params.difficulty} />
      ) : null}
      {params.sort !== "latest" ? (
        <input type="hidden" name="sort" value={params.sort} />
      ) : null}
    </>
  );
}
