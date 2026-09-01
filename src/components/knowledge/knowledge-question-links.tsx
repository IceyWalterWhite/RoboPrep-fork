import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { KnowledgeQuestionSummary, QuestionRelationGroup } from "@/types/knowledge";

export function KnowledgeQuestionLinks({
  groups,
  followUps,
}: {
  groups: QuestionRelationGroup[];
  followUps: KnowledgeQuestionSummary[];
}) {
  const sections = [...groups, ...(followUps.length > 0 ? [{ relationType: "follow_up" as const, questions: followUps }] : [])];
  if (sections.length === 0) return null;
  return <div className="flex flex-col gap-8">{sections.map((group) => <section key={group.relationType} aria-labelledby={`relation-${group.relationType}`}><h2 id={`relation-${group.relationType}`} className="text-ink mb-3 text-lg font-semibold">{relationLabel(group.relationType)}</h2><ul className="grid gap-3 sm:grid-cols-2">{group.questions.map((question) => <li key={question.id}><Link href={`/knowledge/${question.slug}`} className="border-line-subtle bg-surface hover:border-line flex h-full flex-col gap-2 rounded-md border p-4 transition-colors"><div className="flex flex-wrap gap-2">{question.difficulty ? <Badge variant="difficulty" tone={question.difficulty}>{question.difficulty}</Badge> : null}{question.topics.slice(0, 2).map((topic) => <Badge key={topic.slug} variant="topic">{topic.name}</Badge>)}</div><h3 className="text-ink text-sm leading-snug font-medium">{question.title}</h3>{question.summary ? <p className="text-ink-secondary line-clamp-2 text-sm leading-relaxed">{question.summary}</p> : null}</Link></li>)}</ul></section>)}</div>;
}

function relationLabel(type: string): string {
  return { prerequisite: "Prerequisites", related: "Related questions", contrast: "Compare with", follow_up: "Interviewer may continue asking" }[type] ?? "Related questions";
}
