/**
 * Week 8 Task 27: deterministic global-search ranking + Tasks 113/115 alias
 * support. Pure functions, offline-testable.
 *
 * Ranking: exact title match > alias match > prefix > word-prefix >
 * substring. Ties break alphabetically. "GRPO" must surface the canonical
 * GRPO entities on the first screen.
 */

export interface SearchableItem {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
}

export interface ScoredSearchItem<T extends SearchableItem> {
  item: T;
  score: number;
}

/** Task 113: bilingual term aliases (中文 ↔ English). */
export const SEARCH_TERM_ALIASES: ReadonlyArray<{ canonical: string; aliases: string[] }> = [
  { canonical: "grpo", aliases: ["群体相对策略优化", "组相对策略优化"] },
  { canonical: "attention", aliases: ["注意力", "注意力机制"] },
  { canonical: "world model", aliases: ["世界模型"] },
  { canonical: "vla", aliases: ["视觉语言动作模型", "vision language action"] },
  { canonical: "diffusion policy", aliases: ["扩散策略"] },
  { canonical: "reinforcement learning", aliases: ["强化学习", "rl"] },
  { canonical: "transformer", aliases: ["变换器"] },
  { canonical: "kv cache", aliases: ["键值缓存"] },
  { canonical: "slerp", aliases: ["球面线性插值"] },
  { canonical: "action chunking", aliases: ["动作分块"] },
];

/** Task 114: company alias fallback (the company_aliases table is authoritative). */
export const COMPANY_ALIAS_FALLBACK: ReadonlyArray<{ companySlug: string; aliases: string[] }> = [
  { companySlug: "bytedance", aliases: ["字节跳动", "字节", "tiktok"] },
  { companySlug: "alibaba", aliases: ["阿里巴巴", "阿里"] },
  { companySlug: "tencent", aliases: ["腾讯"] },
  { companySlug: "nvidia", aliases: ["英伟达"] },
  { companySlug: "google", aliases: ["谷歌"] },
  { companySlug: "microsoft", aliases: ["微软"] },
  { companySlug: "huawei", aliases: ["华为"] },
  { companySlug: "xiaomi", aliases: ["小米"] },
  { companySlug: "baidu", aliases: ["百度"] },
  { companySlug: "meituan", aliases: ["美团"] },
];

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

export function scoreMatch(query: string, title: string, subtitle?: string | null): number {
  const q = normalize(query);
  const t = normalize(title);
  const s = subtitle ? normalize(subtitle) : "";

  if (t === q) return 1;
  if (t.startsWith(q)) return 0.9;
  if (t.split(" ").some((word) => word.startsWith(q))) return 0.75;
  if (t.includes(q)) return 0.6;
  if (s.includes(q)) return 0.4;
  return 0;
}

/** Alias-expanded scoring: the query (or its alias) matching the title. */
export function scoreWithAliases(
  query: string,
  item: SearchableItem,
  aliases?: ReadonlyArray<{ canonical: string; aliases: string[] }>,
): number {
  const base = scoreMatch(query, item.title, item.subtitle);
  if (base >= 1) return base;
  let best = base;
  const q = normalize(query);
  if (aliases) {
    for (const entry of aliases) {
      const canonical = normalize(entry.canonical);
      const aliasHit =
        canonical === q ||
        entry.aliases.some((alias) => normalize(alias) === q);
      if (!aliasHit) continue;
      // The query is an alias of this canonical term; match it against the item.
      const scored = Math.max(scoreMatch(entry.canonical, item.title, item.subtitle));
      // Alias resolution itself is strong evidence.
      best = Math.max(best, scored > 0 ? Math.min(0.95, scored + 0.1) : 0);
    }
  }
  return best;
}

export function rankResults<T extends SearchableItem>(
  query: string,
  items: T[],
  options: { limit?: number; aliases?: ReadonlyArray<{ canonical: string; aliases: string[] }> } = {},
): Array<ScoredSearchItem<T>> {
  const limit = options.limit ?? 5;
  return items
    .map((item) => ({ item, score: scoreWithAliases(query, item, options.aliases) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit);
}
