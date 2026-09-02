import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "重置密码 — RoboPrep",
  robots: { index: false, follow: false },
};

/** Week 8 Task 42: forgot-password entry. */
export default function ForgotPasswordPage() {
  return (
    <Container className="py-14">
      <div className="mx-auto max-w-md">
        <PageHeader
          title="忘记密码"
          description="我们会向你的邮箱发送安全的重置链接。"
        />
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </Container>
  );
}
