import Link from "next/link";

export default function InterviewNotFound() {
  return (
    <div className="mx-auto flex max-w-reading flex-col gap-3 px-5 py-20 text-center sm:px-8">
      <h1 className="text-ink text-2xl font-semibold">Interview not found</h1>
      <p className="text-ink-secondary text-sm">This interview is unavailable or has not been published.</p>
      <Link href="/interviews" className="text-accent hover:text-accent-hover text-sm font-medium">Back to interviews</Link>
    </div>
  );
}
