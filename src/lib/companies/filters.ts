import { z } from "zod";

/**
 * Company directory filters (Tasks 15, 16): URL-driven, real data only.
 */

const slugParam = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a slug")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const companyParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional(),
  filter: z.enum(["has_interviews", "has_coding", "recent"]).optional(),
  category: slugParam,
});

export type CompanySearchParams = z.infer<typeof companyParamsSchema>;
type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCompanyFilters(searchParams: RawSearchParams): CompanySearchParams {
  const parsed = companyParamsSchema.safeParse({
    q: first(searchParams.q),
    filter: first(searchParams.filter),
    category: first(searchParams.category),
  });
  if (parsed.success) return parsed.data;
  // Degrad safely: drop anything invalid rather than failing the page.
  const fallback = companyParamsSchema.safeParse({ q: first(searchParams.q) });
  return fallback.success ? fallback.data : {};
}

export function companyFiltersToQueryString(
  params: CompanySearchParams,
  overrides: Partial<CompanySearchParams> = {},
): string {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  if (merged.q) search.set("q", merged.q);
  if (merged.filter) search.set("filter", merged.filter);
  if (merged.category) search.set("category", merged.category);
  const query = search.toString();
  return query ? `?${query}` : "";
}
