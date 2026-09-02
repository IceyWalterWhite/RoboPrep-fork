import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-content mx-auto flex min-h-[50vh] flex-col items-center justify-center px-5 text-center sm:px-8">
      <h1 className="text-ink text-xl font-semibold">未找到 Coding 题目</h1>
      <p className="text-ink-secondary mt-2 text-sm">
        题目可能尚未发布，或链接已过期。
      </p>
      <Link
        href="/coding"
        className="text-accent hover:text-accent-hover mt-5 text-sm font-medium"
      >
        返回 Coding
      </Link>
    </main>
  );
}
