import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { InterviewOccurrences } from "@/components/knowledge/interview-occurrences";
import { KnowledgeQuestionLinks } from "@/components/knowledge/knowledge-question-links";
import { Badge } from "@/components/ui/badge";
import { getFollowUpQuestions, getKnowledgeQuestionBySlug, getQuestionOccurrences, getRelatedQuestions } from "@/lib/knowledge/queries";
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from "@/lib/knowledge/constants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const question = await getKnowledgeQuestionBySlug(slug);
  if (!question) return { title: "Knowledge question not found" };
  return { title: question.title, description: question.summary ?? "An Embodied AI interview knowledge question on RoboPrep." };
}

export default async function KnowledgeQuestionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const question = await getKnowledgeQuestionBySlug(slug);
  if (!question) notFound();
  const [occurrences, relations, followUps] = await Promise.all([
    getQuestionOccurrences(question.id),
    getRelatedQuestions(question.id),
    getFollowUpQuestions(question.id),
  ]);
  return (
    <Container width="reading" className="py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Knowledge", href: "/knowledge" }, ...question.topics.slice(0, 1).map((topic) => ({ label: topic.name, href: `/knowledge?topic=${encodeURIComponent(topic.slug)}` })), { label: question.title }]} />
      <article className="mt-8 flex flex-col gap-10">
        <header className="border-line-subtle flex flex-col gap-4 border-b pb-8">
          <div className="flex flex-wrap gap-2"><Badge variant="default">{QUESTION_TYPE_LABELS[question.questionType]}</Badge>{question.difficulty ? <Badge variant="difficulty" tone={question.difficulty}>{DIFFICULTY_LABELS[question.difficulty]}</Badge> : null}{question.stats?.interviewCount ? <Badge variant="default">{question.stats.interviewCount} interviews</Badge> : null}</div>
          <h1 className="text-ink text-3xl leading-tight font-semibold tracking-[-0.025em] sm:text-4xl">{question.title}</h1>
          {question.summary ? <p className="text-ink-secondary max-w-2xl text-base leading-relaxed">{question.summary}</p> : null}
          <ul className="flex flex-wrap gap-2">{question.topics.map((topic) => <li key={topic.slug}><Link href={`/knowledge?topic=${encodeURIComponent(topic.slug)}`}><Badge variant="topic" className="hover:underline">{topic.name}</Badge></Link></li>)}</ul>
        </header>
        {question.shortAnswer ? <AnswerSection id="short-answer" title="Short answer" content={question.shortAnswer} /> : null}
        {question.canonicalAnswer ? <AnswerSection id="canonical-answer" title="Canonical answer" content={question.canonicalAnswer} /> : null}
        {question.deepAnswer ? <AnswerSection id="deep-answer" title="Deep dive" content={question.deepAnswer} /> : null}
        {question.keyPoints.length > 0 ? <ListSection id="key-points" title="Key points" items={question.keyPoints} /> : null}
        {question.commonMistakes.length > 0 ? <ListSection id="common-mistakes" title="Common mistakes" items={question.commonMistakes} /> : null}
        <InterviewOccurrences occurrences={occurrences} />
        <KnowledgeQuestionLinks groups={relations} followUps={followUps} />
      </article>
    </Container>
  );
}

function AnswerSection({ id, title, content }: { id: string; title: string; content: string }) {
  return <section aria-labelledby={id} className="flex flex-col gap-3"><h2 id={id} className="text-ink text-xl font-semibold tracking-[-0.015em]">{title}</h2><div className="text-ink-secondary flex flex-col gap-4 text-[0.9375rem] leading-7">{content.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>;
}

function ListSection({ id, title, items }: { id: string; title: string; items: string[] }) {
  return <section aria-labelledby={id} className="flex flex-col gap-3"><h2 id={id} className="text-ink text-xl font-semibold tracking-[-0.015em]">{title}</h2><ul className="text-ink-secondary flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] leading-7">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}
