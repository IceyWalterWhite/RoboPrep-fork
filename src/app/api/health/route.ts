import { getRequestId } from "@/lib/server/request";

/**
 * Week 8 Task 6: production health check. Minimal status only — never exposes
 * dependencies, versions, or configuration. Suitable for an uptime monitor.
 */
export async function GET(request: Request): Promise<Response> {
  return Response.json(
    { status: "ok" },
    {
      status: 200,
      headers: {
        "x-request-id": getRequestId(request),
        "cache-control": "no-store",
      },
    },
  );
}
