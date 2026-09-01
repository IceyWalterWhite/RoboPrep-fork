import { z } from "zod";

import type { CodingFilters, CodingProblemStatus, CodingSort } from "@/types/coding";
import type { CodingDifficulty } from "@/types/database";

import { CODING_MAX_PAGE, CODING_PAGE_SIZE } from "./constants";

const slugParam = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a slug")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const codingParamsSchema = z.object({
  q: z.string().trim().max(120).transform((value) => (value ? value : undefined)).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  category: slugParam,
  topic: slugParam,
  status: z.enum(["solved", "attempted", "unsolved"]).optional(),
  company: slugParam,
  position: slugParam,
  sort: z.enum(["recommended", "difficulty", "acceptance", "newest"]).default("recommended"),
  page: z.coerce.number().int().min(1).max(CODING_MAX_PAGE).default(1),
});

export type CodingSearchParams = z.infer<typeof codingParamsSchema>;
type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCodingFilters(searchParams: RawSearchParams): CodingSearchParams {
  const raw = {
    q: first(searchParams.q),
    difficulty: first(searchParams.difficulty),
    category: first(searchParams.category),
    topic: first(searchParams.topic),
    status: first(searchParams.status),
    company: first(searchParams.company),
    position: first(searchParams.position),
    sort: first(searchParams.sort),
    page: first(searchParams.page),
  };
  const parsed = codingParamsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const fallback = codingParamsSchema.safeParse({ q: raw.q, category: raw.category, topic: raw.topic, sort: raw.sort });
  return fallback.success ? fallback.data : { sort: "recommended", page: 1 };
}

export function toCodingFilters(params: CodingSearchParams): CodingFilters {
  return {
    query: params.q,
    difficulty: params.difficulty satisfies CodingDifficulty | undefined,
    category: params.category,
    topic: params.topic,
    status: params.status satisfies CodingProblemStatus | undefined,
    company: params.company,
    position: params.position,
  };
}

export function filtersToQueryString(
  params: CodingSearchParams,
  overrides: Partial<Pick<CodingSearchParams, "q" | "difficulty" | "category" | "topic" | "status" | "company" | "position" | "sort" | "page">> = {},
): string {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  if (merged.q) search.set("q", merged.q);
  if (merged.difficulty) search.set("difficulty", merged.difficulty);
  if (merged.category) search.set("category", merged.category);
  if (merged.topic) search.set("topic", merged.topic);
  if (merged.status) search.set("status", merged.status);
  if (merged.company) search.set("company", merged.company);
  if (merged.position) search.set("position", merged.position);
  if (merged.sort && merged.sort !== "recommended") search.set("sort", merged.sort);
  if (merged.page && merged.page > 1) search.set("page", String(merged.page));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function codingPageSize(): number {
  return CODING_PAGE_SIZE;
}

export type { CodingSort };
