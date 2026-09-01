import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CodingProblemDetail } from "@/types/coding";

export function ProblemStatement({ problem }: { problem: CodingProblemDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Problem statement</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="text-ink-secondary whitespace-pre-line text-[0.9375rem] leading-7">
          {problem.description}
        </div>
        {problem.constraints ? (
          <section>
            <h3 className="text-ink mb-2 text-sm font-semibold">Constraints</h3>
            <p className="text-ink-secondary whitespace-pre-line text-sm leading-6">{problem.constraints}</p>
          </section>
        ) : null}
        <dl className="border-line-subtle grid grid-cols-2 gap-4 border-t pt-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-ink-tertiary text-xs">Language</dt>
            <dd className="text-ink mt-1 font-medium">Python 3</dd>
          </div>
          <div>
            <dt className="text-ink-tertiary text-xs">Time limit</dt>
            <dd className="text-ink mt-1 font-medium">{problem.timeLimitMs} ms</dd>
          </div>
          <div>
            <dt className="text-ink-tertiary text-xs">Memory limit</dt>
            <dd className="text-ink mt-1 font-medium">{problem.memoryLimitMb} MB</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
