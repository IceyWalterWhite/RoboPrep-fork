"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
  { value: "bug", label: "功能出现问题" },
  { value: "content_error", label: "内容错误或不准确" },
  { value: "feature", label: "功能建议" },
  { value: "other", label: "其他" },
] as const;

/** Week 8 Task 116: lightweight feedback form. */
export function FeedbackForm() {
  const router = useRouter();
  const [category, setCategory] = React.useState<string>("bug");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        setError(body.error ?? "出了点问题，请稍后再试。");
        setSubmitting(false);
        return;
      }
      router.push("/?feedback=thanks");
    } catch {
      setError("网络错误，请稍后再试。");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-line-subtle bg-surface shadow-card max-w-xl rounded-md border p-6"
    >
      <fieldset>
        <legend className="text-ink text-sm font-medium">反馈主题</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => setCategory(entry.value)}
              aria-pressed={category === entry.value}
              className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                category === entry.value
                  ? "bg-accent text-white"
                  : "border-line bg-surface text-ink-secondary hover:text-ink border"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor="feedback-message" className="text-ink text-sm font-medium">
          消息内容
        </label>
        <Textarea
          id="feedback-message"
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          minLength={10}
          maxLength={5000}
          required
          className="mt-1.5"
          placeholder="请告诉我们发生了什么，或你希望看到什么改进。请勿填写个人联系方式。"
        />
        <p className="text-ink-tertiary mt-1 text-xs">{message.length}/5000</p>
      </div>

      {error && (
        <p role="alert" className="text-danger mt-3 text-sm">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting || message.trim().length < 10}
        className="mt-4"
      >
        {submitting ? "发送中…" : "发送反馈"}
      </Button>
    </form>
  );
}
