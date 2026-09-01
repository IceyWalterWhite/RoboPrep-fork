import { createClient } from "@supabase/supabase-js";

import { envValue, loadProjectEnv } from "./lib/load-env";
import type { Database } from "../src/types/database";

const values = loadProjectEnv();
const url = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const key = envValue(values, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error(
    "Interview integrity check needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(2);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
const failures: string[] = [];

const { data: interviews, error: interviewError } = await supabase
  .from("interviews")
  .select("id, company_id, position_id, status")
  .eq("status", "published");
if (interviewError) fail("interviews query", interviewError.message);

const published = interviews ?? [];
const interviewIds = published.map((item) => item.id);
const companyIds = [...new Set(published.map((item) => item.company_id))];
const positionIds = [
  ...new Set(
    published.map((item) => item.position_id).filter((id): id is string => id !== null),
  ),
];

const [
  { data: companies, error: companiesError },
  { data: positions, error: positionsError },
  { data: rounds, error: roundsError },
  { data: links, error: linksError },
] = await Promise.all([
  supabase.from("companies").select("id").in("id", companyIds),
  positionIds.length
    ? supabase.from("positions").select("id, company_id").in("id", positionIds)
    : Promise.resolve({ data: [], error: null }),
  interviewIds.length
    ? supabase
        .from("interview_rounds")
        .select("id, interview_id, round_number")
        .in("interview_id", interviewIds)
    : Promise.resolve({ data: [], error: null }),
  interviewIds.length
    ? supabase
        .from("interview_questions")
        .select("id, interview_id, question_id, round_id, round_number, order_index")
        .in("interview_id", interviewIds)
    : Promise.resolve({ data: [], error: null }),
]);
if (companiesError) fail("companies query", companiesError.message);
if (positionsError) fail("positions query", positionsError.message);
if (roundsError) fail("rounds query", roundsError.message);
if (linksError) fail("interview questions query", linksError.message);

const companySet = new Set((companies ?? []).map((item) => item.id));
const positionById = new Map((positions ?? []).map((item) => [item.id, item]));
const interviewSet = new Set(interviewIds);
const roundById = new Map((rounds ?? []).map((round) => [round.id, round]));

for (const interview of published) {
  if (!companySet.has(interview.company_id))
    fail(`interview ${interview.id}`, "company is missing");
  if (interview.position_id) {
    const position = positionById.get(interview.position_id);
    if (!position) fail(`interview ${interview.id}`, "position is missing");
    else if (position.company_id !== interview.company_id)
      fail(`interview ${interview.id}`, "position belongs to another company");
  }
}

const roundKeys = new Set<string>();
for (const round of rounds ?? []) {
  const keyForRound = `${round.interview_id}:${round.round_number}`;
  if (roundKeys.has(keyForRound))
    fail(
      `interview ${round.interview_id}`,
      `duplicate round number ${round.round_number}`,
    );
  roundKeys.add(keyForRound);
  if (!interviewSet.has(round.interview_id))
    fail(`round ${round.id}`, "references a non-published interview");
}

const orderKeys = new Set<string>();
const questionIds = [
  ...new Set(
    (links ?? [])
      .map((link) => link.question_id)
      .filter((id): id is string => id !== null),
  ),
];
const { data: questions, error: questionsError } = questionIds.length
  ? await supabase.from("questions").select("id, is_published").in("id", questionIds)
  : { data: [], error: null };
if (questionsError) fail("questions query", questionsError.message);
const questionById = new Map(
  (questions ?? []).map((question) => [question.id, question]),
);

for (const link of links ?? []) {
  if (link.round_id) {
    const round = roundById.get(link.round_id);
    if (!round) fail(`question occurrence ${link.id}`, "round_id does not exist");
    else if (round.interview_id !== link.interview_id)
      fail(`question occurrence ${link.id}`, "round belongs to another interview");
  }
  if (link.question_id) {
    const question = questionById.get(link.question_id);
    if (!question)
      fail(`question occurrence ${link.id}`, "canonical question does not exist");
    else if (!question.is_published)
      fail(
        `question occurrence ${link.id}`,
        "references an unpublished canonical question",
      );
  }
  if (link.round_id !== null && link.order_index !== null) {
    const orderKey = `${link.round_id}:${link.order_index}`;
    if (orderKeys.has(orderKey))
      fail(`round ${link.round_id}`, `duplicate question order ${link.order_index}`);
    orderKeys.add(orderKey);
  }
}

if (failures.length > 0) {
  console.error(`Interview integrity failed with ${failures.length} issue(s):`);
  for (const issue of failures) console.error(`- ${issue}`);
  process.exit(1);
}
process.stdout.write(
  `Interview integrity passed: ${published.length} published interview(s), ${(rounds ?? []).length} round(s), ${(links ?? []).length} occurrence(s).\n`,
);

function fail(scope: string, message: string): void {
  failures.push(`${scope}: ${message}`);
}
