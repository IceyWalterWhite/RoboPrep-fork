import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

/**
 * Week 8 Task 18: production robots policy. Public content is crawlable;
 * admin, API, and private submission pages are not. Preview deployments
 * should set FLAG_ROBOTS_INDEX=off (or robots meta) to noindex everything.
 */
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const allowIndexing = process.env.FLAG_ROBOTS_INDEX !== "off";

  if (!allowIndexing) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/interviews/submissions/", "/settings", "/onboarding", "/auth/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
