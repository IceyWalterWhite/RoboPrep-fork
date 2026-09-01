"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";

/** Week 8 Task 42: request a password-reset email. */
export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });
    // Always show the sent state — never reveal whether the account exists.
    setSent(true);
    setPending(false);
  }

  if (sent) {
    return (
      <div className="border-line-subtle bg-surface shadow-card rounded-md border p-6">
        <p className="text-ink font-medium">Check your email</p>
        <p className="text-ink-secondary mt-1 text-sm leading-relaxed">
          If an account exists for {email}, a reset link is on its way. The link expires shortly.
        </p>
        <Link href="/sign-in" className="text-accent hover:text-accent-hover mt-4 inline-block text-sm font-medium">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-line-subtle bg-surface shadow-card rounded-md border p-6">
      <div>
        <label htmlFor="email" className="text-ink mb-1 block text-sm font-medium">Email</label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </div>
      <Button type="submit" disabled={pending} className="mt-4 w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
