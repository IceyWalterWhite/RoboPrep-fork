import type { Company } from "@/types/database";

import { bigramSimilarity, normalizeQuestionText } from "../normalize";

/**
 * Company matching (Task 19): exact normalized match, slug match, configured
 * aliases, then a fuzzy fallback. Low confidence returns unresolved — never
 * auto-creates a company.
 */

/** Configurable alias table; extend via seed data rather than code changes. */
const COMPANY_ALIASES: ReadonlyArray<{ canonical: string; aliases: string[] }> = [
  { canonical: "bytedance", aliases: ["字节跳动", "字节", "bytedance", "tiktok", "抖店"] },
  { canonical: "alibaba", aliases: ["阿里巴巴", "阿里", "淘宝", "天猫"] },
  { canonical: "tencent", aliases: ["腾讯", "微信事业群", "wxg"] },
  { canonical: "baidu", aliases: ["百度"] },
  { canonical: "meituan", aliases: ["美团", "点评"] },
  { canonical: "nvidia", aliases: ["英伟达"] },
  { canonical: "microsoft", aliases: ["微软", "msft"] },
  { canonical: "google", aliases: ["谷歌", "google llc"] },
  { canonical: "huawei", aliases: ["华为"] },
  { canonical: "xiaomi", aliases: ["小米"] },
];

export interface CompanyMatch {
  companyId: string | null;
  companyName: string | null;
  confidence: number;
  method: "exact" | "slug" | "alias" | "fuzzy" | "none";
}

export function matchCompany(
  parsedName: string | null,
  companies: Company[],
): CompanyMatch {
  if (!parsedName || parsedName.trim().length === 0) {
    return { companyId: null, companyName: null, confidence: 0, method: "none" };
  }

  const normalized = normalizeQuestionText(parsedName);
  const compact = normalized.replace(/\s/g, "");

  for (const company of companies) {
    if (company.name.toLowerCase() === parsedName.toLowerCase() || normalizeQuestionText(company.name) === normalized) {
      return { companyId: company.id, companyName: company.name, confidence: 1, method: "exact" };
    }
  }

  for (const company of companies) {
    if (company.slug === compact) {
      return { companyId: company.id, companyName: company.name, confidence: 0.95, method: "slug" };
    }
  }

  for (const company of companies) {
    const aliasGroup = COMPANY_ALIASES.find((entry) => entry.canonical === company.slug);
    if (aliasGroup && aliasGroup.aliases.some((alias) => compact.includes(alias) || alias === compact)) {
      return { companyId: company.id, companyName: company.name, confidence: 0.9, method: "alias" };
    }
  }

  // Fuzzy fallback: only a reviewer hint, never a confident resolution.
  let best: { company: Company; score: number } | null = null;
  for (const company of companies) {
    const score = Math.max(
      bigramSimilarity(parsedName, company.name),
      bigramSimilarity(parsedName, company.slug),
    );
    if (!best || score > best.score) best = { company, score };
  }
  if (best && best.score >= 0.85) {
    return { companyId: best.company.id, companyName: best.company.name, confidence: best.score * 0.8, method: "fuzzy" };
  }

  return { companyId: null, companyName: parsedName, confidence: best?.score ?? 0, method: "none" };
}

export { COMPANY_ALIASES };
