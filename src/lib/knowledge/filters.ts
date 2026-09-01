import { z } from "zod";

import type { Difficulty, QuestionType } from "@/types/database";
import type { KnowledgeFilters } from "@/types/knowledge";

import { KNOWLEDGE_MAX_PAGE } from "./constants";

/**
 * URL is the source of truth for Knowledge filtering (Week 2 Task 4).
 *
 * `parseKnowledgeFilters` reads raw search params, validates and sanitises them,
 * and unknown/invalid values fall back safely instead of crashing the page.
 * `filtersToSearchParams` rebuilds a query string (used by pagination links) so
 * filters, search and sort survive page changes.
 */

const slugParam = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a slug")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const knowledgeParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .max(120)
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional(),
  topic: slugParam,
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  type: z
    .enum(["knowledge", "coding", "system_design", "research", "behavioral"])
    .optional(),
  company: slugParam,
  position: slugParam,
  sort: z
    .enum(["recommended", "most_asked", "trending", "newest"])
    .default("recommended"),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(KNOWLEDGE_MAX_PAGE)
    .default(1),
});

export type KnowledgeFilterParams = z.infer<typeof knowledgeParamsSchema>;

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseKnowledgeFilters(searchParams: RawSearchParams): KnowledgeFilterParams {
  const raw = {
    q: first(searchParams.q),
    topic: first(searchParams.topic),
    difficulty: first(searchParams.difficulty),
    type: first(searchParams.type),
    company: first(searchParams.company),
    position: first(searchParams.position),
    sort: first(searchParams.sort),
    page: first(searchParams.page),
  };

  const parsed = knowledgeParamsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  // Fall back field-by-field so one bad param does not nuke the others.
  const fallback = knowledgeParamsSchema.safeParse({
    q: raw.q,
    topic: raw.topic,
    difficulty: raw.difficulty,
    type: raw.type,
    company: raw.company,
  });
  if (fallback.success) return fallback.data;

  return { sort: "recommended", page: 1 };
}

/** Domain-view of the parsed params, consumed by the query layer. */
export function toFilters(params: KnowledgeFilterParams): KnowledgeFilters {
  return {
    query: params.q,
    topic: params.topic,
    difficulty: params.difficulty satisfies Difficulty | undefined,
    questionType: params.type satisfies QuestionType | undefined,
    company: params.company,
  };
}

/** Query string that preserves filters/search/sort, optionally overriding page. */
export function filtersToQueryString(
  params: KnowledgeFilterParams,
  overrides: Partial<Pick<KnowledgeFilterParams, "page" | "sort" | "q" | "topic" | "difficulty" | "type" | "company" | "position">> = {},
): string {
  const merged: KnowledgeFilterParams = { ...params, ...overrides };
  const sort = merged.sort ?? "recommended";
  const page = merged.page ?? 1;

  const search = new URLSearchParams();
  if (merged.q) search.set("q", merged.q);
  if (merged.topic) search.set("topic", merged.topic);
  if (merged.difficulty) search.set("difficulty", merged.difficulty);
  if (merged.type) search.set("type", merged.type);
  if (merged.company) search.set("company", merged.company);
  if (merged.position) search.set("position", merged.position);
  if (sort !== "recommended") search.set("sort", sort);
  if (page > 1) search.set("page", String(page));

  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : "";
}
