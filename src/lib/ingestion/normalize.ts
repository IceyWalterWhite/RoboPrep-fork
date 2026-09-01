/**
 * Deterministic text normalization and similarity used across matching and
 * duplicate detection (Tasks 21, 22, 27, 28). Pure functions, no I/O, so the
 * same input always yields the same scores.
 */

const FILLER_PATTERNS: Array<[RegExp, string]> = [
  [/[，。！？、；：""''（）【】《》]/g, " "],
  [/[?!,.;:'"()[\]<>]/g, " "],
  [/^(?:请问|面试官问|面试官问我|问我|他问|她问|然后问|接着问|问了我)\s*/g, ""],
  [/\s*(?:这个问题|这个问题吗|吗?|呢?)$/g, ""],
  [/\s+/g, " "],
];

/** Normalize a question occurrence: punctuation, case, whitespace, filler. */
export function normalizeQuestionText(text: string): string {
  let result = text.toLowerCase().trim();
  for (const [pattern, replacement] of FILLER_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result.trim();
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "question"
  );
}

/** Whitespace token set; CJK text yields one token per run. */
export function tokenize(text: string): Set<string> {
  return new Set(
    normalizeQuestionText(text)
      .split(" ")
      .filter((token) => token.length > 0),
  );
}

/** Jaccard-style token overlap, robust for short question strings. */
export function keywordOverlap(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Character bigram similarity (Dice coefficient) — cheap trigram proxy. */
export function bigramSimilarity(a: string, b: string): number {
  const gramsA = bigrams(normalizeQuestionText(a).replace(/\s/g, ""));
  const gramsB = bigrams(normalizeQuestionText(b).replace(/\s/g, ""));
  if (gramsA.length === 0 || gramsB.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const gram of gramsA) counts.set(gram, (counts.get(gram) ?? 0) + 1);
  let matches = 0;
  for (const gram of gramsB) {
    const remaining = counts.get(gram) ?? 0;
    if (remaining > 0) {
      matches += 1;
      counts.set(gram, remaining - 1);
    }
  }
  return (2 * matches) / (gramsA.length + gramsB.length);
}

function bigrams(text: string): string[] {
  const grams: string[] = [];
  for (let i = 0; i < text.length - 1; i += 1) {
    grams.push(text.slice(i, i + 2));
  }
  return grams;
}

/** Collapse exact duplicate occurrences within one submission (Task 28). */
export function groupDuplicateWording(texts: string[]): number[][] {
  const groups: number[][] = [];
  const seen = new Map<string, number>();
  for (const [index, text] of texts.entries()) {
    const key = normalizeQuestionText(text);
    const existing = seen.get(key);
    if (existing === undefined) {
      seen.set(key, index);
      groups.push([index]);
    } else {
      groups[groups.findIndex((group) => group[0] === existing)].push(index);
    }
  }
  return groups;
}
