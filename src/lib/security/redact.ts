/**
 * Week 8 Task 12: centralized error/log scrubbing policy.
 *
 * Everything that reaches logs, error tracking, or analytics payloads goes
 * through these helpers. Raw interview text, source code, hidden tests, and
 * provider payloads never pass through.
 */

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\d\s-]{7,}\d)/g;
/** Bearer tokens, API keys in headers/query, supabase JWTs. */
const TOKEN_RE = /(?:bearer\s+[a-z0-9._-]+|api[_-]?key[=:]\s*\S+|eyJ[a-z0-9_-]{10,}\.[a-z0-9._-]+)/gi;

/** Scrub a free-form message before logging or reporting. */
export function redactMessage(message: string): string {
  return message
    .replace(EMAIL_RE, "[email]")
    .replace(TOKEN_RE, "[token]")
    .replace(PHONE_RE, "[phone]")
    .slice(0, 500);
}

/**
 * Scrub a structured metadata object. Only primitive values pass; anything
 * object-valued is summarized as "[object]" so whole payloads (source code,
 * hidden tests, raw submissions) cannot leak into logs.
 */
export function redactMetadata(
  metadata: Record<string, unknown>,
  allowedKeys: ReadonlySet<string> = new Set(),
): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
    } else if (typeof value === "string") {
      result[key] = allowedKeys.has(key) ? value.slice(0, 200) : redactMessage(value);
    } else {
      result[key] = "[redacted]";
    }
  }
  return result;
}

/** Fields that may pass through unredacted in request metadata. */
export const SAFE_LOG_KEYS = new Set([
  "route",
  "method",
  "status",
  "durationMs",
  "submissionType",
  "jobType",
  "provider",
  "model",
  "flag",
  "slug",
  "companySlug",
  "positionSlug",
  "entityType",
  "reason",
  "category",
]);
