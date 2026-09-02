import Link from "next/link";

export default function InterviewNotFound() {
  return (
    <div className="max-w-reading mx-auto flex flex-col gap-3 px-5 py-20 text-center sm:px-8">
      <h1 className="text-ink text-2xl font-semibold">未找到面试</h1>
      <p className="text-ink-secondary text-sm">
        这条面试不存在、暂不可用，或尚未发布。
      </p>
      <Link
        href="/interviews"
        className="text-accent hover:text-accent-hover text-sm font-medium"
      >
        返回面试列表
      </Link>
    </div>
  );
}
