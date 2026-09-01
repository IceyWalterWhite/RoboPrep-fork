/**
 * Task 53: company intelligence integrity check (read-only).
 *
 * Validates the Week 7 cache tables against the canonical graph. Requires a
 * reachable Supabase with migration 0023 applied; exits non-zero on any
 * violation.
 *
 * Usage:
 *   node --experimental-strip-types --loader ./scripts/tests/loader.mjs scripts/check-company-intelligence.ts
 */
import { createClient } from "@supabase/supabase-js";

import { envValue, loadProjectEnv } from "./lib/load-env";
import type { Database } from "../src/types/database";

const values = loadProjectEnv();
const url = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const key = envValue(values, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error("Company intelligence check needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

const failures: string[] = [];
function fail(context: string, problem: string): void {
  failures.push(`${context}: ${problem}`);
}

const { data: companies, error: companiesError } = await supabase.from("companies").select("id, name");
if (companiesError) fail("companies", companiesError.message);
const companyIds = new Set((companies ?? []).map((company) => company.id));

const { data: positions, error: positionsError } = await supabase.from("positions").select("id, company_id");
if (positionsError) fail("positions", positionsError.message);
const positionCompany = new Map((positions ?? []).map((position) => [position.id, position.company_id]));

const { data: questions } = await supabase.from("questions").select("id");
const questionIds = new Set((questions ?? []).map((row) => row.id));
const { data: topics } = await supabase.from("topics").select("id");
const topicIds = new Set((topics ?? []).map((row) => row.id));
const { data: problems } = await supabase.from("coding_problems").select("id");
const problemIds = new Set((problems ?? []).map((row) => row.id));

function checkCompanyScope(
  rows: Array<Record<string, unknown>> | null,
  label: string,
  idField: string,
  extra?: (row: Record<string, unknown>) => void,
): void {
  for (const row of rows ?? []) {
    const context = `${label}[${String(row.company_id)}/${String(row[idField])}]`;
    if (!companyIds.has(row.company_id as string)) fail(context, "company_id does not exist");
    for (const field of ["occurrence_count", "interview_count"] as const) {
      const value = row[field];
      if (typeof value === "number" && value < 0) fail(context, `negative ${field}`);
    }
    extra?.(row);
  }
}

// company_stats
{
  const { data, error } = await supabase.from("company_stats").select("*");
  if (error) fail("company_stats", error.message);
  for (const row of data ?? []) {
    if (!companyIds.has(row.company_id)) fail(`company_stats[${row.company_id}]`, "company does not exist");
    for (const field of ["published_interview_count", "position_count", "knowledge_question_occurrence_count", "coding_question_occurrence_count"] as const) {
      if (row[field] < 0) fail(`company_stats[${row.company_id}]`, `negative ${field}`);
    }
    if (!row.updated_at) fail(`company_stats[${row.company_id}]`, "missing cache timestamp");
  }
}

// company_position_stats: position must belong to company
{
  const { data, error } = await supabase.from("company_position_stats").select("*");
  if (error) fail("company_position_stats", error.message);
  for (const row of data ?? []) {
    const owner = positionCompany.get(row.position_id);
    if (!owner) fail(`company_position_stats[${row.company_id}/${row.position_id}]`, "position does not exist");
    else if (owner !== row.company_id) fail(`company_position_stats[${row.company_id}/${row.position_id}]`, "position belongs to a different company");
  }
}

// company_topic_stats: valid topic ids, share in [0, 1]
checkCompanyScope(
  (await supabase.from("company_topic_stats").select("*")).data,
  "company_topic_stats",
  "topic_id",
  (row) => {
    if (!topicIds.has(row.topic_id as string)) fail(`company_topic_stats[${row.company_id}/${row.topic_id}]`, "topic does not exist");
    const share = row.share_of_interviews as number | null;
    if (share !== null && (share < 0 || share > 1)) fail(`company_topic_stats[${row.company_id}/${row.topic_id}]`, `share out of range: ${share}`);
  },
);

// company_question_stats: valid question ids
checkCompanyScope(
  (await supabase.from("company_question_stats").select("*")).data,
  "company_question_stats",
  "question_id",
  (row) => {
    if (!questionIds.has(row.question_id as string)) fail(`company_question_stats[${row.company_id}/${row.question_id}]`, "question does not exist");
  },
);

// company_coding_problem_stats: valid problem ids
checkCompanyScope(
  (await supabase.from("company_coding_problem_stats").select("*")).data,
  "company_coding_problem_stats",
  "coding_problem_id",
  (row) => {
    if (!problemIds.has(row.coding_problem_id as string)) fail(`company_coding_problem_stats[${row.company_id}/${row.coding_problem_id}]`, "coding problem does not exist");
  },
);

// company_season_stats: share in [0, 1], valid years
{
  const { data, error } = await supabase.from("company_season_stats").select("*");
  if (error) fail("company_season_stats", error.message);
  for (const row of data ?? []) {
    if (!companyIds.has(row.company_id)) fail(`company_season_stats[${row.company_id}]`, "company does not exist");
    if (row.year < 1990 || row.year > 2100) fail(`company_season_stats[${row.company_id}/${row.year}]`, "year out of range");
    if (row.coding_share !== null && (row.coding_share < 0 || row.coding_share > 1)) {
      fail(`company_season_stats[${row.company_id}/${row.year}/${row.season}]`, "coding_share out of range");
    }
  }
}

// company_difficulty_stats: average within [1, 3] when present
{
  const { data, error } = await supabase.from("company_difficulty_stats").select("*");
  if (error) fail("company_difficulty_stats", error.message);
  for (const row of data ?? []) {
    if (row.average_score !== null && (row.average_score < 1 || row.average_score > 3)) {
      fail(`company_difficulty_stats[${row.company_id}]`, `average_score out of range: ${row.average_score}`);
    }
    if (!row.updated_at) fail(`company_difficulty_stats[${row.company_id}]`, "missing cache timestamp");
  }
}

// company_round_type_stats: share in [0, 1]
{
  const { data, error } = await supabase.from("company_round_type_stats").select("*");
  if (error) fail("company_round_type_stats", error.message);
  for (const row of data ?? []) {
    if (row.share !== null && (row.share < 0 || row.share > 1)) {
      fail(`company_round_type_stats[${row.company_id}/${row.round_type}]`, `share out of range: ${row.share}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`✖ company intelligence: ${failures.length} violation(s)`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("ok  company intelligence: 0 violations");
