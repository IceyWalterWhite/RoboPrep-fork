import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/judge/rate-limit";
import { getRequestId } from "@/lib/server/request";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const CATEGORIES = ["bug", "content_error", "feature", "other"] as const;

/**
 * Week 8 Task 116: feedback intake. Rate limited, length bounded, stored
 * without public exposure (RLS: authenticated insert own only).
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = getRequestId(request);
  const user = await getCurrentUser();

  // Anonymous feedback is allowed but rate limited per request id.
  const rate = checkRateLimit(`feedback:${user?.id ?? requestId}`, 5, 3_600_000);
  if (!rate.allowed) {
    return Response.json(
      { error: "提交次数过多，请稍后再试。" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求无效。" }, { status: 400 });
  }

  const { category, message } = (body ?? {}) as { category?: string; message?: string };
  if (!category || !(CATEGORIES as readonly string[]).includes(category)) {
    return Response.json({ error: "请选择反馈类别。" }, { status: 400 });
  }
  const trimmed = (message ?? "").trim();
  if (trimmed.length < 10 || trimmed.length > 5000) {
    return Response.json({ error: "消息长度必须为 10–5000 个字符。" }, { status: 400 });
  }

  // Anonymous feedback is accepted but must bypass RLS via the service role
  // (the table has no anonymous policies). Falls back to the user client when
  // the service role is not configured.
  const admin = createAdminClient();
  const client = admin ?? (await createClient());
  const { error } = await client.from("user_feedback").insert({
    user_id: user?.id ?? null,
    category: category as (typeof CATEGORIES)[number],
    message: trimmed,
  });
  if (error) {
    logger.warnFrom("feedback_insert_failed", error, {
      requestId,
      route: "/api/feedback",
    });
    return Response.json({ error: "无法保存反馈，请稍后再试。" }, { status: 503 });
  }

  logger.info("feedback_received", { requestId, route: "/api/feedback", category });
  return Response.json({ ok: true }, { status: 201 });
}
