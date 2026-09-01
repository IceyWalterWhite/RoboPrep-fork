import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { requireReviewer } from "@/lib/auth/reviewer";

/**
 * Admin shell (Task 30): every route below /admin is server-side guarded.
 * Non-reviewers get a 404 — we do not reveal the existence of an admin area.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await requireReviewer();
  if (!viewer) notFound();
  return <>{children}</>;
}
