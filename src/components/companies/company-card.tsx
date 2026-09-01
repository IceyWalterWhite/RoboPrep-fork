import Link from "next/link";

import { SampleSizeNote } from "@/components/companies/sample-size-note";
import { Card } from "@/components/ui/card";
import type { CompanySummary } from "@/types/company-intelligence";

/**
 * Task 17: compact company card. Missing data is graceful (no topics → no
 * topic row); never fabricates metrics or ranks companies.
 */
export function CompanyCard({ company }: { company: CompanySummary }) {
  return (
    <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/companies/${company.slug}`} className="text-ink hover:text-accent font-semibold">
            {company.name}
          </Link>
          {company.country && <span className="text-ink-tertiary ml-2 text-sm">{company.country}</span>}
        </div>
        <SampleSizeNote sampleSize={company.interviewCount} className="shrink-0" />
      </div>

      {company.description && (
        <p className="text-ink-secondary mt-2 line-clamp-2 text-sm leading-relaxed">{company.description}</p>
      )}

      <div className="text-ink-secondary mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span>
          {company.interviewCount === 1 ? "1 interview" : `${company.interviewCount} interviews`}
        </span>
        <span>
          {company.positionCount === 1 ? "1 role" : `${company.positionCount} roles`}
        </span>
        {company.latestInterviewAt && (
          <span>Latest {new Date(company.latestInterviewAt).toLocaleDateString()}</span>
        )}
      </div>

      {company.topTopics.length > 0 && (
        <p className="text-ink-tertiary mt-2 text-xs">
          Topics: {company.topTopics.map((topic) => topic.name).join(" · ")}
        </p>
      )}
    </Card>
  );
}
