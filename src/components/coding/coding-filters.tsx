import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import type { CodingSearchParams } from "@/lib/coding/filters";
import {
  CODING_CATEGORY_LABELS,
  CODING_DIFFICULTY_LABELS,
  CODING_SORT_LABELS,
  CODING_STATUS_LABELS,
} from "@/lib/coding/constants";
import type { CodingFilterOptions } from "@/types/coding";

export function CodingFilters({
  options,
  params,
}: {
  options: CodingFilterOptions;
  params: CodingSearchParams;
}) {
  return (
    <div className="border-line-subtle bg-surface-muted rounded-md border p-4">
      <form
        action="/coding"
        method="get"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
        <FilterSelect
          name="difficulty"
          label="难度"
          value={params.difficulty}
          options={options.difficulties.map((value) => ({
            value,
            label: CODING_DIFFICULTY_LABELS[value],
          }))}
        />
        <FilterSelect
          name="category"
          label="类别"
          value={params.category}
          options={options.categories.map((value) => ({
            value,
            label: CODING_CATEGORY_LABELS[value] ?? formatLabel(value),
          }))}
        />
        <FilterSelect
          name="topic"
          label="主题"
          value={params.topic}
          options={options.topics.map((topic) => ({
            value: topic.slug,
            label: topic.name,
          }))}
        />
        <FilterSelect
          name="status"
          label="进度"
          value={params.status}
          options={Object.entries(CODING_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <FilterSelect
          name="sort"
          label="排序"
          value={params.sort}
          options={Object.entries(CODING_SORT_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" size="sm">
            应用筛选
          </Button>
          <Link
            href="/coding"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            全部清除
          </Link>
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
        className="bg-surface text-ink border-line focus:outline-accent h-10 rounded-sm border px-3 text-sm focus:outline-2"
      >
        <option value="">全部</option>
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatLabel(value: string): string {
  const labels: Record<string, string> = {
    robot_learning: "机器人学习",
    software_engineering: "软件工程",
    machine_learning: "机器学习",
    transformer: "Transformer",
    diffusion: "Diffusion",
    robotics: "机器人学",
    algorithms: "算法",
  };
  return labels[value.toLowerCase()] ?? "其他";
}
