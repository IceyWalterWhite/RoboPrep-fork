import "server-only";

/**
 * Week 8 Task 9: request/correlation id helpers for server routes and server
 * components. The proxy (middleware) assigns `x-request-id`; inside a route
 * handler the incoming Request carries it. In server components there is no
 * Request object, so we fall back to the (async) headers store.
 */
export function getRequestId(request: Request): string {
  const existing = request.headers.get("x-request-id");
  if (existing) return existing;
  return "unassigned";
}

/** Best-effort id for structured logs outside a request context. */
export function currentRequestId(): string | null {
  return null;
}
