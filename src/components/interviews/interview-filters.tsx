import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import type { InterviewFilterOptions } from "@/types/interview";
import type { InterviewSearchParams } from "@/lib/interviews/filters";
import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  INTERVIEW_DIFFICULTY_LABELS,
  INTERVIEW_SORT_LABELS,
} from "@/lib/interviews/constants";
import { displaySeason } from "@/lib/interviews/helpers";

export function InterviewFilters({
  options,
  params,
}: {
  options: InterviewFilterOptions;
  params: InterviewSearchParams;
}) {
  return (
    <div className="border-line-subtle bg-surface-muted rounded-md border p-4">
      <form
        action="/interviews"
        method="get"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
        <FilterSelect
          name="company"
          label="公司"
          value={params.company}
          options={options.companies.map((item) => ({
            value: item.slug,
            label: item.name,
          }))}
        />
        <FilterSelect
          name="position"
          label="岗位"
          value={params.position}
          options={options.positions.map((item) => ({
            value: item.slug,
            label: item.companySlug
              ? `${item.title} · ${item.companySlug}`
              : item.title,
          }))}
        />
        <FilterSelect
          name="year"
          label="年份"
          value={params.year ? String(params.year) : undefined}
          options={options.years.map((year) => ({
            value: String(year),
            label: String(year),
          }))}
        />
        <FilterSelect
          name="season"
          label="季节"
          value={params.season}
          options={options.seasons.map((season) => ({
            value: season.toLowerCase(),
            label: displaySeason(season) ?? "未注明季节",
          }))}
        />
        <FilterSelect
          name="experienceLevel"
          label="经验"
          value={params.experienceLevel}
          options={Object.entries(EXPERIENCE_LEVEL_LABELS)
            .filter(([value]) => value !== "unknown")
            .map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          name="employmentType"
          label="雇佣类型"
          value={params.employmentType}
          options={Object.entries(EMPLOYMENT_TYPE_LABELS)
            .filter(([value]) => value !== "unknown")
            .map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          name="difficulty"
          label="难度"
          value={params.difficulty}
          options={Object.entries(INTERVIEW_DIFFICULTY_LABELS)
            .filter(([value]) => value !== "unknown")
            .map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          name="sort"
          label="排序"
          value={params.sort}
          options={Object.entries(INTERVIEW_SORT_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" size="sm">
            应用筛选
          </Button>
          <Link
            href="/interviews"
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
