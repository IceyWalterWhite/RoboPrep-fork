import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { completeOnboardingAction } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Welcome — RoboPrep",
  robots: { index: false, follow: false },
};

const ROLE_OPTIONS = [
  { value: "research", label: "Research (VLA, world models, diffusion)" },
  { value: "engineering", label: "Engineering (robot software, ML infra)" },
  { value: "mixed", label: "Mixed research + engineering" },
  { value: "unsure", label: "Not sure yet" },
] as const;

const FOCUS_OPTIONS = [
  { value: "knowledge", label: "Knowledge first" },
  { value: "coding", label: "Coding first" },
  { value: "both", label: "Both equally" },
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
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">Welcome to RoboPrep</h1>
        <p className="text-ink-secondary mt-2 text-sm leading-relaxed">
          Two quick questions to point you at the right starting content. Everything here is optional.
        </p>

        {error && <p role="alert" className="text-danger mt-4 text-sm">{error}</p>}

        <Card className="mt-6 p-6">
          <form action={completeOnboardingAction} className="flex flex-col gap-5">
            <fieldset>
              <legend className="text-ink text-sm font-medium">What kind of role are you preparing for?</legend>
              <div className="mt-2 flex flex-col gap-2">
                {ROLE_OPTIONS.map((option) => (
                  <label key={option.value} className="text-ink-secondary flex items-center gap-2 text-sm">
                    <input type="radio" name="targetRoleCategory" value={option.value} defaultChecked={option.value === "unsure"} className="accent-accent" />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-ink text-sm font-medium">Where do you want to start?</legend>
              <div className="mt-2 flex flex-col gap-2">
                {FOCUS_OPTIONS.map((option) => (
                  <label key={option.value} className="text-ink-secondary flex items-center gap-2 text-sm">
                    <input type="radio" name="primaryFocus" value={option.value} defaultChecked={option.value === "both"} className="accent-accent" />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="border-line-subtle flex items-center gap-3 border-t pt-4">
              <Button type="submit">Start practicing</Button>
              <Button type="submit" name="skipped" value="true" variant="ghost">
                Skip for now
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
}
