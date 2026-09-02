"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

/** Week 8 Task 42: set a new password for the signed-in reset session. */
export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("密码至少需要 8 个字符。");
      return;
    }
    if (password !== confirm) {
      setError("两次输入的密码不一致。");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("重置链接可能已过期，请从登录页面重新请求链接。");
      setPending(false);
      return;
    }
    router.push("/");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-line-subtle bg-surface shadow-card rounded-md border p-6"
    >
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="password" className="text-ink mb-1 block text-sm font-medium">
            新密码
          </label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="text-ink mb-1 block text-sm font-medium">
            确认密码
          </label>
          <Input
            id="confirm"
            type="password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-danger mt-3 text-sm">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="mt-4 w-full">
        {pending ? "保存中…" : "保存新密码"}
      </Button>
      <Link
        href="/forgot-password"
        className="text-ink-tertiary mt-4 block text-center text-xs"
      >
        重新请求重置链接
      </Link>
    </form>
  );
}
