import { getRequestId } from "@/lib/server/request";
import { checkRateLimit } from "@/lib/judge/rate-limit";
import { globalSearch } from "@/lib/search";

export const runtime = "nodejs";

/**
 * Week 8 Task 26: grouped global search API. Query length bounded, per-group
 * counts bounded, rate limited; no full-table dumps reach the browser.
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = getRequestId(request);
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 60);

  if (query.length < 2) {
    return Response.json(
      { query, groups: [], total: 0 },
      { status: 200, headers: { "x-request-id": requestId, "cache-control": "no-store" } },
    );
  }

  const rate = checkRateLimit(`search:${requestId}`, 60, 60_000);
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many searches. Please slow down." },
      { status: 429, headers: { "x-request-id": requestId, "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  try {
    const results = await globalSearch(query);
    return Response.json(results, {
      status: 200,
      headers: { "x-request-id": requestId, "cache-control": "private, max-age=15" },
    });
  } catch {
    // Task 28: no raw DB errors to the client; log scrubbed server-side.
    console.warn(JSON.stringify({ level: "warn", event: "search_failed", requestId }));
    return Response.json(
      { error: "Search is temporarily unavailable. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
