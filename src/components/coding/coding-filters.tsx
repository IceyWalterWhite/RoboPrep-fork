import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import type { CodingSearchParams } from "@/lib/coding/filters";
import { CODING_DIFFICULTY_LABELS, CODING_SORT_LABELS, CODING_STATUS_LABELS } from "@/lib/coding/constants";
import type { CodingFilterOptions } from "@/types/coding";

export function CodingFilters({ options, params }: { options: CodingFilterOptions; params: CodingSearchParams }) {
  return (
    <div className="border-line-subtle bg-surface-muted rounded-md border p-4">
      <form action="/coding" method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
        <FilterSelect
          name="difficulty"
          label="Difficulty"
          value={params.difficulty}
          options={options.difficulties.map((value) => ({ value, label: CODING_DIFFICULTY_LABELS[value] }))}
        />
        <FilterSelect
          name="category"
          label="Category"
          value={params.category}
          options={options.categories.map((value) => ({ value, label: formatLabel(value) }))}
        />
        <FilterSelect
          name="topic"
          label="Topic"
          value={params.topic}
          options={options.topics.map((topic) => ({ value: topic.slug, label: topic.name }))}
        />
        <FilterSelect
          name="status"
          label="Progress"
          value={params.status}
          options={Object.entries(CODING_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          name="sort"
          label="Sort"
          value={params.sort}
          options={Object.entries(CODING_SORT_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" size="sm">Apply filters</Button>
          <Link href="/coding" className={buttonVariants({ variant: "ghost", size: "sm" })}>Clear all</Link>
        </div>
      </form>
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-ink-secondary text-xs font-medium">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="bg-surface text-ink border-line h-10 rounded-sm border px-3 text-sm focus:outline-accent focus:outline-2"
      >
        <option value="">All</option>
        {options.map((option) => <option key={`${name}-${option.value}`} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
