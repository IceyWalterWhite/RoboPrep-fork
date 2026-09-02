"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SEASONS = [
  { value: "spring", label: "春季" },
  { value: "summer", label: "夏季" },
  { value: "fall", label: "秋季" },
  { value: "winter", label: "冬季" },
] as const;

const MAX_CHARS = 50_000;
const MIN_CHARS = 50;

/**
 * User-facing submission form (Tasks 9, 10): low-friction, only the interview
 * experience is required. The copy makes clear that nothing is auto-published.
 */
export function SubmissionForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      companyHint: (form.get("companyHint") as string) || "",
      positionHint: (form.get("positionHint") as string) || "",
      yearHint: form.get("yearHint") ? Number(form.get("yearHint")) : undefined,
      seasonHint: (form.get("seasonHint") as string) || undefined,
      locationHint: (form.get("locationHint") as string) || "",
      rawText: form.get("rawText") as string,
      sourceUrl: (form.get("sourceUrl") as string) || "",
      language: "zh-CN",
    };

    try {
      const response = await fetch("/api/interviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !body.id) {
        setError(body.error ?? "出了点问题，请稍后再试。");
        setSubmitting(false);
        return;
      }
      router.push(`/interviews/submissions/${body.id}`);
    } catch {
      setError("网络错误，请检查连接后重试。");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-line-subtle bg-surface shadow-card mt-8 max-w-2xl rounded-md border p-6 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="公司" htmlFor="companyHint" hint="可选">
          <Input
            id="companyHint"
            name="companyHint"
            placeholder="例如：字节跳动"
            maxLength={120}
          />
        </Field>
        <Field label="岗位" htmlFor="positionHint" hint="可选">
          <Input
            id="positionHint"
            name="positionHint"
            placeholder="例如：具身智能算法实习生"
            maxLength={120}
          />
        </Field>
        <Field label="年份" htmlFor="yearHint" hint="可选">
          <Input
            id="yearHint"
            name="yearHint"
            type="number"
            min={1990}
            max={2100}
            placeholder="2026"
          />
        </Field>
        <Field label="季节" htmlFor="seasonHint" hint="可选">
          <select
            id="seasonHint"
            name="seasonHint"
            className="bg-surface text-ink border-line focus:outline-accent h-10 w-full rounded-sm border px-3 text-sm focus:outline-2 focus:outline-offset-0"
            defaultValue=""
          >
            <option value="">—</option>
            {SEASONS.map((season) => (
              <option key={season.value} value={season.value}>
                {season.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="地点" htmlFor="locationHint" hint="可选">
          <Input
            id="locationHint"
            name="locationHint"
            placeholder="例如：北京"
            maxLength={120}
          />
        </Field>
      </div>

      <div className="mt-6">
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="rawText" className="text-ink text-sm font-medium">
            面试经历 <span className="text-danger">*</span>
          </label>
          <span className="text-ink-tertiary text-xs tabular-nums">
            {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
        <Textarea
          id="rawText"
          name="rawText"
          required
          rows={12}
          maxLength={MAX_CHARS}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            "描述这次面试：公司、轮次、每轮被问了什么问题，以及你记得的其他背景……"
          }
          className="min-h-56"
        />
        <p className="text-ink-tertiary mt-1.5 text-xs">
          {MIN_CHARS}–{MAX_CHARS.toLocaleString()}{" "}
          个字符。请勿在内容中填写个人联系方式（邮箱、电话、微信）。
        </p>
      </div>

      <div className="mt-4">
        <Field label="来源 URL" htmlFor="sourceUrl" hint="可选，仅支持 http(s)">
          <Input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://…" />
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-danger mt-4 text-sm">
          {error}
        </p>
      )}

      <div className="border-line-subtle mt-6 border-t pt-5">
        <Button type="submit" disabled={submitting || text.trim().length < MIN_CHARS}>
          {submitting ? "提交中…" : "提交审核"}
        </Button>
        <p className="text-ink-tertiary mt-2 text-xs">
          提交即表示你确认这是自己的经历（或已正确注明出处的公开来源），并理解：内容会经过
          <strong>人工审核</strong>、整理为问题；审核通过后才会<strong>匿名发布</strong>
          ，不会即时或自动发布，也不会展示你的身份。你可以随时查看投稿状态。
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-ink text-sm font-medium">
          {label}
        </label>
        {hint && <span className="text-ink-tertiary text-xs">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
