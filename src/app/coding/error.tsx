"use client";

import { useEffect } from "react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[coding] route error");
  }, []);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-content flex-col items-center justify-center px-5 text-center sm:px-8">
      <h1 className="text-ink text-xl font-semibold">Coding is temporarily unavailable</h1>
      <p className="text-ink-secondary mt-2 max-w-md text-sm">Please try again. The problem catalog and judge are still safe to retry.</p>
      <button type="button" onClick={() => reset()} className="text-accent hover:text-accent-hover mt-5 text-sm font-medium">Try again</button>
    </main>
  );
}
