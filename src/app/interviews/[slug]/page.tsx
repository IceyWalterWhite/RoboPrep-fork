import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { InterviewHeader } from "@/components/interviews/interview-header";
import { InterviewOverview } from "@/components/interviews/interview-overview";
import { InterviewRound } from "@/components/interviews/interview-round";
import { InterviewSource } from "@/components/interviews/interview-source";
import { InterviewTopics } from "@/components/interviews/interview-topics";
import { RelatedInterviews } from "@/components/interviews/related-interviews";
import { displaySeason } from "@/lib/interviews/helpers";
import { getInterviewBySlug, getRelatedInterviews } from "@/lib/interviews/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const interview = await getInterviewBySlug(slug);
  if (!interview) return { title: "未找到面试" };
  const period = `${interview.year}${displaySeason(interview.season) ? ` ${displaySeason(interview.season)}` : ""}`;
  return {
    title: `${interview.company?.name ?? "具身智能"} ${interview.position?.title ?? "面试"} — ${period}`,
    description: interview.summary ?? "RoboPrep 上的结构化具身智能面试经历。",
    alternates: { canonical: `/interviews/${interview.slug}` },
  };
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const interview = await getInterviewBySlug(slug);
  if (!interview) notFound();
  const related = await getRelatedInterviews(interview.id);
  const period = `${interview.year}${displaySeason(interview.season) ? ` ${displaySeason(interview.season)}` : ""}`;

  return (
    <Container width="wide" className="py-10 sm:py-14">
      <Breadcrumbs
        items={[
          { label: "面试", href: "/interviews" },
          { label: interview.company?.name ?? "面试" },
          { label: `${interview.position?.title ?? interview.title} — ${period}` },
        ]}
      />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,800px)_280px] lg:justify-center lg:gap-14">
        <main className="min-w-0">
          <InterviewHeader interview={interview} />
          <div className="mt-8 flex flex-col gap-10">
            <InterviewOverview interview={interview} />
            <section aria-labelledby="rounds-heading" className="flex flex-col gap-8">
              <h2 id="rounds-heading" className="sr-only">
                面试轮次
              </h2>
              {interview.rounds.map((round) => (
                <InterviewRound
                  key={`${round.id ?? "generated"}-${round.roundNumber}`}
                  round={round}
                />
              ))}
            </section>
            <InterviewTopics topics={interview.topics} />
            <RelatedInterviews interviews={related} />
          </div>
        </main>
        <aside className="min-w-0 lg:pt-1">
          <div className="lg:sticky lg:top-20">
            <InterviewSource source={interview.source} />
          </div>
        </aside>
      </div>
    </Container>
  );
}
