import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 renamed the `middleware` file convention to `proxy`
 * (see https://nextjs.org/docs/messages/middleware-to-proxy).
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request);
  // Week 8 Task 9: correlate every request with a stable id. Server code and
  // logs read it via `getRequestId(request)`; users get the short support id.
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  supabaseResponse.headers.set("x-request-id", requestId);
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next.js internals and static assets, so sessions
     * refresh on page navigations without touching public files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
