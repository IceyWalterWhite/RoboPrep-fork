import Link from "next/link";

import { Container } from "@/components/layout/container";

const columns = [
  {
    heading: "产品",
    links: [
      { href: "/interviews", label: "面试" },
      { href: "/knowledge", label: "知识库" },
      { href: "/coding", label: "Coding" },
    ],
  },
  {
    heading: "探索",
    links: [
      { href: "/companies", label: "公司" },
      { href: "/knowledge", label: "主题" },
    ],
  },
  {
    heading: "账户",
    links: [
      { href: "/sign-in", label: "登录" },
      { href: "/sign-up", label: "创建账户" },
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
            一次一题，准备具身智能面试。
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
          RoboPrep —
          面向具身智能岗位的面试准备平台。内容来自社区分享，使用前请自行核实。
        </p>
      </Container>
    </footer>
  );
}
