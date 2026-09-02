import { SampleSizeNote } from "@/components/companies/sample-size-note";

/**
 * Task 19: restrained company header — no giant brand hero.
 */
export function CompanyHeader({
  company,
  stats,
}: {
  company: { name: string; description: string | null; country: string | null };
  stats: {
    publishedInterviewCount: number;
    positionCount: number;
    latestInterviewAt: string | null;
  };
}) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-title text-ink font-semibold tracking-[-0.02em]">
          {company.name}
        </h1>
        {company.country && (
          <span className="text-ink-tertiary text-sm">
            {countryLabel(company.country)}
          </span>
        )}
      </div>
      {company.description && (
        <p className="text-ink-secondary max-w-2xl text-sm leading-relaxed">
          {company.description}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <span className="text-ink font-medium">
          {stats.publishedInterviewCount === 1
            ? "1 条已发布面试记录"
            : `${stats.publishedInterviewCount} 条已发布面试记录`}
        </span>
        <span className="text-ink-secondary">{stats.positionCount} 个岗位</span>
        {stats.latestInterviewAt && (
          <span className="text-ink-tertiary">
            最近更新：{new Date(stats.latestInterviewAt).toLocaleDateString()}
          </span>
        )}
      </div>
      {stats.publishedInterviewCount > 0 && (
        <SampleSizeNote sampleSize={stats.publishedInterviewCount} />
      )}
    </header>
  );
}

function countryLabel(country: string): string {
  return (
    { CN: "中国", US: "美国", JP: "日本", DE: "德国", GB: "英国" }[country] ??
    "未知地区"
  );
}
