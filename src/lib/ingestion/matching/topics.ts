import type { TopicSuggestion } from "@/types/ingestion";

/**
 * Topic suggestion service (Tasks 25, 26).
 *
 * Strategy: keyword rules over the existing taxonomy first, canonical-match
 * topics when the canonical match is strong, optional LLM classifier last.
 * Suggestions only ever reference existing topic IDs — free-form topic
 * creation is rejected, and every suggestion is editable by the reviewer.
 */

export interface TopicRuleInput {
  topicId: string;
  topicName: string;
  keywords: string[];
}

export interface TopicSuggestionInput {
  normalizedText: string;
  canonicalTopicIds: string[];
  canonicalMatchScore: number;
  llmTopicSlugs?: string[];
}

export function suggestTopics(
  input: TopicSuggestionInput,
  topicRules: TopicRuleInput[],
  allTopics: Array<{ id: string; name: string; slug: string }>,
  options: { maxSuggestions?: number } = {},
): TopicSuggestion[] {
  const max = options.maxSuggestions ?? 3;
  const byId = new Map(allTopics.map((topic) => [topic.id, topic]));
  const suggestions: TopicSuggestion[] = [];
  const seen = new Set<string>();

  const add = (topicId: string, topicName: string, confidence: number, source: TopicSuggestion["source"]) => {
    if (seen.has(topicId) || !byId.has(topicId)) return;
    seen.add(topicId);
    suggestions.push({ topicId, topicName, confidence: Number(confidence.toFixed(4)), source });
  };

  // Strong canonical match: reuse the canonical question's topics first.
  if (input.canonicalMatchScore >= 0.7) {
    for (const topicId of input.canonicalTopicIds.slice(0, max)) {
      const topic = byId.get(topicId);
      if (topic) add(topic.id, topic.name, input.canonicalMatchScore, "canonical_match");
    }
  }

  // Keyword rules over the normalized text.
  for (const rule of topicRules) {
    const hits = rule.keywords.filter((keyword) => input.normalizedText.includes(keyword)).length;
    if (hits > 0) {
      add(rule.topicId, rule.topicName, Math.min(1, 0.4 + hits * 0.2), "keyword_rule");
    }
  }

  // Optional LLM classifier output, validated against the taxonomy by slug.
  if (input.llmTopicSlugs) {
    for (const slug of input.llmTopicSlugs.slice(0, max)) {
      const topic = allTopics.find((entry) => entry.slug === slug);
      if (topic) add(topic.id, topic.name, 0.5, "llm_classifier");
      // Unknown slugs are silently dropped — never surfaced, never created.
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, max);
}

/** Coding vs Knowledge detection (Task 60): signal words, reviewer can override. */
export function detectCodingSignal(text: string): boolean {
  return /实现|手写|手搓|写一个|write|implement|coding|algorithm|函数|class|leetcode|编程题/i.test(text);
}
