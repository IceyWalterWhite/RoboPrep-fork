import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "内容与来源政策 — RoboPrep",
  description: "了解社区和公开来源的面试内容如何审核、整理和更正。",
};

/** Week 8 Task 91: content/source/canonicalization/removal policy. */
const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: "来源",
    body: [
      "面试记录来自社区投稿（审核后匿名发布）和注明出处的公开来源。每条已发布记录都会在内部保留可追溯到原始来源的依据。",
    ],
  },
  {
    heading: "标准化",
    body: [
      "从面试中提取的问题会由审核人员匹配到知识库标准条目。原始问法始终保留在出现记录中；标准问题是可复用、经过补充整理的版本。",
    ],
  },
  {
    heading: "验证",
    body: [
      "所有内容都不会自动发布。人工审核人员会在发布前检查结构、重复内容、隐私风险和问题质量；网站上的每项统计都会显示其依据的样本量。",
    ],
  },
  {
    heading: "移除与更正",
    body: [
      "如果你认为某条记录不准确、侵犯隐私或与其他记录重复，请使用内容页面上的举报链接或反馈表单。经确认的问题会被更正或撤下。",
      "投稿者可以随时通过相同渠道请求移除自己发布的投稿。",
    ],
  },
];

export default function ContentPolicyPage() {
  return (
    <Container className="py-14">
      <PageHeader
        title="内容与来源政策"
        description="了解面试内容如何获取、审核和更正。"
      />
      <div className="mt-8 flex max-w-2xl flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-ink font-semibold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="text-ink-secondary mt-2 text-sm leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        <p className="text-ink-secondary text-sm">
          相关页面：{" "}
          <Link href="/privacy" className="text-accent hover:text-accent-hover">
            隐私政策
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="text-accent hover:text-accent-hover">
            使用条款
          </Link>
        </p>
      </div>
    </Container>
  );
}
