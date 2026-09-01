import Link from "next/link";
import { ArrowRight, BookOpen, Code2, MessagesSquare } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getPublishedInterviews,
  getRecentQuestions,
  getTopics,
} from "@/lib/data/queries";

const pillars = [
  {
    href: "/interviews",
    icon: MessagesSquare,
    title: "Real Interviews",
    description:
      "Interview experiences organised by company, position and year — including the exact wording candidates were asked.",
  },
  {
    href: "/knowledge",
    icon: BookOpen,
    title: "Knowledge",
    description:
      "Canonical questions for Embodied AI, each with a quick answer, a deep dive and the follow-ups interviewers reach for.",
  },
  {
    href: "/coding",
    icon: Code2,
    title: "Coding",
    description:
      "Robotics and ML exercises with real constraints — kinematics, control loops, batching and inference budgets.",
  },
];

export default async function HomePage() {
  const [interviews, topics, questions] = await Promise.all([
    getPublishedInterviews(3),
    getTopics(),
    getRecentQuestions(4),
  ]);

  const rootTopics = topics.filter((topic) => topic.parent_id === null);

  return (
    <>
      {/* Hero */}
      <section className="border-line-subtle bg-surface border-b">
        <Container className="flex flex-col items-center gap-6 py-24 text-center sm:py-32">
          <p className="text-accent text-[0.9375rem] font-semibold tracking-[-0.01em]">
            RoboPrep
          </p>
          <h1 className="text-display text-ink max-w-3xl font-semibold">
            Master Embodied AI.
            <br />
            One question at a time.
          </h1>
          <p className="text-ink-secondary max-w-xl text-[1.0625rem] leading-relaxed">
            Real interview experiences, essential knowledge, and hands-on coding for
            Embodied AI roles.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href="/knowledge" className={buttonVariants({ size: "lg" })}>
              Start Practicing
            </Link>
            <Link
              href="/interviews"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Explore Interviews
            </Link>
          </div>
        </Container>
      </section>

      {/* Product pillars */}
      <section>
        <Container className="grid gap-5 py-20 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.href} className="hover:shadow-raised transition-shadow">
              <CardHeader>
                <span className="bg-accent-soft text-accent mb-2 flex size-9 items-center justify-center rounded-sm">
                  <pillar.icon className="size-5" aria-hidden />
                </span>
                <CardTitle>{pillar.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-ink-secondary text-sm leading-relaxed">
                  {pillar.description}
                </p>
                <Link
                  href={pillar.href}
                  className="text-accent inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  Open {pillar.title}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          ))}
        </Container>
      </section>

      {/* Latest interviews */}
      <section className="border-line-subtle border-t">
        <Container className="py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-title text-ink font-semibold tracking-[-0.02em]">
                Latest interviews
              </h2>
              <p className="text-ink-secondary text-sm">
                Recently published candidate reports.
              </p>
            </div>
            <Link
              href="/interviews"
              className="text-accent shrink-0 text-sm font-medium hover:underline"
            >
              View all
            </Link>
          </div>

          {interviews.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="No interviews published yet"
              description="Interview experiences appear here once they are reviewed and published."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-3">
              {interviews.map((interview) => (
                <li key={interview.id}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="text-ink-tertiary flex items-center gap-2 text-xs">
                        <span>{interview.companyName ?? "Unknown company"}</span>
                        <span aria-hidden>·</span>
                        <span>{interview.year}</span>
                      </div>
                      <CardTitle>
                        {interview.interview_type ?? "Interview"}
                        {interview.location ? ` · ${interview.location}` : ""}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {interview.season ? (
                          <Badge variant="default">{interview.season}</Badge>
                        ) : null}
                        <Badge variant="status" tone="published">
                          Published
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {/* Knowledge categories */}
      <section className="border-line-subtle bg-surface border-t">
        <Container className="py-20">
          <div className="mb-8 flex flex-col gap-1">
            <h2 className="text-title text-ink font-semibold tracking-[-0.02em]">
              Knowledge categories
            </h2>
            <p className="text-ink-secondary text-sm">
              Start from a topic and work through its questions.
            </p>
          </div>

          {rootTopics.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No topics yet"
              description="Topics are created together with the knowledge questions they group."
            />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {rootTopics.map((topic) => (
                <li key={topic.id}>
                  <Link href="/knowledge">
                    <Badge
                      variant="topic"
                      className="hover:bg-accent/15 px-3 py-1.5 text-sm transition-colors"
                    >
                      {topic.name}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {questions.length > 0 ? (
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {questions.map((question) => (
                <li key={question.id}>
                  <Link
                    href="/knowledge"
                    className="text-ink hover:text-accent block rounded-sm px-1 py-2 text-sm transition-colors"
                  >
                    {question.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </Container>
      </section>

      {/* Coding preview */}
      <section className="border-line-subtle border-t">
        <Container className="py-20">
          <div className="max-w-2xl">
            <p className="text-ink-tertiary text-xs font-semibold tracking-wide uppercase">
              Coming next
            </p>
            <h2 className="text-title text-ink mt-2 font-semibold tracking-[-0.02em]">
              Coding
            </h2>
            <p className="text-ink-secondary mt-3 text-[0.9375rem] leading-relaxed">
              LeetCode-style exercises built around real robotics and ML constraints:
              SE(3) transforms, batched control loops, action chunking buffers and
              inference latency budgets.
            </p>
            <Link
              href="/coding"
              className={`mt-6 ${buttonVariants({ variant: "secondary" })}`}
            >
              See the coding roadmap
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
