import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "使用条款 — RoboPrep",
  description: "使用 RoboPrep 时适用的条款。",
};

/** Week 8 Task 90: terms covering submissions, acceptable use, judge abuse. */
const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: "用户投稿",
    body: [
      "提交面试经历即表示你确认内容是自己的真实回忆，或来自已正确注明出处的公开来源；同时，你授予 RoboPrep 非独家许可，使其可以在人工审核后发布匿名的结构化版本。",
      "投稿会在发布前经过审核，也可能被编辑、标准化或拒绝。",
    ],
  },
  {
    heading: "可接受的使用方式",
    body: [
      "请勿提交包含个人联系方式、雇主机密材料或你无权分享的内容。",
      "禁止自动抓取、垃圾投稿以及滥用判题或内容摄取流程的行为；相关请求会受到频率限制。",
    ],
  },
  {
    heading: "Coding 判题",
    body: [
      "判题服务会在隔离环境中运行提交的代码，仅用于评估解答。禁止尝试利用判题服务（耗尽资源、访问网络或攻击基础设施）。",
    ],
  },
  {
    heading: "内容准确性",
    body: [
      "RoboPrep 展示来自社区的面试记录，并明确标注样本量。我们不保证某个具体问题会出现在任何一次面试中；统计指标是证据汇总，不是预测。",
    ],
  },
  {
    heading: "第三方来源",
    body: [
      "如果面试记录引用了公开来源，我们会提供链接以便追溯。RoboPrep 与其中提到的公司没有关联关系。",
    ],
  },
];

export default function TermsPage() {
  return (
    <Container className="py-14">
      <PageHeader title="使用条款" description="使用 RoboPrep 时适用的条款。" />
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
      </div>
    </Container>
  );
}
