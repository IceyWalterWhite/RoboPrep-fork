import type { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
  title: "Page not found — RoboPrep",
  robots: { index: false, follow: false },
};

/**
 * Week 8 Task 95: brand-consistent global 404 with recovery links into the
 * four core surfaces.
 */
export default function GlobalNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center px-5 text-center sm:px-8">
      <p className="text-ink-tertiary text-sm tracking-wide uppercase">404</p>
      <h1 className="text-title text-ink mt-2 font-semibold tracking-[-0.02em]">This page doesn&apos;t exist</h1>
      <p className="text-ink-secondary mt-2 max-w-md text-sm leading-relaxed">
        The link may be out of date, or the content may have been unpublished after review.
      </p>
      <nav aria-label="Recovery" className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-medium">
        <Link href="/knowledge" className="text-accent hover:text-accent-hover">Knowledge</Link>
        <Link href="/interviews" className="text-accent hover:text-accent-hover">Interviews</Link>
        <Link href="/coding" className="text-accent hover:text-accent-hover">Coding</Link>
        <Link href="/companies" className="text-accent hover:text-accent-hover">Companies</Link>
      </nav>
    </main>
  );
}
