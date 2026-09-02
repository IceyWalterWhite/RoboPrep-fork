import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { matchBand } from "@/lib/ingestion/confidence";
import {
  getCanonicalCandidates,
  getCanonicalizationMetrics,
  detectDuplicatesForDraft,
} from "@/lib/ingestion/service";
import {
  getDraftBySubmission,
  getReviewTask,
  getSubmission,
  listEvents,
  listJobsForSubmission,
  listQuestionDrafts,
  listRoundDrafts,
} from "@/lib/ingestion/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CanonicalMatchCandidate,
  InterviewQuestionDraft,
} from "@/types/ingestion";
import {
  displayIngestionEventType,
  displayIngestionErrorCode,
  displayIngestionMessage,
  displayModerationFlagType,
} from "@/lib/ingestion/display";

import {
  acceptMatchAction,
  approveAction,
  blockAction,
  createCanonicalAction,
  editDraftAction,
  editQuestionAction,
  editRoundAction,
  enqueueReparseAction,
  publishAction,
  rejectAction,
  rejectQuestionAction,
  returnToReviewAction,
  retryParseAction,
} from "../actions";

export const metadata: Metadata = {
  title: "审核投稿",
  robots: { index: false, follow: false },
};

const ROUND_TYPES = [
  "recruiter",
  "technical",
  "coding",
  "research",
  "manager",
  "behavioral",
  "mixed",
  "unknown",
];
const QUESTION_TYPES = [
  "knowledge",
  "coding",
  "system_design",
  "research",
  "behavioral",
];
const DIFFICULTIES = ["easy", "medium", "hard"];
const REJECTION_REASONS = [
  "spam",
  "duplicate",
  "insufficient_detail",
  "privacy_concern",
  "unverifiable",
  "off_topic",
  "other",
];

const ROUND_TYPE_LABELS: Record<string, string> = {
  recruiter: "招聘面",
  technical: "技术面",
  coding: "Coding",
  research: "研究面",
  manager: "Hiring manager 面",
  behavioral: "行为面",
  mixed: "综合面",
  unknown: "未知",
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  knowledge: "知识题",
  coding: "Coding",
  system_design: "系统设计",
  research: "研究题",
  behavioral: "行为题",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

const REJECTION_REASON_LABELS: Record<string, string> = {
  spam: "垃圾内容",
  duplicate: "重复投稿",
  insufficient_detail: "细节不足",
  privacy_concern: "隐私问题",
  unverifiable: "无法核实",
  off_topic: "与主题无关",
  other: "其他",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "已提交",
  processing: "处理中",
  parsed: "已解析",
  needs_review: "待审核",
  approved: "已批准",
  rejected: "已拒绝",
  failed: "失败",
  published: "已发布",
  open: "待处理",
  in_review: "审核中",
  completed: "已完成",
  queued: "排队中",
  running: "运行中",
  succeeded: "已完成",
  cancelled: "已取消",
  blocked: "已封禁",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  parse_interview: "解析面试",
  canonicalize_questions: "规范化问题",
  classify_topics: "分类主题",
  duplicate_check: "检查重复",
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  edited: "已编辑",
  accepted: "已接受",
  new_canonical: "已创建标准问题",
  rejected: "已拒绝",
};

function displayLabel(
  value: string | null | undefined,
  labels: Record<string, string>,
  fallback = "未知",
) {
  if (!value) return fallback;
  return labels[value] ?? fallback;
}

/**
 * Review detail (Task 32): raw and parsed data side by side, per-question
 * canonical decisions (Task 23), diff view (Task 57), and publish controls.
 * Everything is server-rendered with plain forms for accessibility.
 */
export default async function ReviewDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const admin = createAdminClient();
  if (!admin) notFound();

  const submission = await getSubmission(admin, id).catch(() => null);
  if (!submission) notFound();

  const task = await getReviewTask(admin, id);
  const jobs = await listJobsForSubmission(admin, id);
  const events = await listEvents(admin, id);

  // Draft must exist before children can be fetched.
  const loadedDraft = await getDraftBySubmission(admin, id);
  const loadedRounds = loadedDraft ? await listRoundDrafts(admin, loadedDraft.id) : [];
  const loadedQuestions = loadedDraft
    ? await listQuestionDrafts(admin, loadedDraft.id)
    : [];

  // Canonical candidates for pending questions (Tasks 21–23), computed on demand.
  const candidateMap = new Map<string, CanonicalMatchCandidate[]>();
  for (const question of loadedQuestions) {
    if (question.reviewStatus !== "pending" && question.reviewStatus !== "edited")
      continue;
    candidateMap.set(
      question.id,
      await getCanonicalCandidates(admin, question).catch(() => []),
    );
  }

  const duplicates = await detectDuplicatesForDraft(admin, id).catch(() => ({
    score: 0,
    candidates: [],
  }));
  const metrics = await getCanonicalizationMetrics(admin, id).catch(() => null);

  const { data: companies } = await admin
    .from("companies")
    .select("id, name")
    .order("name")
    .limit(500);

  return (
    <Container className="py-10">
      <nav className="text-ink-tertiary mb-4 text-sm">
        <Link href="/admin/interviews/review" className="hover:text-ink">
          审核队列
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{submission.companyHint ?? "投稿"}</span>
      </nav>

      {error && (
        <p
          role="alert"
          className="border-danger bg-danger/10 text-danger-ink mb-4 rounded-sm border px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">
            {submission.companyHint ?? loadedDraft?.companyName ?? "未知公司"} ·{" "}
            {submission.positionHint ?? loadedDraft?.positionTitle ?? "未知岗位"}
          </h1>
          <p className="text-ink-tertiary mt-1 text-sm">
            提交于 {new Date(submission.createdAt).toLocaleString()} · 状态：
            {displayLabel(submission.status, STATUS_LABELS)}
            {loadedDraft
              ? ` · 解析器 ${loadedDraft.parserVersion}（${loadedDraft.provider}/${loadedDraft.model}）`
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant="status"
            tone={
              submission.status === "published"
                ? "published"
                : submission.status === "rejected"
                  ? "rejected"
                  : undefined
            }
          >
            {displayLabel(submission.status, STATUS_LABELS)}
          </Badge>
          {task && (
            <Badge variant="status">
              任务：{displayLabel(task.status, STATUS_LABELS)}
            </Badge>
          )}
        </div>
      </header>

      {duplicates.candidates.length > 0 && (
        <Card className="border-warning mt-5 border p-4">
          <p className="text-ink text-sm font-semibold">
            可能重复（{Math.round(duplicates.score * 100)}%）
          </p>
          <ul className="text-ink-secondary mt-2 list-disc pl-5 text-sm">
            {duplicates.candidates.map((candidate) => (
              <li key={`${candidate.interviewId ?? candidate.submissionId}`}>
                {candidate.title ?? candidate.slug ?? candidate.submissionId} —{" "}
                {candidate.reasons.join("; ")}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Raw submission (immutable) */}
        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
            原始投稿（不可修改）
          </h2>
          <pre className="text-ink-secondary bg-surface-sunken mt-3 max-h-96 overflow-auto rounded-sm p-3 text-xs leading-relaxed whitespace-pre-wrap">
            {submission.rawText}
          </pre>
          {submission.moderationFlags.length > 0 && (
            <p className="text-warning-ink mt-3 text-xs">
              私有内容审核标记：
              {submission.moderationFlags
                .map((flag) => `${displayModerationFlagType(flag.type)}×${flag.count}`)
                .join("、")}
            </p>
          )}
        </Card>

        {/* Parsed metadata editor (Task 33) */}
        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
            解析后的元数据
          </h2>
          {loadedDraft ? (
            <form action={editDraftAction} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="submissionId" value={submission.id} />
              <LabeledInput
                label="公司"
                name="companyName"
                defaultValue={loadedDraft.companyName ?? ""}
              />
              <LabeledInput
                label="岗位"
                name="positionTitle"
                defaultValue={loadedDraft.positionTitle ?? ""}
              />
              <LabeledInput
                label="年份"
                name="year"
                type="number"
                defaultValue={loadedDraft.year?.toString() ?? ""}
              />
              <LabeledInput
                label="季节"
                name="season"
                defaultValue={loadedDraft.season ?? ""}
              />
              <LabeledInput
                label="地点"
                name="location"
                defaultValue={loadedDraft.location ?? ""}
              />
              <div className="sm:col-span-2">
                <label
                  htmlFor="summary"
                  className="text-ink mb-1 block text-xs font-medium"
                >
                  摘要
                </label>
                <Textarea
                  id="summary"
                  name="summary"
                  rows={3}
                  defaultValue={loadedDraft.summary ?? ""}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary" size="sm">
                  保存元数据
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-ink-secondary mt-3 text-sm">
              暂无解析草稿，请在下方运行解析器。
            </p>
          )}
        </Card>
      </div>

      {/* Rounds (Task 33) */}
      {loadedRounds.length > 0 && (
        <section className="mt-6">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
            面试轮次（{loadedRounds.length}）
          </h2>
          <div className="mt-3 grid gap-3">
            {loadedRounds.map((round) => (
              <Card key={round.id} className="p-4">
                <form
                  action={editRoundAction}
                  className="flex flex-wrap items-end gap-3"
                >
                  <input type="hidden" name="submissionId" value={submission.id} />
                  <input type="hidden" name="roundDraftId" value={round.id} />
                  <LabeledInput
                    label={`第 ${round.orderIndex + 1} 轮标题`}
                    name="title"
                    defaultValue={round.title ?? ""}
                    className="w-48"
                  />
                  <div>
                    <label
                      htmlFor={`type-${round.id}`}
                      className="text-ink mb-1 block text-xs font-medium"
                    >
                      类型
                    </label>
                    <select
                      id={`type-${round.id}`}
                      name="roundType"
                      defaultValue={round.roundType}
                      className="border-line bg-surface text-ink focus:outline-accent h-10 rounded-sm border px-2 text-sm"
                    >
                      {ROUND_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {displayLabel(type, ROUND_TYPE_LABELS)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <LabeledInput
                    label="时长（分钟）"
                    name="durationMinutes"
                    type="number"
                    defaultValue={round.durationMinutes?.toString() ?? ""}
                    className="w-24"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    保存轮次
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Question drafts with canonical match suggestions (Tasks 23, 24, 57) */}
      <section className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
            问题（{loadedQuestions.length}）
          </h2>
          {metrics && (
            <p className="text-ink-tertiary text-xs tabular-nums">
              已接受{" "}
              {
                loadedQuestions.filter((q) =>
                  ["accepted", "edited", "new_canonical"].includes(q.reviewStatus),
                ).length
              }{" "}
              · 待处理 {metrics.unresolvedQuestions} · 新标准问题{" "}
              {metrics.manualNewCanonicals} · 已拒绝 {metrics.rejectedQuestions}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-4">
          {loadedQuestions.map((question) => (
            <QuestionReview
              key={question.id}
              submissionId={submission.id}
              question={question}
              candidates={candidateMap.get(question.id) ?? []}
            />
          ))}
          {loadedQuestions.length === 0 && (
            <Card className="p-4">
              <p className="text-ink-secondary text-sm">没有提取到问题。</p>
            </Card>
          )}
        </div>
      </section>

      {/* Jobs + events (Tasks 6, 7) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
            任务
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="border-line-subtle border-b pb-2 last:border-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink">
                    {displayLabel(job.jobType, JOB_TYPE_LABELS)}
                  </span>
                  <span className="text-ink-tertiary text-xs">
                    {displayLabel(job.status, STATUS_LABELS)} · 尝试 {job.attemptCount}/
                    {job.maxAttempts}
                    {job.errorCode
                      ? ` · ${displayIngestionErrorCode(job.errorCode)}`
                      : ""}
                  </span>
                </div>
                {job.errorMessage && (
                  <p className="text-ink-tertiary mt-1 text-xs">
                    {job.errorCode
                      ? `处理失败：${displayIngestionErrorCode(job.errorCode)}`
                      : "处理失败，请稍后重试。"}
                  </p>
                )}
                {job.status === "failed" && job.attemptCount < job.maxAttempts && (
                  <form action={retryParseAction} className="mt-1.5">
                    <input type="hidden" name="submissionId" value={submission.id} />
                    <input type="hidden" name="jobId" value={job.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      重试解析
                    </Button>
                  </form>
                )}
              </li>
            ))}
            {jobs.length === 0 && <li className="text-ink-tertiary">暂无任务。</li>}
          </ul>
          <form
            action={enqueueReparseAction}
            className="border-line-subtle mt-3 border-t pt-3"
          >
            <input type="hidden" name="submissionId" value={submission.id} />
            <Button type="submit" variant="secondary" size="sm">
              重新解析（新建任务）
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
            事件时间线
          </h2>
          <ol className="text-ink-secondary mt-3 flex flex-col gap-1.5 text-xs">
            {events.map((event) => (
              <li key={event.id} className="flex gap-2">
                <span className="text-ink-tertiary tabular-nums">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </span>
                <span className="text-ink font-medium">
                  {displayIngestionEventType(event.eventType)}
                </span>
                <span>{displayIngestionMessage(event.message)}</span>
              </li>
            ))}
            {events.length === 0 && <li>暂无事件。</li>}
          </ol>
        </Card>
      </div>

      {/* Review actions + publish controls (Tasks 34, 35, 77) */}
      <Card className="mt-6 p-5">
        <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">
          审核决策
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <form action={approveAction}>
            <input type="hidden" name="submissionId" value={submission.id} />
            <Button type="submit">批准草稿</Button>
          </form>
          <form action={publishAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="submissionId" value={submission.id} />
            <div>
              <label
                htmlFor="companyId"
                className="text-ink mb-1 block text-xs font-medium"
              >
                公司（发布时必填）
              </label>
              <select
                id="companyId"
                name="companyId"
                className="border-line bg-surface text-ink focus:outline-accent h-10 rounded-sm border px-2 text-sm"

                required
              >
                <option value="">— 选择公司 —</option>
                {(companies ?? []).map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary">
              发布
            </Button>
          </form>
          <form action={returnToReviewAction}>
            <input type="hidden" name="submissionId" value={submission.id} />
            <Button type="submit" variant="ghost">
              返回审核
            </Button>
          </form>
          <form action={blockAction} className="flex items-end gap-2">
            <input type="hidden" name="submissionId" value={submission.id} />
            <LabeledInput label="封禁备注" name="note" className="w-40" />
            <Button type="submit" variant="ghost">
              封禁
            </Button>
          </form>
        </div>

        <form
          action={rejectAction}
          className="border-line-subtle mt-4 flex flex-wrap items-end gap-2 border-t pt-4"
        >
          <input type="hidden" name="submissionId" value={submission.id} />
          <div>
            <label htmlFor="reason" className="text-ink mb-1 block text-xs font-medium">
              拒绝原因
            </label>
            <select
              id="reason"
              name="reason"
              className="border-line bg-surface text-ink focus:outline-accent h-10 rounded-sm border px-2 text-sm"
              defaultValue="other"
            >
              {REJECTION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {displayLabel(reason, REJECTION_REASON_LABELS)}
                </option>
              ))}
            </select>
          </div>
          <LabeledInput label="内部备注" name="note" className="w-64" />
          <Button type="submit" variant="danger">
            拒绝投稿
          </Button>
        </form>

        {loadedDraft?.publishedInterviewId && (
          <p className="text-success-ink mt-3 text-sm">
            已发布。{" "}
            <Link
              href={`/interviews/${loadedDraft.publishedInterviewId}`}
              className="underline"
            >
              查看面经
            </Link>{" "}
            （再次发布不会产生变化，操作具有幂等性。）
          </p>
        )}
      </Card>
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Question review card (Tasks 23, 24, 57, 60)
// ---------------------------------------------------------------------------

function QuestionReview({
  submissionId,
  question,
  candidates,
}: {
  submissionId: string;
  question: InterviewQuestionDraft;
  candidates: CanonicalMatchCandidate[];
}) {
  const band = question.matchScore !== null ? matchBand(question.matchScore) : null;
  const resolved =
    question.reviewStatus !== "pending" && question.reviewStatus !== "edited";

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-ink-tertiary text-xs">
          问题 #{question.orderIndex + 1}
        </span>
        <div className="flex items-center gap-2">
          <Badge
            variant="status"
            tone={
              question.reviewStatus === "rejected"
                ? "rejected"
                : ["accepted", "edited", "new_canonical"].includes(
                      question.reviewStatus,
                    )
                  ? "published"
                  : "review"
            }
          >
            {displayLabel(question.reviewStatus, REVIEW_STATUS_LABELS)}
          </Badge>
          {band && (
            <span className="text-ink-tertiary text-xs">
              {band === "strong"
                ? "强匹配"
                : band === "possible"
                  ? "可能匹配"
                  : "弱匹配"}
            </span>
          )}
        </div>
      </div>

      {/* Diff view: raw vs normalized vs canonical (Task 57) */}
      <dl className="mt-3 flex flex-col gap-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="text-ink-tertiary w-20 shrink-0 text-xs leading-6 uppercase">
            原始
          </dt>
          <dd className="text-ink">{question.originalWording}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-tertiary w-20 shrink-0 text-xs leading-6 uppercase">
            标准化
          </dt>
          <dd className="text-ink-secondary">{question.normalizedText ?? "—"}</dd>
        </div>
        {question.candidateQuestionId && (
          <div className="flex gap-2">
            <dt className="text-ink-tertiary w-20 shrink-0 text-xs leading-6 uppercase">
              标准问题
            </dt>
            <dd className="text-ink-secondary">
              已关联：{question.candidateQuestionId}
              {question.matchScore !== null
                ? ` (${question.matchScore.toFixed(2)})`
                : ""}
            </dd>
          </div>
        )}
      </dl>

      {!resolved && (
        <>
          {/* Edit wording/type (Tasks 33, 60) */}
          <form
            action={editQuestionAction}
            className="border-line-subtle mt-3 flex flex-wrap items-end gap-2 border-t pt-3"
          >
            <input type="hidden" name="submissionId" value={submissionId} />
            <input type="hidden" name="questionDraftId" value={question.id} />
            <LabeledInput
              label="标准化表述"
              name="normalizedText"
              defaultValue={question.normalizedText ?? ""}
              className="min-w-64 flex-1"
            />
            <div>
              <label
                htmlFor={`qtype-${question.id}`}
                className="text-ink mb-1 block text-xs font-medium"
              >
                类型
              </label>
              <select
                id={`qtype-${question.id}`}
                name="questionType"
                defaultValue={question.questionType ?? ""}
                className="border-line bg-surface text-ink focus:outline-accent h-10 rounded-sm border px-2 text-sm"
              >
                <option value="">—</option>
                {QUESTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {displayLabel(type, QUESTION_TYPE_LABELS)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`qdiff-${question.id}`}
                className="text-ink mb-1 block text-xs font-medium"
              >
                难度
              </label>
              <select
                id={`qdiff-${question.id}`}
                name="difficulty"
                defaultValue={question.difficulty ?? ""}
                className="border-line bg-surface text-ink focus:outline-accent h-10 rounded-sm border px-2 text-sm"
              >
                <option value="">—</option>
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {displayLabel(difficulty, DIFFICULTY_LABELS)}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary" size="sm">
              保存
            </Button>
          </form>

          {/* Canonical suggestions */}
          {candidates.length > 0 && (
            <div className="mt-3">
              <p className="text-ink mb-1.5 text-xs font-medium">建议的标准问题匹配</p>
              <ol className="flex flex-col gap-1.5">
                {candidates.map((candidate, index) => (
                  <li
                    key={candidate.questionId}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span className="text-ink-secondary text-sm">
                      {index + 1}. {candidate.title}{" "}
                      <span className="text-ink-tertiary tabular-nums">
                        {candidate.score.toFixed(2)}
                      </span>
                    </span>
                    <form action={acceptMatchAction}>
                      <input type="hidden" name="submissionId" value={submissionId} />
                      <input type="hidden" name="questionDraftId" value={question.id} />
                      <input
                        type="hidden"
                        name="questionId"
                        value={candidate.questionId}
                      />
                      <input type="hidden" name="score" value={candidate.score} />
                      <Button type="submit" variant="secondary" size="sm">
                        接受
                      </Button>
                    </form>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Create new canonical (Task 24) */}
          <details className="border-line-subtle mt-3 border-t pt-3">
            <summary className="text-ink cursor-pointer text-xs font-medium">
              创建新的标准问题
            </summary>
            <form
              action={createCanonicalAction}
              className="mt-2 flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="submissionId" value={submissionId} />
              <input type="hidden" name="questionDraftId" value={question.id} />
              <LabeledInput
                label="标题"
                name="title"
                required
                className="min-w-64 flex-1"
                placeholder="标准问题标题"
              />
              <div>
                <label
                  htmlFor={`newtype-${question.id}`}
                  className="text-ink mb-1 block text-xs font-medium"
                >
                  类型
                </label>
                <select
                  id={`newtype-${question.id}`}
                  name="questionType"
                  defaultValue={question.questionType ?? "knowledge"}
                  className="border-line bg-surface text-ink focus:outline-accent h-10 rounded-sm border px-2 text-sm"
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {displayLabel(type, QUESTION_TYPE_LABELS)}
                    </option>
                  ))}
                </select>
              </div>
              <LabeledInput label="摘要（可选）" name="summary" className="w-48" />
              <Button type="submit" variant="secondary" size="sm">
                创建标准问题
              </Button>
            </form>
          </details>

          {/* Reject occurrence */}
          <form action={rejectQuestionAction} className="mt-3 flex items-end gap-2">
            <input type="hidden" name="submissionId" value={submissionId} />
            <input type="hidden" name="questionDraftId" value={question.id} />
            <LabeledInput label="拒绝备注" name="note" className="w-48" />
            <Button type="submit" variant="ghost" size="sm">
              拒绝问题
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}

function LabeledInput({
  label,
  name,
  type = "text",
  defaultValue,
  className,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="text-ink mb-1 block text-xs font-medium">
        {label}
      </label>
      <Input
        id={`f-${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );
}
