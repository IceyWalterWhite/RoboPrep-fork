import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { requireReviewer } from "@/lib/auth/reviewer";
import { describeFeatureFlags } from "@/lib/feature-flags";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";
import { createParser } from "@/lib/ingestion/parser/service";

export const metadata: Metadata = {
  title: "System diagnostics",
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

  const probeResult = await admin.from("companies").select("id", { count: "exact" }).limit(1);
  const judgeConfigured = serverEnv.JUDGE_PROVIDER === "judge0" ? Boolean(serverEnv.JUDGE0_BASE_URL) : true;
  const parser = createParser();
  const dbOk = !probeResult.error;
  const ingestionConfigured = process.env.INGESTION_LLM_PROVIDER ? "llm provider" : "mock parser (dev/CI)";
  void parser;

  return (
    <Container width="wide" className="py-10">
      <header>
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">System diagnostics</h1>
        <p className="text-ink-tertiary mt-1 text-sm">
          Posture only — secret values are never shown here or in logs.
        </p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Database</h2>
          <p className="mt-2 text-sm">
            <span className={dbOk ? "text-success-ink" : "text-danger-ink"}>{dbOk ? "Reachable" : "Unreachable"}</span>
            <span className="text-ink-tertiary"> · service-role client</span>
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Judge</h2>
          <p className="text-ink-secondary mt-2 text-sm">
            Provider: <span className="text-ink">{serverEnv.JUDGE_PROVIDER}</span>
            {serverEnv.JUDGE_PROVIDER === "judge0" && (
              <span> · endpoint {judgeConfigured ? "configured" : "MISSING"}</span>
            )}
            {serverEnv.JUDGE_PROVIDER === "local" && (
              <span className="text-warning-ink"> · development adapter — production requires an isolated provider</span>
            )}
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Ingestion parser</h2>
          <p className="text-ink-secondary mt-2 text-sm">
            Mode: <span className="text-ink">{ingestionConfigured}</span>
            <span className="text-ink-tertiary"> · provider keys are server-only and never logged</span>
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Feature flags</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {describeFeatureFlags().map((entry) => (
              <li key={entry.flag} className="text-ink-secondary flex justify-between">
                <span>{entry.flag}</span>
                <span className={entry.enabled ? "text-success-ink" : "text-warning-ink"}>{entry.enabled ? "on" : "off"}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Container>
  );
}
