import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { InterviewTopicSummary } from "@/types/interview";

export function InterviewTopics({ topics }: { topics: InterviewTopicSummary[] }) {
  if (topics.length === 0) return null;
  return (
    <section aria-labelledby="interview-topics-heading" className="flex flex-col gap-3">
      <h2
        id="interview-topics-heading"
        className="text-ink text-xl font-semibold tracking-[-0.015em]"
      >
        涉及主题
      </h2>
      <ul className="flex flex-wrap gap-2">
        {topics.slice(0, 10).map((topic) => (
          <li key={topic.slug}>
            <Link href={`/knowledge?topic=${encodeURIComponent(topic.slug)}`}>
              <Badge variant="topic" className="hover:underline">
                {topic.name} · {topic.questionCount}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
