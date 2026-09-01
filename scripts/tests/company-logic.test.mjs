/**
 * Tasks 54, 55: offline, deterministic unit tests for company intelligence
 * metric helpers and query fallback behavior. No database, no network.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  difficultyAverage,
  emphasisSplit,
  isDeclining,
  isEmerging,
  median,
  normalizeSeason,
  occurrenceGuideScore,
  roleUsesFallback,
  sampleBand,
  topicGuideScore,
  trendScore,
} from "../../src/lib/companies/helpers.ts";
import { classifyTrends } from "../../src/lib/companies/intelligence.ts";
import { companyFiltersToQueryString, parseCompanyFilters } from "../../src/lib/companies/filters.ts";

// ---------------------------------------------------------------------------
// Sample-size policy (Task 24)
// ---------------------------------------------------------------------------

test("sample bands follow the limited/counts/percentage policy", () => {
  assert.equal(sampleBand(1), "limited");
  assert.equal(sampleBand(2), "limited");
  assert.equal(sampleBand(3), "counts");
  assert.equal(sampleBand(9), "counts");
  assert.equal(sampleBand(10), "percentage");
});

// ---------------------------------------------------------------------------
// Deterministic metrics (Tasks 8, 32, 35)
// ---------------------------------------------------------------------------

test("difficulty average excludes unknown and maps easy=1/medium=2/hard=3", () => {
  assert.equal(difficultyAverage({ easy: 1, medium: 1, hard: 2 }), 2.25);
  assert.equal(difficultyAverage({ easy: 0, medium: 0, hard: 0 }), null);
});

test("median has no false precision", () => {
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([]), null);
});

test("trend score is volume-normalized and deterministic", () => {
  const first = trendScore({ recentOccurrences: 3, recentInterviews: 5, olderOccurrences: 2, olderInterviews: 10 });
  assert.equal(first, trendScore({ recentOccurrences: 3, recentInterviews: 5, olderOccurrences: 2, olderInterviews: 10 }));
  assert.equal(first, 0.4);
  // Same occurrences with more interviews → weaker trend.
  const diluted = trendScore({ recentOccurrences: 3, recentInterviews: 20, olderOccurrences: 2, olderInterviews: 10 });
  assert.ok(Math.abs(diluted) < Math.abs(first));
});

// ---------------------------------------------------------------------------
// Emphasis (Task 28)
// ---------------------------------------------------------------------------

test("emphasis split classifies coding vs knowledge vs unclassified", () => {
  const split = emphasisSplit([{ coding: true }, { coding: false }, { coding: false }, { coding: true }, { coding: false }]);
  assert.equal(split.codingShare, 0.4);
  assert.equal(split.knowledgeShare, 0.6);
  assert.equal(split.unclassifiedShare, 0);
  assert.deepEqual(emphasisSplit([]), { codingShare: null, knowledgeShare: null, unclassifiedShare: null });
});

// ---------------------------------------------------------------------------
// Preparation ranking (Task 42)
// ---------------------------------------------------------------------------

test("topic guide score weights share over trend and is stable", () => {
  const highShare = topicGuideScore({ shareOfInterviews: 0.8, trendScore: 0 });
  const highTrend = topicGuideScore({ shareOfInterviews: 0, trendScore: 0.8 });
  assert.ok(highShare > highTrend); // 0.5*0.8 = 0.4 vs 0.3*0.8 = 0.24
  assert.equal(highShare, topicGuideScore({ shareOfInterviews: 0.8, trendScore: 0 }));
  // Role relevance adds the remaining weight.
  const withRole = topicGuideScore({ shareOfInterviews: 0.8, trendScore: 0, roleRelevance: 1 });
  assert.equal(withRole, 0.6);
});

test("occurrence guide score prefers frequent, trending, recent questions", () => {
  const frequent = occurrenceGuideScore({ interviewCount: 8, maxInterviewCount: 8, trendScore: 0, daysSinceLastSeen: 0 });
  const rare = occurrenceGuideScore({ interviewCount: 2, maxInterviewCount: 8, trendScore: 0, daysSinceLastSeen: 365 });
  assert.ok(frequent > rare);
  assert.equal(frequent, occurrenceGuideScore({ interviewCount: 8, maxInterviewCount: 8, trendScore: 0, daysSinceLastSeen: 0 }));
});

// ---------------------------------------------------------------------------
// Emerging / declining (Tasks 37, 38)
// ---------------------------------------------------------------------------

test("emerging requires recent occurrences and a significant rise", () => {
  assert.ok(isEmerging({ recentCount: 2, trendScore: 0.4 }));
  assert.ok(!isEmerging({ recentCount: 1, trendScore: 0.9 })); // single-record overclaim blocked
  assert.ok(!isEmerging({ recentCount: 2, trendScore: 0.1 })); // noise suppressed
});

test("declining requires sufficient history on both sides", () => {
  assert.ok(isDeclining({ recentCount: 1, olderCount: 3, trendScore: -0.4 }));
  assert.ok(!isDeclining({ recentCount: 0, olderCount: 3, trendScore: -0.9 }));
  assert.ok(!isDeclining({ recentCount: 1, olderCount: 1, trendScore: -0.4 }));
});

// ---------------------------------------------------------------------------
// Trend classification (Task 36) — no overclaim from tiny samples
// ---------------------------------------------------------------------------

test("trend classification filters items below the minimum occurrence threshold", () => {
  const trends = classifyTrends({
    topics: [
      { topicId: "t1", topicName: "GRPO", topicSlug: "grpo", occurrenceCount: 5, interviewCount: 4, shareOfInterviews: 0.5, trendScore: 0.5, lastSeenAt: null },
      { topicId: "t2", topicName: "Tiny", topicSlug: "tiny", occurrenceCount: 1, interviewCount: 1, shareOfInterviews: 0.5, trendScore: 0.9, lastSeenAt: null },
    ],
    questions: [],
    codingProblems: [],
  });
  assert.ok(trends.some((item) => item.label === "GRPO" && item.direction === "rising"));
  assert.ok(!trends.some((item) => item.label === "Tiny"));
});

// ---------------------------------------------------------------------------
// Season normalization + role fallback (Tasks 7, 44)
// ---------------------------------------------------------------------------

test("season normalization folds fall into autumn and is case-insensitive", () => {
  assert.equal(normalizeSeason("Fall"), "autumn");
  assert.equal(normalizeSeason("SPRING"), "spring");
  assert.equal(normalizeSeason(null), null);
});

test("role pages fall back to company-wide stats below three interviews", () => {
  assert.ok(roleUsesFallback(2));
  assert.ok(!roleUsesFallback(3));
});

// ---------------------------------------------------------------------------
// Directory filters (Tasks 15, 16, 55)
// ---------------------------------------------------------------------------

test("company filters parse URL params and round-trip", () => {
  const params = parseCompanyFilters({ q: "nvidia", filter: "has_coding" });
  assert.equal(params.q, "nvidia");
  assert.equal(params.filter, "has_coding");
  assert.equal(companyFiltersToQueryString(params), "?q=nvidia&filter=has_coding");
  // Invalid filter values degrade to defaults instead of throwing.
  const fallback = parseCompanyFilters({ filter: "bogus" });
  assert.equal(fallback.filter, undefined);
});

test("company filter handles missing and empty params safely (Task 55)", () => {
  const empty = parseCompanyFilters({});
  assert.equal(empty.q, undefined);
  assert.equal(companyFiltersToQueryString(empty), "");
  const blank = parseCompanyFilters({ q: "", filter: "" });
  assert.equal(blank.q, undefined);
});
