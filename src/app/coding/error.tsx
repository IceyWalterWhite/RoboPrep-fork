"use client";

import { useEffect } from "react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[coding] route error");
  }, []);

  return (
    <main className="max-w-content mx-auto flex min-h-[50vh] flex-col items-center justify-center px-5 text-center sm:px-8">
      <h1 className="text-ink text-xl font-semibold">Coding 暂时不可用</h1>
      <p className="text-ink-secondary mt-2 max-w-md text-sm">
        请稍后重试。题目目录和判题服务可以安全地再次请求。
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="text-accent hover:text-accent-hover mt-5 text-sm font-medium"
      >
        再次尝试
      </button>
    </main>
  );
}
