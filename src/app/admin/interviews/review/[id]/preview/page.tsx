import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { InterviewHeader } from "@/components/interviews/interview-header";
import { InterviewOverview } from "@/components/interviews/interview-overview";
import { InterviewRound } from "@/components/interviews/interview-round";
import { InterviewSource } from "@/components/interviews/interview-source";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getDraftBySubmission,
  getSubmission,
  listQuestionDrafts,
  listRoundDrafts,
} from "@/lib/ingestion/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InterviewDetail } from "@/types/interview";
import type { InterviewQuestionDraft, InterviewRoundDraft } from "@/types/ingestion";

export const metadata: Metadata = {
  title: "发布预览",
  robots: { index: false, follow: false },
};

/**
 * Publication preview (Task 76): renders the draft through the production
 * interview components with a draft data adapter. noindex metadata keeps the
 * preview out of search; no separate styling implementation.
 */
export default async function PublicationPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) notFound();

  const submission = await getSubmission(admin, id).catch(() => null);
  const draft = await getDraftBySubmission(admin, id).catch(() => null);
  if (!submission || !draft) notFound();

  const [rounds, questions] = await Promise.all([
    listRoundDrafts(admin, draft.id),
    listQuestionDrafts(admin, draft.id),
  ]);

  const preview = buildPreview({
    submissionId: id,
    draft,
    rounds,
    questions,
    positionHint: submission.positionHint,
    sourceUrl: submission.sourceUrl,
  });

  return (
    <Container width="wide" className="py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="status" tone="review">
            发布预览
          </Badge>
          <span className="text-ink-tertiary text-sm">这是面经发布后的展示效果。</span>
        </div>
        <Link href={`/admin/interviews/review/${id}`}>
          <Button variant="secondary" size="sm">
            ← 返回审核
          </Button>
        </Link>
      </div>

      <Card className="p-6 sm:p-10">
        <InterviewHeader interview={preview} />
        <div className="mt-8 flex flex-col gap-10">
          <InterviewOverview interview={preview} />
          <section aria-labelledby="rounds-heading" className="flex flex-col gap-8">
            <h2 id="rounds-heading" className="sr-only">
              面试轮次
            </h2>
            {preview.rounds.map((round) => (
              <InterviewRound
                key={`${round.id ?? "generated"}-${round.roundNumber}`}
                round={round}
              />
            ))}
          </section>
        </div>
      </Card>

      <aside className="mt-6 max-w-xs">
        <InterviewSource source={preview.source} />
      </aside>
    </Container>
  );
}

function buildPreview(input: {
  submissionId: string;
  draft: Awaited<ReturnType<typeof getDraftBySubmission>>;
  rounds: InterviewRoundDraft[];
  questions: InterviewQuestionDraft[];
  positionHint: string | null;
  sourceUrl: string | null;
}): InterviewDetail {
  const { submissionId, draft, rounds, questions, positionHint, sourceUrl } = input;
  if (!draft) throw new Error("缺少解析草稿");

  const questionsByRound = new Map<string, InterviewQuestionDraft[]>();
  for (const question of questions) {
    if (!question.roundDraftId) continue;
    const list = questionsByRound.get(question.roundDraftId) ?? [];
    list.push(question);
    questionsByRound.set(question.roundDraftId, list);
  }

  return {
    id: `preview-${submissionId}`,
    slug: "",
    title: positionHint ?? draft.positionTitle ?? "面试经历",
    company: draft.companyName
      ? { id: "preview-company", name: draft.companyName, slug: "" }
      : null,
    position: draft.positionTitle
      ? { id: "preview-position", title: draft.positionTitle, slug: "", category: null }
      : null,
    year: draft.year ?? new Date().getFullYear(),
    season: draft.season,
    location: draft.location,
    interviewType: draft.interviewType,
    experienceLevel: draft.experienceLevel,
    employmentType: draft.employmentType,
    applicationStage: "mixed",
    difficulty: "unknown",
    durationMinutes: null,
    summary: draft.summary,
    language: "zh-CN",
    isAnonymous: true,
    qualityScore: null,
    publishedAt: null,
    updatedAt: draft.updatedAt,
    source: {
      type: "community",
      label: "社区投稿（预览）",
      url: sourceUrl,
      verification: "unverified",
      verifiedAt: null,
    },
    tags: [],
    stats: {
      roundCount: rounds.length,
      questionCount: questions.length,
      linkedQuestionCount: questions.filter((question) => question.candidateQuestionId)
        .length,
      codingQuestionCount: questions.filter(
        (question) => question.questionType === "coding",
      ).length,
      topicCount: 0,
    },
    rounds: rounds.map((round) => ({
      id: round.id,
      roundNumber: round.roundNumber ?? round.orderIndex + 1,
      title: round.title ?? `第 ${round.orderIndex + 1} 轮`,
      roundType: round.roundType,
      durationMinutes: round.durationMinutes,
      interviewerRole: round.interviewerRole,
      summary: round.summary,
      questions: (questionsByRound.get(round.id) ?? []).map((question) => ({
        id: question.id,
        questionId: question.candidateQuestionId,
        roundId: round.id,
        roundNumber: round.roundNumber ?? round.orderIndex + 1,
        orderIndex: question.orderIndex,
        originalWording: question.originalWording,
        canonicalQuestion: null,
        notes: null,
        questionContext: null,
        answerSummary: null,
        difficulty: question.difficulty === "unknown" ? null : question.difficulty,
      })),
    })),
    topics: [],
  };
}
