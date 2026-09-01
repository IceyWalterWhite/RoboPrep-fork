import type { ModerationFlag } from "@/types/ingestion";

/**
 * Content moderation checks (Task 40) and PII redaction (Task 41).
 *
 * Flags never auto-delete and never auto-reject: they surface in the review
 * queue for a human. Stored flags contain only the match *type and count* —
 * never the matched content — so private data does not leak into metadata.
 * Raw source text is never mutated.
 */

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\d\s-]{7,}\d)/g;
/** WeChat / QQ / WhatsApp-style contact handles. */
const HANDLE_RE = /(?:微信|微信号|wechat|whatsapp|qq)\s*[:：]?\s*[a-z0-9_-]{5,}/gi;
const URL_RE = /https?:\/\/\S+/gi;
/** Obvious spam markers: contact-me CTAs and repeated promo phrasing. */
const SPAM_RE = /(?:加微信|加我|内部推荐|保offer|代面|付费咨询)/gi;

function countMatches(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length;
}

export function moderationFlags(rawText: string): ModerationFlag[] {
  const flags: ModerationFlag[] = [];
  const trimmed = rawText.trim();

  const email = countMatches(rawText, EMAIL_RE);
  if (email > 0) flags.push({ type: "email", count: email });

  const phone = countMatches(rawText, PHONE_RE);
  if (phone > 0) flags.push({ type: "phone", count: phone });

  const handle = countMatches(rawText, HANDLE_RE);
  if (handle > 0) flags.push({ type: "account_id", count: handle });

  const url = countMatches(rawText, URL_RE);
  if (url > 0) flags.push({ type: "url", count: url });

  const spam = countMatches(rawText, SPAM_RE);
  if (spam > 0) flags.push({ type: "spam", count: spam });

  if (trimmed.length < 50) flags.push({ type: "too_short", count: 1 });

  return flags;
}

/**
 * Redact common contact info from text destined for public display or for the
 * parser. The raw submission is never mutated; callers keep both versions.
 */
export function redactContactInfo(text: string): string {
  return text
    .replace(EMAIL_RE, "[邮箱已隐藏]")
    .replace(HANDLE_RE, "[联系方式已隐藏]")
    .replace(PHONE_RE, "[电话已隐藏]");
}
