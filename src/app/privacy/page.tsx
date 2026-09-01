import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Privacy Policy — RoboPrep",
  description: "What RoboPrep stores, who can see it, and how data is protected.",
};

/** Week 8 Task 89: privacy policy matching implemented behavior. */
const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: "Account data",
    body: [
      "We store your email address and an optional display name to operate your account. You can update them in Settings and request account deletion at any time.",
      "Passwords are handled exclusively by our authentication provider (Supabase Auth); RoboPrep never sees or stores your password.",
    ],
  },
  {
    heading: "Coding submissions",
    body: [
      "When you Run or Submit code, we store the source code and the judge result linked to your account. Hidden test inputs, expected outputs, and reference solutions never leave our server.",
      "Your submissions are visible only to you. Aggregate acceptance statistics contain no user identities.",
    ],
  },
  {
    heading: "Interview submissions",
    body: [
      "Submitted interview experiences are stored as immutable raw records visible only to you and our reviewers. They are parsed by an LLM provider after contact information is removed, reviewed by a human, and published anonymously only after approval.",
      "Published interviews never show your identity, email, raw submission text, or moderation notes. Rejection reasons are internal.",
    ],
  },
  {
    heading: "Analytics and error tracking",
    body: [
      "We collect minimal product analytics (page views and feature events) that contain no interview content, source code, or personal identifiers.",
      "Error tracking captures error messages and request identifiers, scrubbed to remove emails, tokens, and content payloads.",
    ],
  },
  {
    heading: "Retention and deletion",
    body: [
      "Account deletion removes your profile, coding submissions, and unpublishable personal data. Published community interviews remain part of the anonymized knowledge base; you can request removal of a specific interview via the report/contact channel.",
      "See docs/data-retention.md in the repository for operational retention windows.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <Container className="py-14">
      <PageHeader title="Privacy Policy" description="What RoboPrep stores, who can see it, and how data is protected." />
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
