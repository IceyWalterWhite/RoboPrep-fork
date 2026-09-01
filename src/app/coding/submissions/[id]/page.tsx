import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JUDGE_STATUS_LABELS } from "@/lib/coding/constants";
import { formatMemory, formatRuntime } from "@/lib/coding/helpers";
import { getSubmissionById } from "@/lib/coding/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getSubmissionById(id);
  return { title: result?.submission.problemTitle ? `Submission · ${result.submission.problemTitle}` : "Submission" };
}

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSubmissionById(id);
  if (!result) notFound();
  const submission = result.submission;

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ label: "Coding", href: "/coding" }, { label: submission.problemTitle ?? "Problem", href: submission.problemSlug ? `/coding/${submission.problemSlug}` : "/coding" }, { label: "Submission" }]} />
      <header className="mt-7 border-b border-line-subtle pb-8">
        <p className="text-ink-tertiary text-sm">{submission.problemTitle ?? "Coding submission"}</p>
        <h1 className="text-title text-ink mt-2 font-semibold tracking-[-0.02em]">{JUDGE_STATUS_LABELS[submission.status]}</h1>
        <div className="text-ink-secondary mt-3 flex flex-wrap gap-4 text-sm">
          <span>{submission.score ?? 0}% score</span>
          {formatRuntime(submission.runtimeMs) ? <span>{formatRuntime(submission.runtimeMs)}</span> : null}
          {formatMemory(submission.memoryKb) ? <span>{formatMemory(submission.memoryKb)}</span> : null}
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-start">
        <Card>
          <CardHeader><CardTitle>Submitted code</CardTitle></CardHeader>
          <CardContent className="p-0">
            <pre className="bg-surface-sunken text-ink-secondary max-h-[38rem] overflow-auto px-5 py-4 font-mono text-xs leading-6 whitespace-pre-wrap">{submission.sourceCode || "(source not available)"}</pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Test results</CardTitle></CardHeader>
          <CardContent>
            {result.cases.length === 0 ? <p className="text-ink-secondary text-sm">No per-case details were saved.</p> : (
              <ul className="border-line-subtle divide-line-subtle divide-y rounded-sm border">
                {result.cases.map((item, index) => (
                  <li key={item.id ?? index} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
                    <span className="text-ink">{item.name ?? `Test ${index + 1}`}</span>
                    <span className="text-ink-secondary">{JUDGE_STATUS_LABELS[item.status]}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={submission.problemSlug ? `/coding/${submission.problemSlug}` : "/coding"} className="text-accent hover:text-accent-hover mt-5 inline-flex text-sm font-medium">Back to problem</Link>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
