import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Terms of Use — RoboPrep",
  description: "The terms that apply to using RoboPrep.",
};

/** Week 8 Task 90: terms covering submissions, acceptable use, judge abuse. */
const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: "User submissions",
    body: [
      "By submitting an interview experience, you confirm it is your genuine recollection or a properly attributed public source, and you grant RoboPrep a non-exclusive license to publish an anonymized, structured version after human review.",
      "Submissions are reviewed before publication and may be edited, canonicalized, or rejected.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "Do not submit content containing personal contact information, confidential employer material, or content you are not authorized to share.",
      "Automated scraping, spam submissions, and attempts to abuse the judge or ingestion pipeline are prohibited and rate limited.",
    ],
  },
  {
    heading: "Coding judge",
    body: [
      "The judge executes submitted code in an isolated environment for the purpose of evaluating solutions only. Attempts to exploit it (resource exhaustion, network access, attacks on the infrastructure) are prohibited.",
    ],
  },
  {
    heading: "Content accuracy",
    body: [
      "RoboPrep presents community-sourced interview records with explicit sample sizes. We do not guarantee that any specific question will appear in any interview, and metrics are evidence summaries, not predictions.",
    ],
  },
  {
    heading: "Third-party sources",
    body: [
      "Where an interview record references a public source, the link is provided for provenance. RoboPrep is not affiliated with the companies discussed.",
    ],
  },
];

export default function TermsPage() {
  return (
    <Container className="py-14">
      <PageHeader title="Terms of Use" description="The terms that apply to using RoboPrep." />
      <div className="mt-8 flex max-w-2xl flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-ink font-semibold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-ink-secondary mt-2 text-sm leading-relaxed">{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </Container>
  );
}
