"use client";

export default function InterviewsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-reading flex-col gap-3 px-5 py-20 text-center sm:px-8">
      <h1 className="text-ink text-xl font-semibold">Interviews could not load</h1>
      <p className="text-ink-secondary text-sm">Please try again. Database details are kept out of the page for safety.</p>
      <button type="button" onClick={reset} className="text-accent hover:text-accent-hover text-sm font-medium">Try again</button>
    </div>
  );
}
