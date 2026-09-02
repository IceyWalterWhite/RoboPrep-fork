"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingDestination } from "@/lib/onboarding/routing";

/**
 * Week 8 Tasks 37, 39, 43, 44: onboarding completion, account settings, and
 * account deletion actions. All server-side; no client-authoritative fields.
 */

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/onboarding");

  const targetRoleCategory = ((formData.get("targetRoleCategory") as string) ||
    "unsure") as "research" | "engineering" | "mixed" | "unsure";
  const primaryFocus = ((formData.get("primaryFocus") as string) || "both") as
    "knowledge" | "coding" | "both";
  const skipped = formData.get("skipped") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      target_role_category: targetRoleCategory,
      primary_focus: primaryFocus,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) redirect("/onboarding?error=无法保存偏好设置，请稍后再试。");

  revalidatePath("/onboarding");
  if (skipped) redirect("/interviews");
  redirect(getOnboardingDestination({ targetRoleCategory, primaryFocus }));
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/settings");

  const displayName = ((formData.get("displayName") as string) || "")
    .trim()
    .slice(0, 60);
  const targetRoleCategory = (formData.get("targetRoleCategory") as string) || null;
  const primaryFocus = (formData.get("primaryFocus") as string) || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(displayName ? { display_name: displayName } : {}),
      ...(targetRoleCategory
        ? {
            target_role_category: targetRoleCategory as
              "research" | "engineering" | "mixed" | "unsure",
          }
        : {}),
      ...(primaryFocus
        ? { primary_focus: primaryFocus as "knowledge" | "coding" | "both" }
        : {}),
    })
    .eq("id", user.id);
  if (error) redirect("/settings?error=无法保存设置。");

  revalidatePath("/settings");
  redirect("/settings?saved=true");
}

/**
 * Task 44: account deletion. Deletes the auth user via the service role;
 * foreign keys cascade the profile and null out submission ownership, so
 * coding submissions become anonymous aggregates and community interview
 * provenance stays anonymous by design (Week 6 Task 38).
 */
export async function deleteAccountAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/settings");
  if (formData.get("confirm") !== "DELETE") {
    redirect("/settings?error=请输入 DELETE 以确认删除账户。");
  }

  const admin = createAdminClient();
  if (!admin) redirect("/settings?error=账户删除功能暂时不可用。");

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) redirect("/settings?error=账户删除失败，请联系支持团队。");

  redirect("/?deleted=true");
}
