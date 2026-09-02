import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "隐私政策 — RoboPrep",
  description: "了解 RoboPrep 保存哪些数据、谁可以查看以及我们如何保护数据。",
};

/** Week 8 Task 89: privacy policy matching implemented behavior. */
const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: "账户数据",
    body: [
      "我们会保存你的邮箱地址和可选的显示名称，用于运营账户。你可以在“设置”中更新这些信息，也可以随时请求删除账户。",
      "密码完全由身份验证服务商（Supabase Auth）处理；RoboPrep 不会看到或保存你的密码。",
    ],
  },
  {
    heading: "Coding 提交记录",
    body: [
      "当你运行或提交代码时，我们会保存与你账户关联的源代码和判题结果。隐藏测试输入、预期输出和参考解答不会离开我们的服务器。",
      "你的提交记录只有你自己可见。汇总后的通过率统计不包含用户身份信息。",
    ],
  },
  {
    heading: "面试投稿",
    body: [
      "你提交的面试经历会作为不可变的原始记录保存，只有你和审核人员可见。删除联系方式后，内容会交由 LLM 服务商解析，再经人工审核；只有获批后才会匿名发布。",
      "已发布的面试不会展示你的身份、邮箱、原始投稿文本或审核备注。拒绝原因仅供内部使用。",
    ],
  },
  {
    heading: "分析与错误追踪",
    body: [
      "我们只收集最少量的产品分析数据（页面浏览和功能事件），不包含面试内容、源代码或个人身份信息。",
      "错误追踪会记录错误消息和请求标识符，并清除邮箱、令牌和内容载荷。",
    ],
  },
  {
    heading: "保存与删除",
    body: [
      "删除账户会移除你的个人资料、Coding 提交记录以及无法发布的个人数据。已发布的社区面试会继续作为匿名知识库的一部分；你可以通过举报/联系渠道请求移除特定面试。",
      "具体的运营数据保存期限请参阅仓库中的 docs/data-retention.md。",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <Container className="py-14">
      <PageHeader
        title="隐私政策"
        description="了解 RoboPrep 保存哪些数据、谁可以查看以及我们如何保护数据。"
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
      </div>
    </Container>
  );
}
