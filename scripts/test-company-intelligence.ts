/**
 * Task 83: company intelligence smoke test.
 *
 * Fixture strategy (deterministic, isolated): create a fixture company +
 * positions + canonical question/topic/coding problem + three published
 * interviews with known occurrence patterns → refresh company stats → verify
 * top topic, top question, coding share, and season grouping → publish one
 * more interview and verify the incremental refresh picks it up → delete the
 * fixture.
 *
 * Requires a reachable Supabase with migrations 0001–0023 applied.
 *
 * Usage:
 *   node --experimental-strip-types --loader ./scripts/tests/loader.mjs scripts/test-company-intelligence.ts
 */
import { createClient } from "@supabase/supabase-js";

import { envValue, loadProjectEnv } from "./lib/load-env";
import type { Database } from "../src/types/database";

const values = loadProjectEnv();
const url = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const key = envValue(values, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error("Company intelligence smoke test needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

let passed = 0;
let failed = 0;
const createdIds = { company: "", positions: [] as string[], questions: [] as string[], topics: [] as string[], problems: [] as string[], interviews: [] as string[] };

async function check(name: string, condition: boolean, detail = ""): Promise<void> {
  if (condition) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const year = new Date().getFullYear();

try {
  // 1. Fixture graph.
  const { data: companyRow } = await supabase
    .from("companies")
    .insert({ name: `WI Smoke ${Date.now()}`, slug: `wi-smoke-${Date.now()}` })
    .select("id")
    .single();
  if (!companyRow) throw new Error("failed to create fixture company");
  const company = companyRow;
  createdIds.company = company.id;

  const { data: positionRow } = await supabase
    .from("positions")
    .insert({ company_id: company.id, title: "Robot Learning Engineer", slug: `robot-learning-${Date.now()}` })
    .select("id")
    .single();
  if (!positionRow) throw new Error("failed to create fixture position");
  const position = positionRow;
  createdIds.positions.push(position.id);

  const { data: topicRow } = await supabase.from("topics").insert({ name: `WI Topic ${Date.now()}`, slug: `wi-topic-${Date.now()}` }).select("id").single();
  if (!topicRow) throw new Error("failed to create fixture topic");
  const topic = topicRow;
  createdIds.topics.push(topic.id);

  const slugSuffix = Date.now().toString(36);
  const { data: questionRow } = await supabase
    .from("questions")
    .insert({ title: `WI Question ${year}`, slug: `wi-question-${slugSuffix}`, question_type: "knowledge", is_published: true })
    .select("id")
    .single();
  if (!questionRow) throw new Error("failed to create fixture question");
  const question = questionRow;
  createdIds.questions.push(question.id);
  await supabase.from("question_topics").insert({ question_id: question.id, topic_id: topic.id });

  const { data: problemRow } = await supabase
    .from("coding_problems")
    .insert({
      title: `WI Problem ${year}`, slug: `wi-problem-${slugSuffix}`, difficulty: "medium", description: "smoke fixture",
      starter_code: "def f():\n    pass", language: "python", time_limit_ms: 5000, memory_limit_mb: 256,
      comparison_mode: "exact", tolerance: 0, is_published: true,
    })
    .select("id")
    .single();
  if (!problemRow) throw new Error("failed to create fixture coding problem");
  const problem = problemRow;
  createdIds.problems.push(problem.id);

  // 2. Three published interviews (two in autumn with the question, one in
  //    spring with the coding problem). Top topic = the fixture topic,
  //    top question = the fixture question.
  const interviewSpecs = [
    { year: year, season: "autumn", withQuestion: true, withCoding: false },
    { year: year, season: "autumn", withQuestion: true, withCoding: false },
    { year: year - 1, season: "spring", withQuestion: false, withCoding: true },
  ];
  for (const [index, spec] of interviewSpecs.entries()) {
    const { data: interviewRow } = await supabase
      .from("interviews")
      .insert({
        company_id: company.id, position_id: position.id, year: spec.year, season: spec.season,
        status: "published", published_at: new Date().toISOString(), difficulty_overall: "medium",
        title: `WI interview ${index}`, slug: `wi-interview-${slugSuffix}-${index}`,
        source_type: "development",
      })
      .select("id")
      .single();
    if (!interviewRow) throw new Error(`failed to create fixture interview ${index}`);
    const interview = interviewRow;
    createdIds.interviews.push(interview.id);
    await supabase.from("interview_rounds").insert({ interview_id: interview.id, round_number: 1, round_type: "technical" });

    if (spec.withQuestion) {
      await supabase.from("interview_questions").insert({ interview_id: interview.id, question_id: question.id, order_index: 0 });
    }
    if (spec.withCoding) {
      await supabase.from("interview_questions").insert({ interview_id: interview.id, coding_problem_id: problem.id, order_index: 0 });
    }
  }

  // 3. Full refresh, then verify.
  const { error: refreshError } = await supabase.rpc("refresh_company_stats", { p_company_id: company.id });
  if (refreshError) throw new Error(`refresh failed: ${refreshError.message}`);

  const { data: stats } = await supabase.from("company_stats").select("*").eq("company_id", company.id).maybeSingle();
  await check("published interview count = 3", stats?.published_interview_count === 3);

  const { data: topicStats } = await supabase.from("company_topic_stats").select("*").eq("company_id", company.id);
  const topTopic = (topicStats ?? []).sort((a, b) => Number(b.share_of_interviews ?? 0) - Number(a.share_of_interviews ?? 0))[0];
  await check("top topic is the fixture topic", topTopic?.topic_id === topic.id);
  await check("topic share = 2/3", Math.abs(Number(topTopic?.share_of_interviews) - 2 / 3) < 0.01, String(topTopic?.share_of_interviews));

  const { data: questionStats } = await supabase.from("company_question_stats").select("*").eq("company_id", company.id);
  const topQuestion = (questionStats ?? []).sort((a, b) => b.interview_count - a.interview_count)[0];
  await check("top question is the fixture question", topQuestion?.question_id === question.id);
  await check("question interview_count = 2", topQuestion?.interview_count === 2);

  const { data: problemStats } = await supabase.from("company_coding_problem_stats").select("*").eq("company_id", company.id);
  await check("coding problem linked", (problemStats ?? []).some((row) => row.coding_problem_id === problem.id));

  const { data: seasonStats } = await supabase.from("company_season_stats").select("*").eq("company_id", company.id);
  await check("season grouping has two seasons", (seasonStats ?? []).length === 2);
  const autumn = (seasonStats ?? []).find((row) => row.season === "autumn");
  await check("autumn knowledge occurrences = 2", autumn?.knowledge_occurrence_count === 2);

  // 4. Incremental refresh after a new publish (Flow H).
  const { data: extraRow } = await supabase
    .from("interviews")
    .insert({
      company_id: company.id, position_id: position.id, year: year, season: "autumn",
      status: "published", published_at: new Date().toISOString(), difficulty_overall: "easy",
      title: "WI extra", slug: `wi-interview-${slugSuffix}-extra`, source_type: "development",
    })
    .select("id")
    .single();
  if (!extraRow) throw new Error("failed to create extra fixture interview");
  const extra = extraRow;
  createdIds.interviews.push(extra.id);
  await supabase.from("interview_questions").insert({ interview_id: extra.id, question_id: question.id, order_index: 0 });
  const { error: incrementalError } = await supabase.rpc("refresh_company_stats", { p_company_id: company.id });
  if (incrementalError) throw new Error(`incremental refresh failed: ${incrementalError.message}`);

  const { data: statsAfter } = await supabase.from("company_stats").select("*").eq("company_id", company.id).maybeSingle();
  await check("incremental refresh updates count to 4", statsAfter?.published_interview_count === 4);
} catch (error) {
  failed += 1;
  console.error(`  FAIL  unexpected error: ${error instanceof Error ? error.message : error}`);
} finally {
  if (createdIds.company) {
    await supabase.from("interviews").delete().in("id", createdIds.interviews.length ? createdIds.interviews : ["00000000-0000-0000-0000-000000000000"]);
    await supabase.from("company_stats").delete().eq("company_id", createdIds.company);
    await supabase.from("company_season_stats").delete().eq("company_id", createdIds.company);
    await supabase.from("company_topic_stats").delete().eq("company_id", createdIds.company);
    await supabase.from("company_question_stats").delete().eq("company_id", createdIds.company);
    await supabase.from("company_coding_problem_stats").delete().eq("company_id", createdIds.company);
    await supabase.from("company_difficulty_stats").delete().eq("company_id", createdIds.company);
    await supabase.from("company_round_type_stats").delete().eq("company_id", createdIds.company);
    await supabase.from("company_position_stats").delete().eq("company_id", createdIds.company);
    await supabase.from("question_topics").delete().in("question_id", createdIds.questions.length ? createdIds.questions : ["00000000-0000-0000-0000-000000000000"]);
    await supabase.from("questions").delete().in("id", createdIds.questions.length ? createdIds.questions : ["00000000-0000-0000-0000-000000000000"]);
    await supabase.from("coding_problems").delete().in("id", createdIds.problems.length ? createdIds.problems : ["00000000-0000-0000-0000-000000000000"]);
    await supabase.from("topics").delete().in("id", createdIds.topics.length ? createdIds.topics : ["00000000-0000-0000-0000-000000000000"]);
    await supabase.from("positions").delete().in("id", createdIds.positions.length ? createdIds.positions : ["00000000-0000-0000-0000-000000000000"]);
    await supabase.from("companies").delete().eq("id", createdIds.company);
  }
}

console.log(`\n${passed} check(s) passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
