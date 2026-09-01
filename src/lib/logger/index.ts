import { randomUUID } from "node:crypto";

import { SAFE_LOG_KEYS, redactMessage, redactMetadata } from "@/lib/security/redact";

/**
 * Week 8 Task 8: structured server logging. One shape for every server log:
 *
 *   { time, level, event, requestId, route, jobId, durationMs, ...meta }
 *
 * Rules: no hidden tests, no raw PII, no tokens, no provider payloads —
 * metadata is scrubbed through the security/redact policy (Task 12). Output
 * is JSON lines so a production log drain can index them (Task 101).
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  route?: string;
  jobId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

function emit(level: LogLevel, event: string, context: LogContext = {}): void {
  const { requestId, route, jobId, durationMs, ...rest } = context;
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    event,
    requestId: requestId ?? null,
    route: route ?? null,
    jobId: jobId ?? null,
    durationMs: durationMs ?? null,
    ...(rest && Object.keys(rest).length > 0 ? redactMetadata(rest, SAFE_LOG_KEYS) : {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== "production") emit("debug", event, context);
  },
  info: (event: string, context?: LogContext) => emit("info", event, context),
  warn: (event: string, context?: LogContext) => emit("warn", event, context),
  error: (event: string, context?: LogContext) => emit("error", event, context),
  /** Scrub-and-emit convenience for caught errors. */
  warnFrom: (event: string, error: unknown, context: LogContext = {}) => {
    const message = error instanceof Error ? error.message : String(error);
    emit("warn", event, { ...context, errorMessage: redactMessage(message) });
  },
  errorFrom: (event: string, error: unknown, context: LogContext = {}) => {
    const message = error instanceof Error ? error.message : String(error);
    emit("error", event, { ...context, errorMessage: redactMessage(message) });
  },
};

/** Task 9: correlation id — read or create for the current request. */
export function getOrCreateRequestId(request: Request): string {
  const existing = request.headers.get("x-request-id");
  if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
  return randomUUID();
}

/** Safe support id for user-facing error copy: short, no payload. */
export function supportId(requestId: string): string {
  return requestId.slice(0, 8);
}

export { redactMessage, redactMetadata };
