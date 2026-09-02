import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCodingCollections } from "@/lib/coding/queries";

export const metadata: Metadata = {
  title: "Coding 题单",
  description: "按顺序整理 RoboPrep Coding 题目的精选学习路径。",
};

export default async function CodingCollectionsPage() {
  const collections = await getCodingCollections();

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ label: "Coding", href: "/coding" }, { label: "题单" }]} />
      <div className="mt-7">
        <PageHeader
          title="Coding 题单"
          description="将相关题目从基础到进阶串联起来的精选学习路径。系统会根据你的提交自动记录进度。"
        />
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="暂时还没有题单"
          description="精选题单发布后会显示在这里。"
          className="mt-10"
        />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Card className="group hover:shadow-raised h-full transition-shadow">
                <Link
                  href={`/coding/collections/${collection.slug}`}
                  className="flex h-full flex-col"
                  aria-label={`打开：${collection.name}`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <Layers className="text-ink-tertiary size-5" aria-hidden />
                      <ArrowRight
                        className="text-ink-tertiary size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </div>
                    <CardTitle className="mt-3">{collection.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    {collection.description ? (
                      <p className="text-ink-secondary text-sm leading-relaxed">
                        {collection.description}
                      </p>
                    ) : null}
                    <div className="text-ink-tertiary mt-auto text-sm">
                      共 {collection.problemCount} 道题
                      {collection.problemCount > 0 ? (
                        <span className="text-ink-secondary">
                          {" "}
                          · 已解决 {collection.solvedCount} 道
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
