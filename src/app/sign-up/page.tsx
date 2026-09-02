import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "创建账户",
  description: "创建 RoboPrep 账户，记录你的面试练习进度。",
};

export default async function SignUpPage({
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
          创建你的账户
        </h1>
        <p className="text-ink-secondary text-sm leading-relaxed">
          真实面试经历、核心知识与 Coding 练习。
        </p>
      </div>

      <div className="border-line-subtle bg-surface shadow-card rounded-lg border p-6 sm:p-8">
        <SignUpForm nextUrl={nextUrl} />
      </div>
    </div>
  );
}
