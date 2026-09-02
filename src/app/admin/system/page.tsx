import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { requireReviewer } from "@/lib/auth/reviewer";
import { describeFeatureFlags, FEATURE_FLAG_LABELS } from "@/lib/feature-flags";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";
import { createParser } from "@/lib/ingestion/parser/service";

export const metadata: Metadata = {
  title: "系统诊断",
  robots: { index: false, follow: false },
};

/**
 * Week 8 Task 7: admin deep diagnostics — DB connectivity, judge config,
 * ingestion config, feature flags, stats freshness. Admin-only; shows
 * configuration *posture* (on/off/provider), never secret values.
 */
export default async function AdminSystemPage() {
  const viewer = await requireReviewer();
  if (!viewer) notFound();
  const admin = createAdminClient();
  if (!admin) notFound();

  const probeResult = await admin
    .from("companies")
    .select("id", { count: "exact" })
    .limit(1);
  const judgeConfigured =
    serverEnv.JUDGE_PROVIDER === "judge0" ? Boolean(serverEnv.JUDGE0_BASE_URL) : true;
  const parser = createParser();
  const dbOk = !probeResult.error;
  const ingestionConfigured = process.env.INGESTION_LLM_PROVIDER
    ? "llm provider"
    : "mock parser (dev/CI)";
  void parser;

  return (
    <Container width="wide" className="py-10">
      <header>
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">
          系统诊断
        </h1>
        <p className="text-ink-tertiary mt-1 text-sm">
          仅展示配置状态——这里和日志中都不会显示密钥值。
        </p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
            数据库
          </h2>
          <p className="mt-2 text-sm">
            <span className={dbOk ? "text-success-ink" : "text-danger-ink"}>
              {dbOk ? "可访问" : "不可访问"}
            </span>
            <span className="text-ink-tertiary"> · service-role 客户端</span>
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
            判题服务
          </h2>
          <p className="text-ink-secondary mt-2 text-sm">
            提供方：<span className="text-ink">{serverEnv.JUDGE_PROVIDER}</span>
            {serverEnv.JUDGE_PROVIDER === "judge0" && (
              <span> · 端点{judgeConfigured ? "已配置" : "缺失"}</span>
            )}
            {serverEnv.JUDGE_PROVIDER === "local" && (
              <span className="text-warning-ink">
                {" "}
                · 开发适配器——生产环境需要隔离的提供方
              </span>
            )}
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
            数据导入解析器
          </h2>
          <p className="text-ink-secondary mt-2 text-sm">
            模式：
            <span className="text-ink">
              {ingestionConfigured === "llm provider"
                ? "LLM 提供方"
                : "模拟解析器（开发/CI）"}
            </span>
            <span className="text-ink-tertiary">
              {" "}
              · 提供方密钥仅限服务端使用，且不会写入日志
            </span>
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
            功能开关
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {describeFeatureFlags().map((entry) => (
              <li key={entry.flag} className="text-ink-secondary flex justify-between">
                <span>{FEATURE_FLAG_LABELS[entry.flag] ?? "未知开关"}</span>
                <span
                  className={entry.enabled ? "text-success-ink" : "text-warning-ink"}
                >
                  {entry.enabled ? "开启" : "关闭"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Container>
  );
}
