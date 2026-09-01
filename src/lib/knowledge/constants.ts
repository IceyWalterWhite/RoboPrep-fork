import type { KnowledgeSort } from "@/types/knowledge";

/** Knowledge product constants. Editing this file reconfigures the product. */

export const KNOWLEDGE_PAGE_SIZE = 20;

export const KNOWLEDGE_MAX_PAGE = 500;

/** Curated topic slugs shown as entry points on /knowledge (Task 18). */
export const FEATURED_TOPIC_SLUGS = [
  "vla",
  "world-model",
  "grpo",
  "diffusion-policy",
  "transformer",
  "robot-data",
  "robotics",
] as const;

export const KNOWLEDGE_SORTS: readonly KnowledgeSort[] = [
  "recommended",
  "most_asked",
  "trending",
  "newest",
];

export const KNOWLEDGE_SORT_LABELS: Record<KnowledgeSort, string> = {
  recommended: "Recommended",
  most_asked: "Most asked",
  trending: "Trending",
  newest: "Newest",
};

export const DIFFICULTY_LABELS = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
} as const;

export const QUESTION_TYPE_LABELS = {
  knowledge: "Knowledge",
  coding: "Coding",
  system_design: "System Design",
  research: "Research",
  behavioral: "Behavioral",
} as const;

export const RELATION_GROUP_LABELS = {
  prerequisite: "Prerequisites",
  related: "Related",
  contrast: "Compare with",
  follow_up: "Interviewer may continue asking",
} as const;

/** Max rows shown in "Seen in interviews" before truncation. */
export const OCCURRENCES_PREVIEW_LIMIT = 5;

/** Max items in the Trending panel on /knowledge. */
export const TRENDING_LIMIT = 5;

/** Max featured question cards on /knowledge. */
export const FEATURED_QUESTIONS_LIMIT = 4;
