import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ExampleCases } from "@/components/coding/example-cases";
import { CodingWorkspace } from "@/components/coding/coding-workspace";
import { EvaluationMetadata } from "@/components/coding/evaluation-metadata";
import { ProblemStatement } from "@/components/coding/problem-statement";
import { SubmissionHistory } from "@/components/coding/submission-history";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import type { CodingProblemDetail } from "@/types/coding";
import { CODING_DIFFICULTY_LABELS } from "@/lib/coding/constants";
import { getCodingProblemBySlug, getUserSubmissions } from "@/lib/coding/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getCodingProblemBySlug(slug);
  return problem
    ? { title: problem.title, description: problem.description.slice(0, 160) }
    : { title: "Coding problem" };
}

export default async function CodingProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await getCodingProblemBySlug(slug);
  if (!problem) notFound();
  const submissions = await getUserSubmissions(problem.id, 10);

  return (
    <Container className="py-10">
      <Breadcrumbs
        items={[{ label: "Coding", href: "/coding" }, { label: problem.title }]}
      />
      <header className="border-line-subtle mt-7 border-b pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="difficulty" tone={problem.difficulty}>
            {CODING_DIFFICULTY_LABELS[problem.difficulty]}
          </Badge>
          {problem.category ? (
            <Badge variant="default">{formatLabel(problem.category)}</Badge>
          ) : null}
          {problem.topics.slice(0, 4).map((topic) => (
            <Link
              key={topic.slug}
              href={`/knowledge?topic=${encodeURIComponent(topic.slug)}`}
            >
              <Badge variant="topic" className="hover:underline">
                {topic.name}
              </Badge>
            </Link>
          ))}
        </div>
        <h1 className="text-title text-ink mt-4 font-semibold tracking-[-0.02em]">
          {problem.title}
        </h1>
        <p className="text-ink-secondary mt-3 max-w-3xl text-[0.9375rem] leading-relaxed">
          {problemHeadline(problem)}
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          <ProblemStatement problem={problem} />
          <EvaluationMetadata evaluation={problem.evaluation} />
          <ExampleCases examples={problem.examples} />
          <Link
            href="/coding"
            className="text-ink-secondary hover:text-ink inline-flex items-center gap-1 text-sm font-medium"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Back to all problems
          </Link>
        </div>
        <div className="flex flex-col gap-6 lg:sticky lg:top-20">
          <CodingWorkspace
            slug={problem.slug}
            starterCode={problem.starterCode}
            evaluation={problem.evaluation}
          />
          <SubmissionHistory submissions={submissions} />
        </div>
      </div>
    </Container>
  );
}

/** Entrypoint-aware headline for function/class problems (Week 5 Task 20). */
function problemHeadline(problem: CodingProblemDetail): string {
  if (problem.evaluation.evaluationMode === "class" && problem.evaluation.entrypointName) {
    return `Implement the ${problem.evaluation.entrypointName} class with the signature in the starter code.`;
  }
  if (problem.evaluation.entrypointName) {
    return `Implement ${problem.evaluation.entrypointName}() as described below.`;
  }
  if (problem.functionName) {
    return `Implement ${problem.functionName} using the input/output format below.`;
  }
  return "Write a Python program that follows the input/output format below.";
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
