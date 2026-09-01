import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — RoboPrep",
  robots: { index: false, follow: false },
};

/** Week 8 Task 42: forgot-password entry. */
export default function ForgotPasswordPage() {
  return (
    <Container className="py-14">
      <div className="mx-auto max-w-md">
        <PageHeader title="Forgot password" description="We will email you a secure reset link." />
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </Container>
  );
}
