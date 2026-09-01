import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { RelationType } from "@/types/database";
import type {
  KnowledgeQuestionDetail,
  KnowledgeQuestionSummary,
  KnowledgeSort,
  KnowledgeTopic,
  KnowledgeTopicDetail,
  KnowledgeTopicNode,
  KnowledgeTopicRef,
  PaginatedResult,
  QuestionOccurrence,
  QuestionRelationGroup,
} from "@/types/knowledge";

import { KNOWLEDGE_PAGE_SIZE, TRENDING_LIMIT } from "./constants";
import {
  buildTopicTree,
  descendantTopicIds,
  mapOccurrence,
  mapQuestionDetail,
  mapQuestionSummary,
  mapTopic,
  type OccurrenceRow,
} from "./mappers";
import type { QuestionWithStatsRow } from "./rows";
import type { KnowledgeFilterParams } from "./filters";

/**
 * All Knowledge database reads live here (Week 2 Task 3).
 *
 * Pages must not talk to Supabase directly. Every function degrades to an empty
 * result when Supabase is unconfigured or unreachable.
 */

function warn(context: string, error: { message: string }) {
  console.warn(`[knowledge] ${context} failed: ${error.message}`);
}

function emptyPage(
  page: number,
  pageSize: number,
): PaginatedResult<KnowledgeQuestionSummary> {
  return { items: [], page, pageSize, total: 0, totalPages: 1 };
}

/** Escape user input for ILIKE patterns and PostgREST `or()` syntax. */
function toIlikePattern(query: string): string {
  const cleaned = query.replace(/[%_,()\\]/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) return "";
  return `%${cleaned.replace(/[\\%_]/g, "\\$&")}%`;
}

/** Topic refs for a set of questions, keyed by question id. */
async function topicsForQuestions(
  questionIds: string[],
): Promise<Map<string, KnowledgeTopicRef[]>> {
  const result = new Map<string, KnowledgeTopicRef[]>();
  if (questionIds.length === 0) return result;

  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase
    .from("question_topics")
    .select("question_id, topic_id")
    .in("question_id", questionIds);

  if (linksError) {
    warn("topicsForQuestions/links", linksError);
    return result;
  }

  const topicIds = [...new Set((links ?? []).map((link) => link.topic_id))];
  if (topicIds.length === 0) return result;

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id, name, slug")
    .in("id", topicIds);

  if (topicsError) {
    warn("topicsForQuestions/topics", topicsError);
    return result;
  }

  const topicById = new Map((topics ?? []).map((topic) => [topic.id, topic]));

  for (const link of links ?? []) {
    const topic = topicById.get(link.topic_id);
    if (!topic) continue;
    const refs = result.get(link.question_id) ?? [];
    refs.push({ name: topic.name, slug: topic.slug });
    result.set(link.question_id, refs);
  }

  return result;
}

// ---------------------------------------------------------------------------
// topic / company resolution
// ---------------------------------------------------------------------------

async function publishedQuestionIdsForTopics(
  topicIds: string[],
): Promise<string[]> {
  if (topicIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_topics")
    .select("question_id")
    .in("topic_id", topicIds);
  if (error) {
    warn("publishedQuestionIdsForTopics", error);
    return [];
  }
  return [
    ...new Set(
      (data ?? [])
        .map((row) => row.question_id)
        .filter((id): id is string => id !== null),
    ),
  ];
}

async function publishedQuestionIdsForCompany(
  companySlug: string,
  positionSlug?: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", companySlug)
    .maybeSingle();
  if (!company) return [];

  // Week 7 (Task 73): optional position filter, validated against the company
  // so /knowledge?company=x&position=y only ever matches a y owned by x.
  let positionId: string | null = null;
  if (positionSlug) {
    const { data: position } = await supabase
      .from("positions")
      .select("id, company_id")
      .eq("slug", positionSlug)
      .eq("company_id", company.id)
      .maybeSingle();
    if (!position) return [];
    positionId = position.id;
  }

  let interviewQuery = supabase
    .from("interviews")
    .select("id")
    .eq("company_id", company.id)
    .eq("status", "published");
  if (positionId) interviewQuery = interviewQuery.eq("position_id", positionId);
  const { data: interviews, error } = await interviewQuery;
  if (error) {
    warn("publishedQuestionIdsForCompany/interviews", error);
    return [];
  }
  const interviewIds = (interviews ?? []).map((row) => row.id);
  if (interviewIds.length === 0) return [];

  const { data: links, error: linksError } = await supabase
    .from("interview_questions")
    .select("question_id")
    .in("interview_id", interviewIds);
  if (linksError) {
    warn("publishedQuestionIdsForCompany/links", linksError);
    return [];
  }
  return [
    ...new Set(
      (links ?? [])
        .map((row) => row.question_id)
        .filter((id): id is string => id !== null),
    ),
  ];
}

// ---------------------------------------------------------------------------
// question list
// ---------------------------------------------------------------------------

export async function getKnowledgeQuestions(options: {
  filters?: KnowledgeFilterParams;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<KnowledgeQuestionSummary>> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? KNOWLEDGE_PAGE_SIZE));
  const filters = options.filters ?? { sort: "recommended", page } as KnowledgeFilterParams;
  const sort: KnowledgeSort = filters.sort ?? "recommended";

  if (!isSupabaseConfigured) return emptyPage(page, pageSize);

  const supabase = await createClient();
  let query = supabase
    .from("questions_with_stats")
    .select("*", { count: "exact" })
    .eq("is_published", true);

  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters.type) query = query.eq("question_type", filters.type);

  // Topic filter includes descendants, so "rl" also surfaces PPO/GRPO questions.
  if (filters.topic) {
    const topicIds = await topicIdsForSlugWithDescendants(filters.topic);
    const questionIds = await publishedQuestionIdsForTopics(topicIds);
    if (questionIds.length === 0) return emptyPage(page, pageSize);
    query = query.in("id", questionIds);
  }

  if (filters.company) {
    const questionIds = await publishedQuestionIdsForCompany(filters.company, filters.position);
    if (questionIds.length === 0) return emptyPage(page, pageSize);
    query = query.in("id", questionIds);
  }

  if (filters.q) {
    const pattern = toIlikePattern(filters.q);
    if (pattern === "% %") return emptyPage(page, pageSize);

    // Search also matches topic names, e.g. "GRPO" hits questions tagged GRPO.
    const supabaseForTopics = await createClient();
    const { data: matchedTopics } = await supabaseForTopics
      .from("topics")
      .select("id")
      .ilike("name", pattern);

    const topicQuestionIds = await publishedQuestionIdsForTopics(
      (matchedTopics ?? []).map((row) => row.id),
    );

    const orParts = [`title.ilike.${pattern}`, `summary.ilike.${pattern}`];
    if (topicQuestionIds.length > 0) {
      orParts.push(`id.in.(${topicQuestionIds.join(",")})`);
    }
    query = query.or(orParts.join(","));
  }

  // Sorting happens in the database via the questions_with_stats view.
  switch (sort) {
    case "most_asked":
      query = query
        .order("interview_count", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false });
      break;
    case "trending":
      query = query
        .order("trend_score", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "recommended":
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("interview_count", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false });
      break;
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);

  if (error || !data) {
    if (error) warn("getKnowledgeQuestions", error);
    return emptyPage(page, pageSize);
  }

  const rows = data as QuestionWithStatsRow[];
  const topicMap = await topicsForQuestions(rows.map((row) => row.id));
  const total = count ?? rows.length;

  return {
    items: rows.map((row) =>
      mapQuestionSummary(row, topicMap.get(row.id) ?? []),
    ),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function topicIdsForSlugWithDescendants(slug: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!topic) return [];

  const { data: allTopics } = await supabase
    .from("topics")
    .select("id, parent_id");
  const descendants = descendantTopicIds(
    (allTopics ?? []).map((row) => ({ id: row.id, parentId: row.parent_id })),
    topic.id,
  );
  return [topic.id, ...descendants];
}

// ---------------------------------------------------------------------------
// question detail
// ---------------------------------------------------------------------------

export async function getKnowledgeQuestionBySlug(
  slug: string,
): Promise<KnowledgeQuestionDetail | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("questions_with_stats")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    warn("getKnowledgeQuestionBySlug", error);
    return null;
  }
  if (!row) return null;

  const topicMap = await topicsForQuestions([row.id]);
  return mapQuestionDetail(row as QuestionWithStatsRow, topicMap.get(row.id) ?? []);
}

// ---------------------------------------------------------------------------
// topics
// ---------------------------------------------------------------------------

export async function getKnowledgeTopics(): Promise<KnowledgeTopic[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const [{ data: topics, error }, { data: links }, { data: published }] =
    await Promise.all([
      supabase.from("topics").select("id, name, slug, parent_id, description").order("name"),
      supabase.from("question_topics").select("question_id, topic_id"),
      supabase.from("questions").select("id").eq("is_published", true),
    ]);

  if (error || !topics) {
    if (error) warn("getKnowledgeTopics", error);
    return [];
  }

  const publishedIds = new Set((published ?? []).map((row) => row.id));
  const counts = new Map<string, number>();
  for (const link of links ?? []) {
    if (!publishedIds.has(link.question_id)) continue;
    counts.set(link.topic_id, (counts.get(link.topic_id) ?? 0) + 1);
  }

  return topics.map((row) => mapTopic(row, counts.get(row.id) ?? 0));
}

export async function getKnowledgeTopicBySlug(
  slug: string,
): Promise<KnowledgeTopicDetail | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("topics")
    .select("id, name, slug, parent_id, description")
    .eq("slug", slug)
    .maybeSingle();
  if (!row) return null;

  const { data: allTopics } = await supabase
    .from("topics")
    .select("id, name, slug, parent_id, description");

  const topics = (allTopics ?? []).map((item) => mapTopic(item));
  const parent = topics.find((item) => item.id === row.parent_id) ?? null;
  const children = topics.filter((item) => item.parentId === row.id);

  const scopeIds = [row.id, ...descendantTopicIds(topics, row.id)];
  const questionIds = await publishedQuestionIdsForTopics(scopeIds);

  return {
    ...mapTopic(row, questionIds.length),
    parent,
    children,
  };
}

/** Full taxonomy as a renderable tree; cycle/malformed-data safe. */
export async function getTopicTree(): Promise<KnowledgeTopicNode[]> {
  const topics = await getKnowledgeTopics();
  return buildTopicTree(topics);
}

// ---------------------------------------------------------------------------
// question graph
// ---------------------------------------------------------------------------

export const RELATION_GROUP_ORDER: RelationType[] = [
  "prerequisite",
  "related",
  "contrast",
];

async function summariesForRelationRows(
  relations: { target_question_id: string; relation_type: RelationType; weight: number }[],
  excludeId?: string,
): Promise<QuestionRelationGroup[]> {
  const supabase = await createClient();
  const targetIds = [
    ...new Set(
      relations
        .map((relation) => relation.target_question_id)
        .filter((id) => id !== excludeId),
    ),
  ];
  if (targetIds.length === 0) return [];

  const { data: rows, error } = await supabase
    .from("questions_with_stats")
    .select("*")
    .eq("is_published", true)
    .in("id", targetIds);

  if (error || !rows) {
    if (error) warn("summariesForRelationRows", error);
    return [];
  }

  const topicMap = await topicsForQuestions((rows as QuestionWithStatsRow[]).map((row) => row.id));
  const summaryById = new Map(
    (rows as QuestionWithStatsRow[]).map((row) => [
      row.id,
      mapQuestionSummary(row, topicMap.get(row.id) ?? []),
    ]),
  );

  const groups = new Map<RelationType, KnowledgeQuestionSummary[]>();
  const seen = new Set<string>();

  // Higher weight first; dedupe a target that appears in several relations.
  const ordered = [...relations].sort((a, b) => b.weight - a.weight);
  for (const relation of ordered) {
    if (relation.target_question_id === excludeId) continue;
    const summary = summaryById.get(relation.target_question_id);
    if (!summary || seen.has(summary.id)) continue;
    seen.add(summary.id);
    const group = groups.get(relation.relation_type) ?? [];
    group.push(summary);
    groups.set(relation.relation_type, group);
  }

  return RELATION_GROUP_ORDER.filter((type) => groups.has(type)).map((type) => ({
    relationType: type,
    questions: groups.get(type) ?? [],
  }));
}

export async function getRelatedQuestions(
  questionId: string,
  types: RelationType[] = ["related", "prerequisite", "contrast"],
): Promise<QuestionRelationGroup[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data: relations, error } = await supabase
    .from("question_relations")
    .select("target_question_id, relation_type, weight")
    .eq("source_question_id", questionId)
    .in("relation_type", types);

  if (error) {
    warn("getRelatedQuestions", error);
    return [];
  }
  return summariesForRelationRows(relations ?? [], questionId);
}

export async function getFollowUpQuestions(
  questionId: string,
): Promise<KnowledgeQuestionSummary[]> {
  const groups = await getRelatedQuestions(questionId, ["follow_up"]);
  return groups.flatMap((group) => group.questions);
}

// ---------------------------------------------------------------------------
// interview occurrences
// ---------------------------------------------------------------------------

export async function getQuestionOccurrences(
  questionId: string,
  limit = 20,
): Promise<QuestionOccurrence[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data: links, error: linksError } = await supabase
    .from("interview_questions")
    .select("interview_id, original_wording, round_number, round_id")
    .eq("question_id", questionId);

  if (linksError) {
    warn("getQuestionOccurrences/links", linksError);
    return [];
  }
  if (!links || links.length === 0) return [];

  const { data: interviews, error } = await supabase
    .from("interviews")
    .select("*")
    .in(
      "id",
      links.map((link) => link.interview_id),
    )
    .eq("status", "published")
    .order("year", { ascending: false })
    .limit(limit);

  if (error || !interviews) {
    if (error) warn("getQuestionOccurrences/interviews", error);
    return [];
  }

  const companyIds = [...new Set(interviews.map((row) => row.company_id))];
  const positionIds = [
    ...new Set(
      interviews
        .map((row) => row.position_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const [companiesResult, positionsResult] = await Promise.all([
    companyIds.length
      ? supabase.from("companies").select("id, name, slug").in("id", companyIds)
      : Promise.resolve({ data: [], error: null }),
    positionIds.length
      ? supabase.from("positions").select("id, title").in("id", positionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (companiesResult.error) warn("getQuestionOccurrences/companies", companiesResult.error);
  if (positionsResult.error) warn("getQuestionOccurrences/positions", positionsResult.error);

  const companyById = new Map(
    (companiesResult.data ?? []).map((row) => [row.id, row]),
  );
  const positionById = new Map(
    (positionsResult.data ?? []).map((row) => [row.id, row]),
  );
  const wordingByInterview = new Map(
    links.map((link) => [link.interview_id, link.original_wording]),
  );
  const roundIds = [
    ...new Set(
      links
        .map((link) => link.round_id)
        .filter((id): id is string => id !== null),
    ),
  ];
  const { data: rounds, error: roundsError } = roundIds.length
    ? await supabase.from("interview_rounds").select("id, round_number, title").in("id", roundIds)
    : { data: [], error: null };
  if (roundsError) warn("getQuestionOccurrences/rounds", roundsError);
  const roundById = new Map((rounds ?? []).map((round) => [round.id, round]));
  const occurrenceByInterview = new Map(
    links.map((link) => {
      const round = link.round_id ? roundById.get(link.round_id) : null;
      return [
        link.interview_id,
        {
          wording: link.original_wording,
          roundNumber: round?.round_number ?? link.round_number,
          roundTitle: round?.title ?? null,
        },
      ] as const;
    }),
  );

  return interviews
    .map((interview): OccurrenceRow => ({
      interview,
      interviewSlug: interview.slug,
      position: interview.position_id
        ? positionById.get(interview.position_id) ?? null
        : null,
      company: companyById.get(interview.company_id) ?? null,
      originalWording: wordingByInterview.get(interview.id) ?? null,
      roundNumber: occurrenceByInterview.get(interview.id)?.roundNumber ?? null,
      roundTitle: occurrenceByInterview.get(interview.id)?.roundTitle ?? null,
    }))
    .map(mapOccurrence);
}

// ---------------------------------------------------------------------------
// curated surfaces
// ---------------------------------------------------------------------------

export async function getFeaturedKnowledgeQuestions(
  limit = 4,
): Promise<KnowledgeQuestionSummary[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions_with_stats")
    .select("*")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("interview_count", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) {
    if (error) warn("getFeaturedKnowledgeQuestions", error);
    return [];
  }

  const rows = data as QuestionWithStatsRow[];
  const topicMap = await topicsForQuestions(rows.map((row) => row.id));
  return rows.map((row) => mapQuestionSummary(row, topicMap.get(row.id) ?? []));
}

export async function getTrendingKnowledgeQuestions(
  limit = TRENDING_LIMIT,
): Promise<KnowledgeQuestionSummary[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions_with_stats")
    .select("*")
    .eq("is_published", true)
    .gt("trend_score", 0)
    .order("trend_score", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) warn("getTrendingKnowledgeQuestions", error);
    return [];
  }

  const rows = data as QuestionWithStatsRow[];
  const topicMap = await topicsForQuestions(rows.map((row) => row.id));
  return rows.map((row) => mapQuestionSummary(row, topicMap.get(row.id) ?? []));
}
