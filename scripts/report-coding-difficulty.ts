/**
 * Coding difficulty calibration report (Week 5 Task 32).
 *
 * Pulls submission-derived signals for every published problem and prints a
 * table. Read-only: it never mutates difficulty. Low-sample problems are
 * flagged so an author can decide whether the manual difficulty is trustworthy.
 *
 *   pnpm check:coding-difficulty
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * .env.local.
 */
import { createClient } from "@supabase/supabase-js";

import { envValue, loadProjectEnv } from "./lib/load-env";
import type { Database } from "../src/types/database";

const values = loadProjectEnv();
const url = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const key = envValue(values, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error(
    "Difficulty report needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(2);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
const { data: problems, error: problemsError } = await supabase
  .from("coding_problems")
  .select("id, slug, title, difficulty, is_published");
if (problemsError) throw new Error(`coding problems query: ${problemsError.message}`);

const published = (problems ?? []).filter((problem) => problem.is_published);
const ids = published.map((problem) => problem.id);

const { data: submissions, error: subError } = ids.length
  ? await supabase
      .from("coding_submissions")
      .select("id, problem_id, user_id, status, runtime_ms, created_at")
      .in("problem_id", ids)
      .not("status", "in", "(queued,running)")
  : { data: [], error: null };
if (subError) throw new Error(`submissions query: ${subError.message}`);

// Per-problem aggregates.
const byProblem = new Map<
  string,
  {
    submissions: number;
    uniqueUsers: Set<string>;
    acceptedUsers: Set<string>;
    runtimes: number[];
    attemptsToSolve: Map<string, number>;
  }
>();
for (const problem of published) {
  byProblem.set(problem.id, {
    submissions: 0,
    uniqueUsers: new Set(),
    acceptedUsers: new Set(),
    runtimes: [],
    attemptsToSolve: new Map(),
  });
}
const acceptedTimeByUser = new Map<string, string>();
for (const row of submissions ?? []) {
  const agg = byProblem.get(row.problem_id);
  if (!agg) continue;
  agg.submissions += 1;
  agg.uniqueUsers.add(row.user_id);
  if (row.runtime_ms !== null) agg.runtimes.push(row.runtime_ms);
  if (row.status === "accepted") agg.acceptedUsers.add(row.user_id);

  // Attempts-to-solve: count how many submissions a user made before their
  // first accepted one (including it).
  if (row.status === "accepted") {
    const key = `${row.problem_id}:${row.user_id}`;
    const prior = acceptedTimeByUser.get(key);
    const time = row.created_at;
    if (!prior || time < prior) {
      acceptedTimeByUser.set(key, time);
      agg.attemptsToSolve.set(row.user_id, (agg.attemptsToSolve.get(row.user_id) ?? 0) + 1);
    }
  } else {
    const current = agg.attemptsToSolve.get(row.user_id);
    // Only count non-accepted attempts that precede the user's acceptance.
    const acceptedTime = acceptedTimeByUser.get(`${row.problem_id}:${row.user_id}`);
    if (!acceptedTime || row.created_at < acceptedTime) {
      agg.attemptsToSolve.set(row.user_id, (current ?? 0) + 1);
    }
  }
}

const LOW_SAMPLE_THRESHOLD = 5;

console.log(
  `Difficulty calibration (${published.length} published problems, ${(submissions ?? []).length} completed submissions)\n`,
);
console.log(
  ["slug", "difficulty", "acceptance", "attempts(med)", "users", "runs", "median ms", "low-sample"].join("\t"),
);
for (const problem of published) {
  const agg = byProblem.get(problem.id)!;
  const completed = agg.submissions;
  const acceptance = completed > 0 ? Math.round((agg.acceptedUsers.size / agg.uniqueUsers.size) * 100) : null;
  const medianRuntimes = agg.runtimes.length ? median(agg.runtimes) : null;
  const attempts = [...agg.attemptsToSolve.values()].filter((count) => count > 0);
  const medianAttempts = attempts.length ? median(attempts) : null;
  const lowSample = completed < LOW_SAMPLE_THRESHOLD;
  console.log(
    [
      problem.slug,
      problem.difficulty,
      acceptance === null ? "-" : `${acceptance}%`,
      medianAttempts === null ? "-" : String(medianAttempts),
      agg.uniqueUsers.size,
      completed,
      medianRuntimes === null ? "-" : String(medianRuntimes),
      lowSample ? "⚠ LOW" : "",
    ].join("\t"),
  );
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}
