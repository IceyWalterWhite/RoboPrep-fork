import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleDot, ChevronLeft } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { CODING_DIFFICULTY_LABELS } from "@/lib/coding/constants";
import { getCodingCollectionBySlug } from "@/lib/coding/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCodingCollectionBySlug(slug);
  return collection
    ? { title: collection.name, description: collection.description ?? undefined }
    : { title: "Coding collection" };
}

export default async function CodingCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCodingCollectionBySlug(slug);
  if (!collection) notFound();

  const solved = collection.problems.filter((problem) => problem.userStatus === "solved").length;
  const attempted = collection.problems.filter((problem) => problem.userStatus === "attempted").length;

  return (
    <Container className="py-10">
      <Breadcrumbs
        items={[
          { label: "Coding", href: "/coding" },
          { label: "Collections", href: "/coding/collections" },
          { label: collection.name },
        ]}
      />

      <header className="border-line-subtle mt-7 border-b pb-8">
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">{collection.name}</h1>
        {collection.description ? (
          <p className="text-ink-secondary mt-3 max-w-2xl text-[0.9375rem] leading-relaxed">
            {collection.description}
          </p>
        ) : null}
        <p className="text-ink-tertiary mt-4 text-sm">
          {collection.problemCount} problems · {solved} solved
          {attempted > 0 ? ` · ${attempted} attempted` : ""}
        </p>
      </header>

      <ol className="mt-6 flex flex-col divide-y divide-[var(--color-line-subtle)]">
        {collection.problems.map((problem, index) => (
          <li key={problem.id}>
            <Link
              href={`/coding/${problem.slug}`}
              className="group flex items-center gap-4 px-2 py-4 hover:bg-[var(--color-surface-hover)]"
            >
              <span className="text-ink-tertiary w-6 shrink-0 text-center text-sm tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate font-medium group-hover:underline">
                  {problem.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="difficulty" tone={problem.difficulty}>
                    {CODING_DIFFICULTY_LABELS[problem.difficulty]}
                  </Badge>
                  {problem.evaluationMode !== "program" ? (
                    <span className="text-ink-tertiary text-xs">
                      {formatMode(problem.evaluationMode)}
                      {problem.framework ? ` · ${formatLabel(problem.framework)}` : ""}
                    </span>
                  ) : null}
                </div>
              </div>
              {problem.userStatus === "solved" ? (
                <span className="text-success-ink inline-flex items-center gap-1 text-sm">
                  <CheckCircle2 className="size-4" aria-hidden /> Solved
                </span>
              ) : problem.userStatus === "attempted" ? (
                <span className="text-warning-ink inline-flex items-center gap-1 text-sm">
                  <CircleDot className="size-4" aria-hidden /> Attempted
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href="/coding/collections"
        className="text-ink-secondary hover:text-ink mt-6 inline-flex items-center gap-1 text-sm font-medium"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to all collections
      </Link>
    </Container>
  );
}

function formatMode(mode: string): string {
  return mode === "class" ? "Class" : "Function";
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
