import { z } from "zod";

import type {
  InterviewDifficulty,
  InterviewEmploymentType,
  InterviewExperienceLevel,
  InterviewFilters,
  InterviewSort,
} from "@/types/interview";

import { INTERVIEW_MAX_PAGE, INTERVIEW_PAGE_SIZE } from "./constants";

const slugParam = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a slug")
  .optional()
  .or(z.literal("").transform(() => undefined));

const seasonParam = z
  .enum(["spring", "summer", "autumn", "fall", "winter"])
  .transform((value) => (value === "fall" ? "autumn" : value))
  .optional();

export const interviewParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .max(120)
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional(),
  company: slugParam,
  position: slugParam,
  year: z.coerce.number().int().min(1990).max(2100).optional(),
  season: seasonParam,
  experienceLevel: z
    .enum(["intern", "new_grad", "experienced", "unknown"])
    .optional(),
  employmentType: z
    .enum(["internship", "full_time", "contract", "unknown"])
    .optional(),
  difficulty: z.enum(["easy", "medium", "hard", "unknown"]).optional(),
  sort: z.enum(["latest", "most_questions", "difficulty"]).default("latest"),
  page: z.coerce.number().int().min(1).max(INTERVIEW_MAX_PAGE).default(1),
});

export type InterviewSearchParams = z.infer<typeof interviewParamsSchema>;
type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseInterviewFilters(
  searchParams: RawSearchParams,
): InterviewSearchParams {
  const raw = {
    q: first(searchParams.q),
    company: first(searchParams.company),
    position: first(searchParams.position),
    year: first(searchParams.year),
    season: first(searchParams.season)?.toLowerCase(),
    experienceLevel: first(searchParams.experienceLevel),
    employmentType: first(searchParams.employmentType),
    difficulty: first(searchParams.difficulty),
    sort: first(searchParams.sort),
    page: first(searchParams.page),
  };

  const parsed = interviewParamsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  // Keep valid fields when one untrusted URL value is malformed.
  const fallback = interviewParamsSchema.safeParse({
    q: raw.q,
    company: raw.company,
    position: raw.position,
    season: raw.season,
    sort: raw.sort,
  });
  return fallback.success ? fallback.data : { sort: "latest", page: 1 };
}

export function toInterviewFilters(
  params: InterviewSearchParams,
): InterviewFilters {
  return {
    query: params.q,
    company: params.company,
    position: params.position,
    year: params.year,
    season: params.season,
    experienceLevel: params.experienceLevel satisfies
      | InterviewExperienceLevel
      | undefined,
    employmentType: params.employmentType satisfies
      | InterviewEmploymentType
      | undefined,
    difficulty: params.difficulty satisfies InterviewDifficulty | undefined,
  };
}

export function filtersToQueryString(
  params: InterviewSearchParams,
  overrides: Partial<
    Pick<
      InterviewSearchParams,
      | "q"
      | "company"
      | "position"
      | "year"
      | "season"
      | "experienceLevel"
      | "employmentType"
      | "difficulty"
      | "sort"
      | "page"
    >
  > = {},
): string {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  if (merged.q) search.set("q", merged.q);
  if (merged.company) search.set("company", merged.company);
  if (merged.position) search.set("position", merged.position);
  if (merged.year) search.set("year", String(merged.year));
  if (merged.season) search.set("season", merged.season);
  if (merged.experienceLevel) search.set("experienceLevel", merged.experienceLevel);
  if (merged.employmentType) search.set("employmentType", merged.employmentType);
  if (merged.difficulty) search.set("difficulty", merged.difficulty);
  if (merged.sort && merged.sort !== "latest") search.set("sort", merged.sort);
  if (merged.page && merged.page > 1) search.set("page", String(merged.page));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function pageSize(): number {
  return INTERVIEW_PAGE_SIZE;
}

export type { InterviewSort };
