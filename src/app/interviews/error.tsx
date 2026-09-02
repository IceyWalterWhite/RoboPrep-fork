"use client";

export default function InterviewsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-reading mx-auto flex flex-col gap-3 px-5 py-20 text-center sm:px-8">
      <h1 className="text-ink text-xl font-semibold">面试加载失败</h1>
      <p className="text-ink-secondary text-sm">
        请重试。出于安全考虑，页面不会显示数据库详情。
      </p>
      <button
        type="button"
        onClick={reset}
        className="text-accent hover:text-accent-hover text-sm font-medium"
      >
        再次尝试
      </button>
    </div>
  );
}
