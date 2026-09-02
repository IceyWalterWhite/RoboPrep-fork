import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { completeOnboardingAction } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "欢迎 — RoboPrep",
  robots: { index: false, follow: false },
};

const ROLE_OPTIONS = [
  { value: "research", label: "研究（VLA、世界模型、扩散）" },
  { value: "engineering", label: "工程（机器人软件、ML 基础设施）" },
  { value: "mixed", label: "研究 + 工程" },
  { value: "unsure", label: "暂时不确定" },
] as const;

const FOCUS_OPTIONS = [
  { value: "knowledge", label: "先学知识" },
  { value: "coding", label: "先做 Coding" },
  { value: "both", label: "两者并重" },
] as const;

/**
 * Week 8 Task 37: skippable first-run onboarding — three optional questions,
 * no LLM, deterministic destination (Task 39).
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/onboarding");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.onboarding_completed_at) redirect("/interviews");

  const { error } = await searchParams;

  return (
    <Container className="py-14">
      <div className="mx-auto max-w-xl">
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">
          欢迎来到 RoboPrep
        </h1>
        <p className="text-ink-secondary mt-2 text-sm leading-relaxed">
          回答两个小问题，我们会为你推荐合适的起点。所有内容均可跳过。
        </p>

        {error && (
          <p role="alert" className="text-danger mt-4 text-sm">
            {error}
          </p>
        )}

        <Card className="mt-6 p-6">
          <form action={completeOnboardingAction} className="flex flex-col gap-5">
            <fieldset>
              <legend className="text-ink text-sm font-medium">
                你准备应聘哪类岗位？
              </legend>
              <div className="mt-2 flex flex-col gap-2">
                {ROLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="text-ink-secondary flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="targetRoleCategory"
                      value={option.value}
                      defaultChecked={option.value === "unsure"}
                      className="accent-accent"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-ink text-sm font-medium">你想从哪里开始？</legend>
              <div className="mt-2 flex flex-col gap-2">
                {FOCUS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="text-ink-secondary flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="primaryFocus"
                      value={option.value}
                      defaultChecked={option.value === "both"}
                      className="accent-accent"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="border-line-subtle flex items-center gap-3 border-t pt-4">
              <Button type="submit">开始练习</Button>
              <Button type="submit" name="skipped" value="true" variant="ghost">
                暂时跳过
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
}
