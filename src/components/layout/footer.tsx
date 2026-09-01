import Link from "next/link";

import { Container } from "@/components/layout/container";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "/interviews", label: "Interviews" },
      { href: "/knowledge", label: "Knowledge" },
      { href: "/coding", label: "Coding" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { href: "/companies", label: "Companies" },
      { href: "/knowledge", label: "Topics" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Create account" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-line-subtle bg-surface mt-24 border-t">
      <Container className="flex flex-col gap-10 py-12 sm:flex-row sm:justify-between">
        <div className="flex max-w-xs flex-col gap-2">
          <p className="text-ink text-[0.9375rem] font-semibold">RoboPrep</p>
          <p className="text-ink-secondary text-sm leading-relaxed">
            Master Embodied AI, one question at a time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <p className="text-ink-tertiary text-xs font-semibold tracking-wide uppercase">
                {column.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-ink-secondary hover:text-ink text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <Container className="border-line-subtle border-t py-6">
        <p className="text-ink-tertiary text-xs">
          RoboPrep — interview preparation for Embodied AI roles. Content is community
          reported; verify before you rely on it.
        </p>
      </Container>
    </footer>
  );
}
