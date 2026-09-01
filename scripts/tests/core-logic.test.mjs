import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptanceRate,
  aggregateSubmissionStatus,
  compareOutputs,
  deriveProblemStatus,
} from "../../src/lib/coding/helpers.ts";
import { parseCodingFilters } from "../../src/lib/coding/filters.ts";
import { normalizeJudgeStatus } from "../../src/lib/judge/normalize.ts";
import { checkRateLimit } from "../../src/lib/judge/rate-limit-core.ts";
import {
  calculateInterviewStats,
  groupQuestionsByRound,
  interviewVerificationState,
  mapSourceMetadata,
  rankRelatedInterviews,
} from "../../src/lib/interviews/helpers.ts";
import { parseInterviewFilters } from "../../src/lib/interviews/filters.ts";

test("coding output comparison supports exact, trimmed, and numeric modes", () => {
  assert.equal(compareOutputs("answer", "answer", "exact"), true);
  assert.equal(compareOutputs(" answer\n", "answer", "trimmed"), true);
  assert.equal(compareOutputs("1.000004 2", "1 2", "numeric", 0.00001), true);
  assert.equal(compareOutputs("1.1", "1", "numeric", 0.00001), false);
});

test("coding statuses aggregate with deterministic precedence", () => {
  assert.equal(aggregateSubmissionStatus(["accepted", "wrong_answer"]), "wrong_answer");
  assert.equal(aggregateSubmissionStatus(["accepted", "runtime_error"]), "runtime_error");
  assert.equal(aggregateSubmissionStatus(["accepted", "accepted"]), "accepted");
  assert.equal(deriveProblemStatus([{ status: "wrong_answer" }]), "attempted");
  assert.equal(deriveProblemStatus([{ status: "accepted" }, { status: "wrong_answer" }]), "solved");
  assert.equal(acceptanceRate(0, 0), null);
  assert.equal(acceptanceRate(3, 8), 37.5);
});

test("judge provider statuses normalize into application statuses", () => {
  assert.equal(normalizeJudgeStatus(3), "accepted");
  assert.equal(normalizeJudgeStatus(4), "wrong_answer");
  assert.equal(normalizeJudgeStatus(5), "time_limit_exceeded");
  assert.equal(normalizeJudgeStatus(6), "compile_error");
  assert.equal(normalizeJudgeStatus(7), "runtime_error");
  assert.equal(normalizeJudgeStatus(2), "running");
  assert.equal(normalizeJudgeStatus("memory limit exceeded"), "memory_limit_exceeded");
});

test("coding and interview URL filters normalize invalid input safely", () => {
  const coding = parseCodingFilters({ difficulty: "not-a-level", sort: "newest", q: "  attention " });
  assert.equal(coding.q, "attention");
  assert.equal(coding.sort, "newest");
  assert.equal(coding.difficulty, undefined);

  const interview = parseInterviewFilters({ season: "fall", year: "not-a-year", difficulty: "hard" });
  assert.equal(interview.season, "autumn");
  assert.equal(interview.year, undefined);
  assert.equal(interview.difficulty, undefined);
});

test("interview stats and round grouping preserve unlinked occurrences", () => {
  const question = (id, roundId, roundNumber, orderIndex, questionId = null) => ({
    id,
    questionId,
    roundId,
    roundNumber,
    orderIndex,
    originalWording: null,
    canonicalQuestion: null,
    notes: null,
    questionContext: null,
    answerSummary: null,
    difficulty: null,
  });
  const rounds = [
    { id: "r1", roundNumber: 1, title: "Technical", roundType: "technical", durationMinutes: 45, interviewerRole: null, summary: null, questions: [] },
    { id: "r2", roundNumber: 2, title: "Research", roundType: "research", durationMinutes: 30, interviewerRole: null, summary: null, questions: [] },
  ];
  const grouped = groupQuestionsByRound([
    question("q2", "r1", 1, 2, "canonical"),
    question("q1", "r1", 1, 1),
    question("q3", "r2", 2, 1),
  ], rounds);
  assert.deepEqual(grouped.map((round) => round.questions.map((item) => item.id)), [["q1", "q2"], ["q3"]]);
  assert.deepEqual(calculateInterviewStats({
    rounds: [{ roundNumber: 1 }, { roundNumber: 1 }, { roundNumber: 2 }],
    questions: [{ questionId: "canonical", questionType: "coding" }, { questionId: null, questionType: "behavioral" }],
    topics: [{ slug: "rl" }, { slug: "rl" }, { slug: "robotics" }],
  }), {
    roundCount: 2,
    questionCount: 2,
    linkedQuestionCount: 1,
    codingQuestionCount: 1,
    topicCount: 2,
  });
});

test("related interview ranking excludes the current interview", () => {
  const base = {
    company: { id: "company-1" },
    position: { id: "position-1", category: "Research" },
    year: 2025,
    season: "spring",
    tags: ["vla"],
    publishedAt: "2025-01-01",
    updatedAt: "2025-01-01",
    stats: { questionCount: 1 },
  };
  const current = { ...base, id: "current" };
  const sameCompany = { ...base, id: "same-company", company: { id: "company-1" }, tags: ["vla", "robotics"] };
  const other = { ...base, id: "other", company: { id: "company-2" }, position: { id: "position-2", category: "Product" }, tags: [] };
  const result = rankRelatedInterviews(current, [current, other, sameCompany]);
  assert.deepEqual(result.map((item) => item.id), ["same-company", "other"]);
});

test("source metadata rejects unsafe URLs and distinguishes verification states", () => {
  assert.equal(interviewVerificationState("published", null, "development_seed"), "unverified");
  assert.equal(interviewVerificationState("published", "2026-01-01", "community"), "verified");
  assert.equal(mapSourceMetadata({ sourceType: "community", sourceUrl: "javascript:alert(1)", status: "published", verifiedAt: null }).url, null);
  assert.equal(mapSourceMetadata({ sourceType: "community", sourceUrl: "https://example.com/report", status: "published", verifiedAt: null }).url, "https://example.com/report");
});

test("in-process judge rate limiter rejects bursts and expires a window", () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  assert.deepEqual(checkRateLimit(key, 2, 1000, 1000), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(checkRateLimit(key, 2, 1000, 1001), { allowed: true, retryAfterSeconds: 0 });
  const blocked = checkRateLimit(key, 2, 1000, 1002);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 1);
  assert.equal(checkRateLimit(key, 2, 1000, 2001).allowed, true);
});
