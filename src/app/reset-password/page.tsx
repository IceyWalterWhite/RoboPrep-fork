import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "设置新密码 — RoboPrep",
  robots: { index: false, follow: false },
};

/** Week 8 Task 42: set a new password after following the email link. */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/reset-password");

  return (
    <Container className="py-14">
      <div className="mx-auto max-w-md">
        <PageHeader
          title="设置新密码"
          description="请设置一个未在其他地方使用过的密码。"
        />
        <div className="mt-8">
          <ResetPasswordForm />
        </div>
      </div>
    </Container>
  );
}
