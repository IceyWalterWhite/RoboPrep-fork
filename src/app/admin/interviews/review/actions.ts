"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireReviewer } from "@/lib/auth/reviewer";
import { slugify } from "@/lib/ingestion/normalize";
import {
  getDraftBySubmission,
  recordEvent,
  updateDraft,
  updateQuestionDraft,
  updateRoundDraft,
} from "@/lib/ingestion/queries";
import {
  acceptCanonicalMatch,
  approveDraft,
  blockSubmission,
  createNewCanonical,
  enqueueParseJob,
  publishDraft,
  rejectQuestion,
  rejectSubmission,
  retryParseJob,
  returnToReview,
  runParseJob,
} from "@/lib/ingestion/service";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RejectionReason } from "@/types/ingestion";

/**
 * Server actions for the review workflow (Tasks 34, 43, 50, 55). Every action
 * re-checks reviewer authorization server-side; the client cannot supply
 * roles, provider prompts, or authoritative status. Plain <form> actions keep
 * the review UI fully keyboard accessible (Task 71).
 */

function message(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 300) : "Unexpected error.";
}

function back(submissionId: string, error?: string): never {
  revalidatePath(`/admin/interviews/review/${submissionId}`);
  if (error) {
    redirect(`/admin/interviews/review/${submissionId}?error=${encodeURIComponent(error)}`);
  }
  redirect(`/admin/interviews/review/${submissionId}`);
}

async function guard() {
  const viewer = await requireReviewer();
  if (!viewer) notAuthorized();
  const admin = createAdminClient();
  if (!admin) back("", "Ingestion service is not configured.");
  return { viewer, admin };
}

function notAuthorized(): never {
  redirect("/admin/interviews/review?error=Not%20authorized");
}

export async function retryParseAction(formData: FormData): Promise<void> {
  const { admin } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  const jobId = formData.get("jobId") as string | null;
  if (!submissionId || !jobId) back(submissionId ?? "", "Missing job or submission.");
  try {
    await retryParseJob(admin, jobId);
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function enqueueReparseAction(formData: FormData): Promise<void> {
  const { admin } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  if (!submissionId) back("", "Missing submission.");
  try {
    const job = await enqueueParseJob(admin, submissionId);
    await runParseJob(admin, job.id);
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function approveAction(formData: FormData): Promise<void> {
  const { admin, viewer } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  if (!submissionId) back("", "Missing submission.");
  try {
    await approveDraft(admin, submissionId, viewer.id);
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function rejectAction(formData: FormData): Promise<void> {
  const { admin, viewer } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  const reason = ((formData.get("reason") as string) || "other") as RejectionReason;
  const note = (formData.get("note") as string) || undefined;
  if (!submissionId) back("", "Missing submission.");
  try {
    await rejectSubmission(admin, submissionId, viewer.id, reason, note);
  } catch (error) {
    back(submissionId, message(error));
  }
  revalidatePath("/admin/interviews/review");
  back(submissionId);
}

export async function blockAction(formData: FormData): Promise<void> {
  const { admin, viewer } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  const note = (formData.get("note") as string) || undefined;
  if (!submissionId) back("", "Missing submission.");
  try {
    await blockSubmission(admin, submissionId, viewer.id, note);
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function returnToReviewAction(formData: FormData): Promise<void> {
  const { admin, viewer } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  if (!submissionId) back("", "Missing submission.");
  try {
    await returnToReview(admin, submissionId, viewer.id);
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function editDraftAction(formData: FormData): Promise<void> {
  const { admin, viewer } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  if (!submissionId) back("", "Missing submission.");
  try {
    const draft = await getDraftBySubmission(admin, submissionId);
    if (!draft) back(submissionId, "No draft to edit.");
    await updateDraft(admin, draft.id, {
      companyName: (formData.get("companyName") as string) || null,
      positionTitle: (formData.get("positionTitle") as string) || null,
      year: formData.get("year") ? Number(formData.get("year")) : null,
      season: (formData.get("season") as string) || null,
      location: (formData.get("location") as string) || null,
      summary: (formData.get("summary") as string) || null,
    });
    await recordEvent(admin, {
      submissionId,
      eventType: "draft_edited",
      message: "metadata edited by reviewer",
      metadata: { reviewerId: viewer.id },
    });
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function editRoundAction(formData: FormData): Promise<void> {
  const { admin } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  const roundDraftId = formData.get("roundDraftId") as string | null;
  if (!submissionId || !roundDraftId) back(submissionId ?? "", "Missing identifiers.");
  try {
    await updateRoundDraft(admin, roundDraftId, {
      title: (formData.get("title") as string) || null,
      roundType: (formData.get("roundType") as string) || "unknown",
      durationMinutes: formData.get("durationMinutes") ? Number(formData.get("durationMinutes")) : null,
    });
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function editQuestionAction(formData: FormData): Promise<void> {
  const { admin } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  const questionDraftId = formData.get("questionDraftId") as string | null;
  if (!submissionId || !questionDraftId) back(submissionId ?? "", "Missing identifiers.");
  try {
    const normalized = (formData.get("normalizedText") as string) || null;
    await updateQuestionDraft(admin, questionDraftId, {
      normalizedText: normalized,
      questionType: (formData.get("questionType") as string) || null,
      difficulty: (formData.get("difficulty") as string) || null,
      reviewStatus: "edited",
    });
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function acceptMatchAction(formData: FormData): Promise<void> {
  const { admin, viewer } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  const questionDraftId = formData.get("questionDraftId") as string | null;
  const questionId = formData.get("questionId") as string | null;
  const scoreRaw = formData.get("score") as string | null;
  if (!submissionId || !questionDraftId || !questionId) back(submissionId ?? "", "Missing identifiers.");
  try {
    await acceptCanonicalMatch(
      admin,
      questionDraftId,
      questionId,
      scoreRaw ? Number(scoreRaw) : null,
      viewer.id,
    );
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function createCanonicalAction(formData: FormData): Promise<void> {
  const { admin, viewer } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  const questionDraftId = formData.get("questionDraftId") as string | null;
  const title = ((formData.get("title") as string) || "").trim();
  const questionType = (formData.get("questionType") as string) || "knowledge";
  const summary = (formData.get("summary") as string) || undefined;
  const topicIds = formData.getAll("topicIds").map(String);
  if (!submissionId || !questionDraftId) back(submissionId ?? "", "Missing identifiers.");
  if (!title) back(submissionId, "Title is required for a new canonical question.");
  try {
    await createNewCanonical(
      admin,
      questionDraftId,
      { title, slug: slugify(title), questionType, summary, topicIds },
      viewer.id,
    );
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function rejectQuestionAction(formData: FormData): Promise<void> {
  const { admin, viewer } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  const questionDraftId = formData.get("questionDraftId") as string | null;
  const note = (formData.get("note") as string) || undefined;
  if (!submissionId || !questionDraftId) back(submissionId ?? "", "Missing identifiers.");
  try {
    await rejectQuestion(admin, questionDraftId, viewer.id, note);
  } catch (error) {
    back(submissionId, message(error));
  }
  back(submissionId);
}

export async function publishAction(formData: FormData): Promise<void> {
  const { admin, viewer } = await guard();
  const submissionId = formData.get("submissionId") as string | null;
  const companyId = (formData.get("companyId") as string) || null;
  const positionId = (formData.get("positionId") as string) || null;
  if (!submissionId) back("", "Missing submission.");
  let slug = "";
  try {
    const result = await publishDraft(admin, submissionId, viewer.id, { companyId, positionId });
    slug = result.slug;
  } catch (error) {
    back(submissionId, message(error));
  }
  revalidatePath("/interviews");
  if (slug) revalidatePath(`/interviews/${slug}`);
  revalidatePath("/admin/interviews/review");
  back(submissionId);
}
