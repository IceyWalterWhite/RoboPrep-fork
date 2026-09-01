/**
 * Week 8 Task 39: deterministic onboarding destination — no LLM, stable for
 * every input. Skip yields a sensible default.
 */
export function getOnboardingDestination(input: {
  targetRoleCategory?: string | null;
  primaryFocus?: string | null;
  hasTargetCompany?: boolean;
}): string {
  const focus = input.primaryFocus ?? "both";
  if (focus === "coding") return "/coding";
  if (focus === "knowledge") return "/knowledge";
  if (input.hasTargetCompany) return "/companies";
  return "/interviews";
}
