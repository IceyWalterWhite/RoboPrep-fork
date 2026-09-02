import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "页面不存在 — RoboPrep",
  robots: { index: false, follow: false },
};

/**
 * Week 8 Task 95: brand-consistent global 404 with recovery links into the
 * four core surfaces.
 */
export default function GlobalNotFound() {
  return (
    <main className="max-w-content mx-auto flex min-h-[60vh] flex-col items-center justify-center px-5 text-center sm:px-8">
      <p className="text-ink-tertiary text-sm tracking-wide uppercase">404</p>
      <h1 className="text-title text-ink mt-2 font-semibold tracking-[-0.02em]">
        页面不存在
      </h1>
      <p className="text-ink-secondary mt-2 max-w-md text-sm leading-relaxed">
        链接可能已过期，或者内容在审核后被撤下。
      </p>
      <nav
        aria-label="返回导航"
        className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-medium"
      >
        <Link href="/knowledge" className="text-accent hover:text-accent-hover">
          知识库
        </Link>
        <Link href="/interviews" className="text-accent hover:text-accent-hover">
          面试
        </Link>
        <Link href="/coding" className="text-accent hover:text-accent-hover">
          Coding
        </Link>
        <Link href="/companies" className="text-accent hover:text-accent-hover">
          公司
        </Link>
      </nav>
    </main>
  );
}
