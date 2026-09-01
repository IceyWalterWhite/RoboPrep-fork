import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { deleteAccountAction, updateProfileAction } from "@/app/settings/actions";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Settings — RoboPrep",
  robots: { index: false, follow: false },
};

/**
 * Week 8 Tasks 43, 44: minimal account settings — display name, preparation
 * preference, sign out, and a confirmed account-deletion flow.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/settings");
  const { saved, error } = await searchParams;

  const supabase = await createClient();
  const profile = await getCurrentProfile(user.id);
  const { data: row } = await supabase
    .from("profiles")
    .select("target_role_category, primary_focus")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <Container className="py-14">
      <PageHeader title="Settings" description={user.email} />

      {saved && <p role="status" className="text-success-ink mt-4 text-sm">Settings saved.</p>}
      {error && <p role="alert" className="text-danger mt-4 text-sm">{error}</p>}

      <Card className="mt-6 max-w-xl p-6">
        <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Profile</h2>
        <form action={updateProfileAction} className="mt-3 flex flex-col gap-4">
          <div>
            <label htmlFor="displayName" className="text-ink mb-1 block text-xs font-medium">Display name</label>
            <Input id="displayName" name="displayName" defaultValue={profile?.displayName ?? ""} maxLength={60} />
          </div>
          <div>
            <label htmlFor="targetRoleCategory" className="text-ink mb-1 block text-xs font-medium">Target role</label>
            <select
              id="targetRoleCategory"
              name="targetRoleCategory"
              defaultValue={row?.target_role_category ?? "unsure"}
              className="border-line bg-surface text-ink focus:outline-accent h-10 w-full rounded-sm border px-3 text-sm"
            >
              <option value="research">Research</option>
              <option value="engineering">Engineering</option>
              <option value="mixed">Mixed</option>
              <option value="unsure">Not sure yet</option>
            </select>
          </div>
          <div>
            <label htmlFor="primaryFocus" className="text-ink mb-1 block text-xs font-medium">Primary focus</label>
            <select
              id="primaryFocus"
              name="primaryFocus"
              defaultValue={row?.primary_focus ?? "both"}
              className="border-line bg-surface text-ink focus:outline-accent h-10 w-full rounded-sm border px-3 text-sm"
            >
              <option value="knowledge">Knowledge first</option>
              <option value="coding">Coding first</option>
              <option value="both">Both equally</option>
            </select>
          </div>
          <div>
            <Button type="submit">Save settings</Button>
          </div>
        </form>
      </Card>

      <Card className="mt-4 max-w-xl p-6">
        <h2 className="text-danger text-sm font-semibold tracking-wide uppercase">Danger zone</h2>
        <p className="text-ink-secondary mt-2 text-sm leading-relaxed">
          Deleting your account removes your profile and coding submissions. Published community
          interviews stay anonymous. This cannot be undone.
        </p>
        <details className="mt-3">
          <summary className="text-danger cursor-pointer text-sm font-medium">Delete account…</summary>
          <form action={deleteAccountAction} className="mt-3 flex items-end gap-3">
            <div>
              <label htmlFor="confirm" className="text-ink mb-1 block text-xs font-medium">
                Type DELETE to confirm
              </label>
              <Input id="confirm" name="confirm" required className="w-40" autoComplete="off" />
            </div>
            <Button type="submit" variant="danger">Permanently delete</Button>
          </form>
        </details>
      </Card>
    </Container>
  );
}
