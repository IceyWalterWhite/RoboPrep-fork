import type { IngestionErrorCode } from "@/types/ingestion";

/**
 * Typed ingestion errors. Provider failures map into safe error codes
 * (Task 52); messages stored on jobs never include secrets or raw provider
 * payloads.
 */
export class IngestionError extends Error {
  readonly code: IngestionErrorCode;
  readonly retryable: boolean;

  constructor(code: IngestionErrorCode, message: string, retryable?: boolean) {
    super(message);
    this.name = "IngestionError";
    this.code = code;
    this.retryable = retryable ?? RETRYABLE.has(code);
  }
}

const RETRYABLE = new Set(["rate_limited", "timeout", "provider_outage"]);

export function errorFromStatus(status: number): IngestionError {
  if (status === 429) return new IngestionError("rate_limited", "parser provider rate limited the request");
  if (status >= 500) return new IngestionError("provider_outage", `provider responded with ${status}`);
  return new IngestionError("unknown", `provider responded with ${status}`);
}

export function errorFromUnknown(error: unknown): IngestionError {
  if (error instanceof IngestionError) return error;
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return new IngestionError("timeout", "parser call timed out");
    }
    return new IngestionError("unknown", error.message.slice(0, 300));
  }
  return new IngestionError("unknown", "unknown parser failure");
}
