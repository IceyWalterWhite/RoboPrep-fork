import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";
import type {
  CompanyCodingProblemStat,
  CompanyDifficultyStat,
  CompanyPositionStat,
  CompanyQuestionStat,
  CompanyRoundTypeStat,
  CompanySeasonStat,
  CompanyTopicStat,
} from "@/types/company-intelligence";

import { median, normalizeSeason } from "./helpers";
import {
  mapCodingProblemStat,
  mapDifficultyStat,
  mapPositionStat,
  mapQuestionStat,
  mapRoundTypeStat,
  mapSeasonStat,
  mapTopicStat,
} from "./mappers";

/**
 * Company intelligence query layer (Task 11): every company analytics read is
 * centralized here, batched to avoid N+1, and restricted to published data.
 * Cache tables are accelerators, never truth sources.
 */

type Client = SupabaseClient<Database>;

async function client(): Promise<Client | null> {
  if (!isSupabaseConfigured) return null;
  return createClient();
}

function warn(context: string, message: string): void {
  console.warn(`[companies] ${context}: ${message}`);
}

// ---------------------------------------------------------------------------
// Directory
// ---------------------------------------------------------------------------

export interface CompanyDirectoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  country: string | null;
  interviewCount: number;
  positionCount: number;
  latestInterviewAt: string | null;
  codingOccurrenceCount: number;
}

/** Directory with cached counts; sorted by name (no prestige ranking). */
export async function getCompanyDirectory(options: {
  q?: string;
  hasInterviews?: boolean;
  hasCoding?: boolean;
  recentActivity?: boolean;
} = {}): Promise<CompanyDirectoryRow[]> {
  const supabase = await client();
  if (!supabase) return [];

  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, slug, description, country")
    .order("name");
  if (error || !companies) {
    if (error) warn("getCompanyDirectory", error.message);
    return [];
  }

  const companyIds = companies.map((company) => company.id);
  const { data: stats } = await supabase.from("company_stats").select("*").in("company_id", companyIds);

  const statsById = new Map((stats ?? []).map((row) => [row.company_id, row]));

  const rows = companies.map((company) => {
    const stat = statsById.get(company.id);
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description,
      country: company.country,
      interviewCount: stat?.published_interview_count ?? 0,
      positionCount: stat?.position_count ?? 0,
      latestInterviewAt: stat?.latest_interview_at ?? null,
      codingOccurrenceCount: stat?.coding_question_occurrence_count ?? 0,
    };
  });

  const cutoff = Date.now() - 180 * 24 * 3_600_000;
  return rows.filter((row) => {
    if (options.q) {
      const needle = options.q.toLowerCase();
      const haystack = `${row.name} ${row.description ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (options.hasInterviews && row.interviewCount === 0) return false;
    if (options.hasCoding && row.codingOccurrenceCount === 0) return false;
    if (options.recentActivity) {
      if (!row.latestInterviewAt || new Date(row.latestInterviewAt).getTime() < cutoff) return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Company identity + summary stats
// ---------------------------------------------------------------------------

export async function getCompanyBySlug(slug: string): Promise<{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  country: string | null;
} | null> {
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase
    .from("companies")
    .select("id, name, slug, description, country")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

export interface CompanyStatsSummary {
  publishedInterviewCount: number;
  positionCount: number;
  latestInterviewAt: string | null;
}

export async function getCompanyStats(companyId: string): Promise<CompanyStatsSummary | null> {
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase.from("company_stats").select("*").eq("company_id", companyId).maybeSingle();
  if (!data) return { publishedInterviewCount: 0, positionCount: 0, latestInterviewAt: null };
  return {
    publishedInterviewCount: data.published_interview_count,
    positionCount: data.position_count,
    latestInterviewAt: data.latest_interview_at,
  };
}

// ---------------------------------------------------------------------------
// Ranked intelligence lists
// ---------------------------------------------------------------------------

export async function getCompanyTopTopics(companyId: string, limit = 8): Promise<CompanyTopicStat[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("company_topic_stats")
    .select("*")
    .eq("company_id", companyId)
    .order("share_of_interviews", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: topics } = await supabase
    .from("topics")
    .select("id, name, slug")
    .in("id", rows.map((row) => row.topic_id));
  const topicById = new Map((topics ?? []).map((topic) => [topic.id, topic]));
  return rows
    .filter((row) => topicById.has(row.topic_id))
    .map((row) => mapTopicStat(row, topicById.get(row.topic_id)!));
}

export async function getCompanyTopQuestions(companyId: string, limit = 8): Promise<CompanyQuestionStat[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("company_question_stats")
    .select("*")
    .eq("company_id", companyId)
    .order("interview_count", { ascending: false })
    .order("occurrence_count", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: questions } = await supabase
    .from("questions")
    .select("id, title, slug, question_type")
    .in("id", rows.map((row) => row.question_id));
  const questionById = new Map((questions ?? []).map((question) => [question.id, question]));
  return rows
    .filter((row) => questionById.has(row.question_id))
    .map((row) => {
      const question = questionById.get(row.question_id)!;
      return mapQuestionStat(row, {
        title: question.title,
        slug: question.slug,
        question_type: question.question_type,
      });
    });
}

export async function getCompanyTopCodingProblems(companyId: string, limit = 8): Promise<CompanyCodingProblemStat[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("company_coding_problem_stats")
    .select("*")
    .eq("company_id", companyId)
    .order("interview_count", { ascending: false })
    .order("occurrence_count", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: problems } = await supabase
    .from("coding_problems")
    .select("id, title, slug, difficulty")
    .in("id", rows.map((row) => row.coding_problem_id));
  const problemById = new Map((problems ?? []).map((problem) => [problem.id, problem]));
  return rows
    .filter((row) => problemById.has(row.coding_problem_id))
    .map((row) => {
      const problem = problemById.get(row.coding_problem_id)!;
      return mapCodingProblemStat(row, {
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
      });
    });
}

export async function getCompanyPositions(companyId: string): Promise<CompanyPositionStat[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("company_position_stats")
    .select("*")
    .eq("company_id", companyId)
    .order("interview_count", { ascending: false });
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: positions } = await supabase
    .from("positions")
    .select("id, title, slug")
    .in("id", rows.map((row) => row.position_id));
  const positionById = new Map((positions ?? []).map((position) => [position.id, position]));
  return rows
    .filter((row) => positionById.has(row.position_id))
    .map((row) => {
      const position = positionById.get(row.position_id)!;
      return mapPositionStat(row, { title: position.title, slug: position.slug });
    });
}

export async function getCompanySeasonStats(companyId: string): Promise<CompanySeasonStat[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("company_season_stats")
    .select("*")
    .eq("company_id", companyId)
    .order("year", { ascending: false })
    .order("season");
  return (data ?? []).map(mapSeasonStat);
}

export async function getCompanyDifficultyStats(companyId: string): Promise<CompanyDifficultyStat | null> {
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase
    .from("company_difficulty_stats")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();
  return data ? mapDifficultyStat(data) : null;
}

export async function getCompanyRoundTypeStats(companyId: string): Promise<CompanyRoundTypeStat[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("company_round_type_stats")
    .select("*")
    .eq("company_id", companyId)
    .order("round_count", { ascending: false });
  return (data ?? []).map(mapRoundTypeStat);
}

// ---------------------------------------------------------------------------
// Emphasis + structure
// ---------------------------------------------------------------------------

export interface CompanyEmphasis {
  knowledgeOccurrences: number;
  codingOccurrences: number;
  unclassifiedOccurrences: number;
  totalOccurrences: number;
}

/**
 * Task 28: coding vs knowledge emphasis over all question occurrences in
 * published interviews. Occurrences linked to neither a canonical question
 * nor a coding problem are "unclassified".
 */
export async function getCompanyEmphasis(companyId: string): Promise<CompanyEmphasis> {
  const supabase = await client();
  if (!supabase) return { knowledgeOccurrences: 0, codingOccurrences: 0, unclassifiedOccurrences: 0, totalOccurrences: 0 };

  const { data: interviews } = await supabase
    .from("interviews")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "published");
  const interviewIds = (interviews ?? []).map((row) => row.id);
  if (interviewIds.length === 0) {
    return { knowledgeOccurrences: 0, codingOccurrences: 0, unclassifiedOccurrences: 0, totalOccurrences: 0 };
  }

  const { data: occurrences } = await supabase
    .from("interview_questions")
    .select("question_id, coding_problem_id")
    .in("interview_id", interviewIds);

  let knowledge = 0;
  let coding = 0;
  for (const row of occurrences ?? []) {
    if (row.coding_problem_id) coding += 1;
    else if (row.question_id) knowledge += 1;
  }
  const total = (occurrences ?? []).length;
  return {
    knowledgeOccurrences: knowledge,
    codingOccurrences: coding,
    unclassifiedOccurrences: total - knowledge - coding,
    totalOccurrences: total,
  };
}

/** Task 32: median round count and question count across published interviews. */
export async function getCompanyTypicalStructure(
  companyId: string,
): Promise<{ medianRoundCount: number | null; medianQuestionCount: number | null; sampleSize: number }> {
  const supabase = await client();
  if (!supabase) return { medianRoundCount: null, medianQuestionCount: null, sampleSize: 0 };

  const { data: interviews } = await supabase
    .from("interviews")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "published");
  const interviewIds = (interviews ?? []).map((row) => row.id);
  if (interviewIds.length === 0) return { medianRoundCount: null, medianQuestionCount: null, sampleSize: 0 };

  const [{ data: rounds }, { data: questions }] = await Promise.all([
    supabase.from("interview_rounds").select("interview_id").in("interview_id", interviewIds),
    supabase.from("interview_questions").select("interview_id").in("interview_id", interviewIds),
  ]);

  const roundCounts = new Map<string, number>();
  for (const row of rounds ?? []) {
    roundCounts.set(row.interview_id, (roundCounts.get(row.interview_id) ?? 0) + 1);
  }
  const questionCounts = new Map<string, number>();
  for (const row of questions ?? []) {
    questionCounts.set(row.interview_id, (questionCounts.get(row.interview_id) ?? 0) + 1);
  }

  return {
    medianRoundCount: median([...roundCounts.values()]),
    medianQuestionCount: median([...questionCounts.values()]),
    sampleSize: interviewIds.length,
  };
}

// ---------------------------------------------------------------------------
// Recent interviews
// ---------------------------------------------------------------------------

export interface CompanyRecentInterview {
  id: string;
  slug: string | null;
  title: string | null;
  positionTitle: string | null;
  year: number;
  season: string | null;
  roundCount: number;
  questionCount: number;
  publishedAt: string | null;
}

/** Task 39: recent published interviews, latest first. */
export async function getCompanyRecentInterviews(companyId: string, limit = 8): Promise<CompanyRecentInterview[]> {
  const supabase = await client();
  if (!supabase) return [];

  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, slug, title, year, season, round_count, published_at, position_id")
    .eq("company_id", companyId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (!interviews || interviews.length === 0) return [];

  const interviewIds = interviews.map((row) => row.id);
  const [{ data: rounds }, { data: questions }] = await Promise.all([
    supabase.from("interview_rounds").select("interview_id").in("interview_id", interviewIds),
    supabase.from("interview_questions").select("interview_id").in("interview_id", interviewIds),
  ]);
  const roundCounts = new Map<string, number>();
  for (const row of rounds ?? []) {
    roundCounts.set(row.interview_id, (roundCounts.get(row.interview_id) ?? 0) + 1);
  }
  const questionCounts = new Map<string, number>();
  for (const row of questions ?? []) {
    questionCounts.set(row.interview_id, (questionCounts.get(row.interview_id) ?? 0) + 1);
  }

  const positionIds = [...new Set(interviews.map((row) => row.position_id).filter((id): id is string => id !== null))];
  const { data: positions } = positionIds.length
    ? await supabase.from("positions").select("id, title").in("id", positionIds)
    : { data: [] };
  const positionById = new Map((positions ?? []).map((position) => [position.id, position.title]));

  return interviews.map((row) => {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      positionTitle: row.position_id ? (positionById.get(row.position_id) ?? null) : null,
      year: row.year,
      season: row.season,
      roundCount: roundCounts.get(row.id) ?? row.round_count,
      questionCount: questionCounts.get(row.id) ?? 0,
      publishedAt: row.published_at,
    };
  });
}

// ---------------------------------------------------------------------------
// Role-scoped intelligence (Tasks 21, 22)
// ---------------------------------------------------------------------------

export interface RoleIntelligence {
  interviewCount: number;
  topics: CompanyTopicStat[];
  questions: CompanyQuestionStat[];
  codingProblems: CompanyCodingProblemStat[];
  difficulty: CompanyDifficultyStat | null;
  seasons: CompanySeasonStat[];
  knowledgeOccurrences: number;
  codingOccurrences: number;
  totalOccurrences: number;
}

/**
 * Role-scoped stats computed directly from the published interview graph for
 * the company + position pair (no separate cache tables; the pair is small).
 * Caller must have verified the position belongs to the company.
 */
export async function getRoleIntelligence(companyId: string, positionId: string): Promise<RoleIntelligence> {
  const supabase = await client();
  const empty: RoleIntelligence = {
    interviewCount: 0,
    topics: [],
    questions: [],
    codingProblems: [],
    difficulty: null,
    seasons: [],
    knowledgeOccurrences: 0,
    codingOccurrences: 0,
    totalOccurrences: 0,
  };
  if (!supabase) return empty;

  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, year, season, difficulty_overall, published_at")
    .eq("company_id", companyId)
    .eq("position_id", positionId)
    .eq("status", "published");
  const rows = interviews ?? [];
  if (rows.length === 0) return empty;

  const interviewIds = rows.map((row) => row.id);
  const [{ data: occurrenceRows }, { data: roundRows }] = await Promise.all([
    supabase
      .from("interview_questions")
      .select("interview_id, question_id, coding_problem_id")
      .in("interview_id", interviewIds),
    supabase.from("interview_rounds").select("interview_id, round_type").in("interview_id", interviewIds),
  ]);

  // Aggregate occurrences per canonical entity deterministically in-process.
  const questionCounts = new Map<string, { occurrences: number; interviews: Set<string> }>();
  const codingCounts = new Map<string, { occurrences: number; interviews: Set<string> }>();
  const questionIds = new Set<string>();
  const codingIds = new Set<string>();
  let knowledge = 0;
  let coding = 0;

  for (const row of occurrenceRows ?? []) {
    if (row.coding_problem_id) {
      coding += 1;
      codingIds.add(row.coding_problem_id);
      const entry = codingCounts.get(row.coding_problem_id) ?? { occurrences: 0, interviews: new Set<string>() };
      entry.occurrences += 1;
      entry.interviews.add(row.interview_id);
      codingCounts.set(row.coding_problem_id, entry);
    } else if (row.question_id) {
      knowledge += 1;
      questionIds.add(row.question_id);
      const entry = questionCounts.get(row.question_id) ?? { occurrences: 0, interviews: new Set<string>() };
      entry.occurrences += 1;
      entry.interviews.add(row.interview_id);
      questionCounts.set(row.question_id, entry);
    }
  }

  // Metadata for the referenced canonical entities, batched.
  const [questionsRes, problemsRes, topicLinksRes, topicsRes] = await Promise.all([
    questionIds.size ? supabase.from("questions").select("id, title, slug, question_type").in("id", [...questionIds]) : Promise.resolve({ data: [] }),
    codingIds.size ? supabase.from("coding_problems").select("id, title, slug, difficulty").in("id", [...codingIds]) : Promise.resolve({ data: [] }),
    questionIds.size ? supabase.from("question_topics").select("question_id, topic_id").in("question_id", [...questionIds]) : Promise.resolve({ data: [] }),
    Promise.resolve({ data: [] as Array<{ id: string; name: string; slug: string }> }),
  ]);
  void topicsRes;

  const questionById = new Map((questionsRes.data ?? []).map((question) => [question.id, question]));
  const problemById = new Map((problemsRes.data ?? []).map((problem) => [problem.id, problem]));

  // Topics: map each role occurrence to its question's topics, batched.
  const questionsByTopic = new Map<string, Set<string>>();
  for (const link of topicLinksRes.data ?? []) {
    const set = questionsByTopic.get(link.topic_id) ?? new Set<string>();
    set.add(link.question_id);
    questionsByTopic.set(link.topic_id, set);
  }
  const topicIds = [...questionsByTopic.keys()];
  const emptyTopics: Array<{ id: string; name: string; slug: string }> = [];
  const topics = topicIds.length
    ? (await supabase.from("topics").select("id, name, slug").in("id", topicIds)).data ?? emptyTopics
    : emptyTopics;

  const cutoff = Date.now() - 90 * 24 * 3_600_000;
  const interviewDateById = new Map(rows.map((row) => [row.id, new Date(row.published_at ?? 0).getTime()]));

  const topicStats: CompanyTopicStat[] = topics
    .map((topic): CompanyTopicStat | null => {
      const questionSet = questionsByTopic.get(topic.id) ?? new Set<string>();
      let occurrences = 0;
      const interviewsWith = new Set<string>();
      for (const row of occurrenceRows ?? []) {
        if (!row.question_id || !questionSet.has(row.question_id)) continue;
        occurrences += 1;
        interviewsWith.add(row.interview_id);
      }
      if (occurrences === 0) return null;
      const recentOccurrences = [...interviewsWith].filter((id) => (interviewDateById.get(id) ?? 0) >= cutoff).length;
      const older = interviewsWith.size - recentOccurrences;
      return {
        topicId: topic.id,
        topicName: topic.name,
        topicSlug: topic.slug,
        occurrenceCount: occurrences,
        interviewCount: interviewsWith.size,
        shareOfInterviews: rows.length > 0 ? Math.round((interviewsWith.size / rows.length) * 100) / 100 : null,
        trendScore: recentOccurrences / Math.max(recentOccurrences, 1) - older / Math.max(older, 1) || 0,
        lastSeenAt: null,
      } satisfies CompanyTopicStat;
    })
    .filter((stat): stat is CompanyTopicStat => stat !== null)
    .sort((a, b) => b.interviewCount - a.interviewCount);

  const questionStats: CompanyQuestionStat[] = [...questionCounts.entries()]
    .filter(([questionId]) => questionById.has(questionId))
    .map(([questionId, entry]) => {
      const question = questionById.get(questionId)!;
      const recent = [...entry.interviews].filter((id) => (interviewDateById.get(id) ?? 0) >= cutoff).length;
      return {
        questionId,
        title: question.title,
        slug: question.slug,
        questionType: question.question_type,
        occurrenceCount: entry.occurrences,
        interviewCount: entry.interviews.size,
        occurrences30d: 0,
        occurrences90d: recent,
        trendScore: 0,
        lastSeenAt: null,
      } satisfies CompanyQuestionStat;
    })
    .sort((a, b) => b.interviewCount - a.interviewCount);

  const codingStats: CompanyCodingProblemStat[] = [...codingCounts.entries()]
    .filter(([problemId]) => problemById.has(problemId))
    .map(([problemId, entry]) => {
      const problem = problemById.get(problemId)!;
      return {
        problemId,
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        occurrenceCount: entry.occurrences,
        interviewCount: entry.interviews.size,
        trendScore: 0,
        lastSeenAt: null,
      } satisfies CompanyCodingProblemStat;
    })
    .sort((a, b) => b.interviewCount - a.interviewCount);

  const knownDifficulty = rows.filter((row) => row.difficulty_overall !== "unknown");
  const difficultyCounts = {
    easy: rows.filter((row) => row.difficulty_overall === "easy").length,
    medium: rows.filter((row) => row.difficulty_overall === "medium").length,
    hard: rows.filter((row) => row.difficulty_overall === "hard").length,
  };

  const seasonGroups = new Map<string, { interviews: Set<string>; knowledge: number; coding: number; unlinked: number }>();
  const interviewById = new Map(rows.map((row) => [row.id, row]));
  for (const row of rows) {
    const season = normalizeSeason(row.season);
    if (row.year === null || !season) continue;
    const key = `${row.year}:${season}`;
    const group = seasonGroups.get(key) ?? { interviews: new Set<string>(), knowledge: 0, coding: 0, unlinked: 0 };
    group.interviews.add(row.id);
    seasonGroups.set(key, group);
  }
  for (const row of occurrenceRows ?? []) {
    const interview = interviewById.get(row.interview_id);
    if (!interview) continue;
    const season = normalizeSeason(interview.season);
    if (interview.year === null || !season) continue;
    const group = seasonGroups.get(`${interview.year}:${season}`);
    if (!group) continue;
    if (row.coding_problem_id) group.coding += 1;
    else if (row.question_id) group.knowledge += 1;
    else group.unlinked += 1;
  }

  const seasonStats: CompanySeasonStat[] = [...seasonGroups.entries()]
    .map(([key, group]) => {
      const [year, season] = key.split(":");
      const total = group.knowledge + group.coding + group.unlinked;
      const roundCounts = [...group.interviews].map(
        (id) => roundRows?.filter((r) => r.interview_id === id).length ?? 0,
      );
      return {
        year: Number(year),
        season,
        interviewCount: group.interviews.size,
        questionOccurrenceCount: total,
        knowledgeOccurrenceCount: group.knowledge,
        codingOccurrenceCount: group.coding,
        codingShare: total > 0 ? Math.round((group.coding / total) * 100) / 100 : null,
        avgRoundCount: roundCounts.length > 0 ? Math.round((roundCounts.reduce((a, b) => a + b, 0) / roundCounts.length) * 100) / 100 : null,
        avgQuestionCount: null,
      } satisfies CompanySeasonStat;
    })
    .sort((a, b) => b.year - a.year || a.season.localeCompare(b.season));

  return {
    interviewCount: rows.length,
    topics: topicStats,
    questions: questionStats,
    codingProblems: codingStats,
    difficulty: {
      easyCount: difficultyCounts.easy,
      mediumCount: difficultyCounts.medium,
      hardCount: difficultyCounts.hard,
      unknownCount: rows.length - knownDifficulty.length,
      averageScore:
        knownDifficulty.length > 0
          ? Math.round(
              ((difficultyCounts.easy + 2 * difficultyCounts.medium + 3 * difficultyCounts.hard) / knownDifficulty.length) * 100,
            ) / 100
          : null,
      sampleSize: knownDifficulty.length,
    },
    seasons: seasonStats,
    knowledgeOccurrences: knowledge,
    codingOccurrences: coding,
    totalOccurrences: (occurrenceRows ?? []).length,
  };
}
