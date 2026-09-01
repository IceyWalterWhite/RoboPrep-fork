import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your RoboPrep account.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextUrl = safeInternalPath(next);

  const user = await getCurrentUser();
  if (user) redirect(nextUrl);

  return (
    <div className="mx-auto flex w-full max-w-[26rem] flex-col gap-6 py-16 sm:py-24">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">
          Sign in
        </h1>
        <p className="text-ink-secondary text-sm leading-relaxed">
          Continue practicing for Embodied AI interviews.
        </p>
      </div>

      <div className="border-line-subtle bg-surface shadow-card rounded-lg border p-6 sm:p-8">
        <SignInForm nextUrl={nextUrl} />
      </div>
    </div>
  );
}
