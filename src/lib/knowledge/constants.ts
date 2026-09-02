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
  recommended: "推荐",
  most_asked: "最常提问",
  trending: "趋势",
  newest: "最新",
};

export const DIFFICULTY_LABELS = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
} as const;

export const QUESTION_TYPE_LABELS = {
  knowledge: "知识",
  coding: "Coding",
  system_design: "系统设计",
  research: "研究",
  behavioral: "行为",
} as const;

export const RELATION_GROUP_LABELS = {
  prerequisite: "前置知识",
  related: "相关问题",
  contrast: "对比问题",
  follow_up: "面试官可能继续追问",
} as const;

/** Max rows shown in "Seen in interviews" before truncation. */
export const OCCURRENCES_PREVIEW_LIMIT = 5;

/** Max items in the Trending panel on /knowledge. */
export const TRENDING_LIMIT = 5;

/** Max featured question cards on /knowledge. */
export const FEATURED_QUESTIONS_LIMIT = 4;
