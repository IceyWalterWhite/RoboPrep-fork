import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/judge/rate-limit";
import { getRequestId } from "@/lib/server/request";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const ENTITY_TYPES = [
  "interview",
  "question",
  "coding_problem",
  "company",
  "other",
] as const;
const REASONS = [
  "inaccuracy",
  "privacy",
  "duplicate",
  "inappropriate",
  "other",
] as const;

/**
 * Week 8 Task 94: report content intake. Structured reasons, rate limited,
 * reporter identity never public. Inserted via the service role because
 * content_reports has no anonymous policies and reporters may be signed out.
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = getRequestId(request);
  const user = await getCurrentUser();

  const rate = checkRateLimit(`report:${user?.id ?? requestId}`, 10, 3_600_000);
  if (!rate.allowed) {
    return Response.json(
      { error: "举报次数过多，请稍后再试。" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求无效。" }, { status: 400 });
  }

  const { entityType, entityId, reason, details } = (body ?? {}) as Record<
    string,
    string | undefined
  >;
  if (!entityType || !(ENTITY_TYPES as readonly string[]).includes(entityType)) {
    return Response.json({ error: "内容类型无效。" }, { status: 400 });
  }
  if (!entityId || !/^[0-9a-f-]{36}$/i.test(entityId)) {
    return Response.json({ error: "内容引用无效。" }, { status: 400 });
  }
  if (!reason || !(REASONS as readonly string[]).includes(reason)) {
    return Response.json({ error: "请选择举报原因。" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "举报功能暂时不可用。" }, { status: 503 });
  }

  const { error } = await admin.from("content_reports").insert({
    user_id: user?.id ?? null,
    entity_type: entityType as (typeof ENTITY_TYPES)[number],
    entity_id: entityId,
    reason: reason as (typeof REASONS)[number],
    details: (details ?? "").trim().slice(0, 2000) || null,
  });
  if (error) {
    logger.warnFrom("report_insert_failed", error, { requestId, route: "/api/report" });
    return Response.json({ error: "无法保存举报，请稍后再试。" }, { status: 503 });
  }

  logger.info("report_received", {
    requestId,
    route: "/api/report",
    entityType,
    reason,
  });
  return Response.json({ ok: true }, { status: 201 });
}
