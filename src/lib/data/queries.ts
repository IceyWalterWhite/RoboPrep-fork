import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Company, Interview, Question, Topic } from "@/types/database";

/**
 * Shared read-only data access retained for the landing page and lightweight
 * cross-feature lookups. Feature-specific list/detail queries live under their
 * respective domain directories.
 *
 * Queries are deliberately plain: every function degrades to an empty result
 * when Supabase is unreachable or unconfigured, so a fresh clone or an empty
 * database renders empty states instead of crashing.
 */

function warn(context: string, error: { message: string }) {
  console.warn(`[data] ${context} failed: ${error.message}`);
}

export interface QuestionTopicRef {
  id: string;
  name: string;
  slug: string;
  weight: number | null;
}

export type QuestionWithTopics = Question & { topics: QuestionTopicRef[] };

/** Most recently added canonical questions, with their topics attached. */
export async function getRecentQuestions(limit = 12): Promise<QuestionWithTopics[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !questions) {
    if (error) warn("getRecentQuestions", error);
    return [];
  }
  if (questions.length === 0) return questions.map((q) => ({ ...q, topics: [] }));

  const questionIds = questions.map((question) => question.id);

  const { data: links, error: linksError } = await supabase
    .from("question_topics")
    .select("question_id, topic_id, weight")
    .in("question_id", questionIds);

  const topicIds = [...new Set((links ?? []).map((link) => link.topic_id))];
  const { data: topics, error: topicsError } = topicIds.length
    ? await supabase.from("topics").select("id, name, slug").in("id", topicIds)
    : { data: [], error: null };

  if (linksError) warn("getRecentQuestions/links", linksError);
  if (topicsError) warn("getRecentQuestions/topics", topicsError);

  const topicById = new Map((topics ?? []).map((topic) => [topic.id, topic]));

  return questions.map((question) => ({
    ...question,
    topics: (links ?? [])
      .filter((link) => link.question_id === question.id)
      .map((link) => {
        const topic = topicById.get(link.topic_id);
        return topic
          ? {
              id: topic.id,
              name: topic.name,
              slug: topic.slug,
              weight: link.weight,
            }
          : null;
      })
      .filter((topic): topic is QuestionTopicRef => topic !== null),
  }));
}

export type TopicNode = Pick<Topic, "id" | "name" | "slug" | "parent_id">;

/** Flat topic list; parents come before children so the tree can be rebuilt. */
export async function getTopics(): Promise<TopicNode[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, name, slug, parent_id")
    .order("name");

  if (error || !data) {
    if (error) warn("getTopics", error);
    return [];
  }
  return data;
}

export interface InterviewWithCompany extends Interview {
  companyName: string | null;
  companySlug: string | null;
}

/** Published interviews, newest year first, with their company name. */
export async function getPublishedInterviews(
  limit = 12,
): Promise<InterviewWithCompany[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("status", "published")
    .order("year", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) warn("getPublishedInterviews", error);
    return [];
  }
  if (data.length === 0) return [];

  const companyIds = [...new Set(data.map((row) => row.company_id))];
  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id, name, slug")
    .in("id", companyIds);

  if (companiesError) warn("getPublishedInterviews/companies", companiesError);

  const companyById = new Map((companies ?? []).map((c) => [c.id, c]));

  return data.map((interview) => ({
    ...interview,
    companyName: companyById.get(interview.company_id)?.name ?? null,
    companySlug: companyById.get(interview.company_id)?.slug ?? null,
  }));
}

export interface CompanyWithCount extends Company {
  interviewCount: number;
  positionCount: number;
}

/** Companies that have at least one published interview, plus counts. */
export async function getCompanies(): Promise<CompanyWithCount[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.from("companies").select("*").order("name");

  if (error || !data) {
    if (error) warn("getCompanies", error);
    return [];
  }
  if (data.length === 0) return [];

  const companyIds = data.map((company) => company.id);

  const [{ data: interviews }, { data: positions }] = await Promise.all([
    supabase
      .from("interviews")
      .select("id, company_id")
      .eq("status", "published")
      .in("company_id", companyIds),
    supabase.from("positions").select("id, company_id").in("company_id", companyIds),
  ]);

  const interviewCounts = new Map<string, number>();
  for (const row of interviews ?? []) {
    interviewCounts.set(row.company_id, (interviewCounts.get(row.company_id) ?? 0) + 1);
  }
  const positionCounts = new Map<string, number>();
  for (const row of positions ?? []) {
    positionCounts.set(row.company_id, (positionCounts.get(row.company_id) ?? 0) + 1);
  }

  return data.map((company) => ({
    ...company,
    interviewCount: interviewCounts.get(company.id) ?? 0,
    positionCount: positionCounts.get(company.id) ?? 0,
  }));
}
