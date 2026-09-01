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
  title: "Coding collections",
  description: "Curated, ordered learning paths through RoboPrep's coding problems.",
};

export default async function CodingCollectionsPage() {
  const collections = await getCodingCollections();

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ label: "Coding", href: "/coding" }, { label: "Collections" }]} />
      <div className="mt-7">
        <PageHeader
          title="Coding collections"
          description="Curated learning paths that sequence related problems from foundations to advanced. Progress is tracked automatically from your submissions."
        />
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No collections yet"
          description="Curated collections will appear here as they are published."
          className="mt-10"
        />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Card className="group h-full transition-shadow hover:shadow-raised">
                <Link
                  href={`/coding/collections/${collection.slug}`}
                  className="flex h-full flex-col"
                  aria-label={`Open ${collection.name}`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <Layers className="text-ink-tertiary size-5" aria-hidden />
                      <ArrowRight className="text-ink-tertiary size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </div>
                    <CardTitle className="mt-3">{collection.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    {collection.description ? (
                      <p className="text-ink-secondary text-sm leading-relaxed">{collection.description}</p>
                    ) : null}
                    <div className="text-ink-tertiary mt-auto text-sm">
                      {collection.problemCount} problem{collection.problemCount === 1 ? "" : "s"}
                      {collection.problemCount > 0 ? (
                        <span className="text-ink-secondary"> · {collection.solvedCount} solved</span>
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
