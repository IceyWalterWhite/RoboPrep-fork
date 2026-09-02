import { getSubmissionById } from "@/lib/coding/queries";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const submission = await getSubmissionById(id);
  if (!submission) {
    return Response.json({ error: "未找到提交记录。" }, { status: 404 });
  }
  return Response.json(submission);
}
