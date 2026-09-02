import type { Metadata } from "next";

import { env } from "@/lib/env";

/**
 * Week 8 Tasks 16, 17, 20: unified metadata builder with canonical URLs and
 * Open Graph/Twitter tags derived from real page data. No fabricated claims.
 */

export function buildMetadata(input: {
  title: string;
  description: string;
  /** Canonical path without origin, e.g. "/interviews/bytedance-x". */
  path: string;
  /** Set false for pages that must not be indexed (admin, status pages). */
  index?: boolean;
}): Metadata {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const url = `${base}${input.path}`;
  const index = input.index ?? true;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: "RoboPrep",
      type: "website",
      images: [
        {
          url: `${base}/og.png`,
          width: 1200,
          height: 630,
          alt: "RoboPrep — 具身智能面试准备",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    },
    ...(index ? {} : { robots: { index: false, follow: false } }),
  };
}
