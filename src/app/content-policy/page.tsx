import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Content & Source Policy — RoboPrep",
  description: "How community and public-source interview content is reviewed, structured, and corrected.",
};

/** Week 8 Task 91: content/source/canonicalization/removal policy. */
const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: "Sources",
    body: [
      "Interview records come from community submissions (published anonymously after review) and attributed public sources. Every published record keeps internal provenance back to its origin.",
    ],
  },
  {
    heading: "Canonicalization",
    body: [
      "Questions extracted from interviews are matched to canonical Knowledge entries by reviewers. Original wording is always preserved on the occurrence; canonical questions are the reusable, enriched version.",
    ],
  },
  {
    heading: "Verification",
    body: [
      "Nothing is published automatically. Human reviewers check structure, duplicates, privacy risks, and question quality before publication, and every metric on the site shows the sample size it is based on.",
    ],
  },
  {
    heading: "Removal and correction",
    body: [
      "If you believe a record is inaccurate, violates your privacy, or duplicates another, use the Report link on the content page or the feedback form. Confirmed issues are corrected or unpublished.",
      "Submitters can request removal of their own published submissions at any time via the same channel.",
    ],
  },
];

export default function ContentPolicyPage() {
  return (
    <Container className="py-14">
      <PageHeader title="Content & Source Policy" description="How interview content is sourced, reviewed, and corrected." />
      <div className="mt-8 flex max-w-2xl flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-ink font-semibold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-ink-secondary mt-2 text-sm leading-relaxed">{paragraph}</p>
            ))}
          </section>
        ))}
        <p className="text-ink-secondary text-sm">
          Related:{" "}
          <Link href="/privacy" className="text-accent hover:text-accent-hover">Privacy Policy</Link> ·{" "}
          <Link href="/terms" className="text-accent hover:text-accent-hover">Terms of Use</Link>
        </p>
      </div>
    </Container>
  );
}
