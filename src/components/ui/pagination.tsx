import Link from "next/link";

import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  makeHref,
  label = "分页",
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);
  return (
    <nav aria-label={label} className="flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={makeHref(page - 1)}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          上一页
        </Link>
      ) : null}
      <ol className="flex items-center gap-1" aria-label="页码">
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <li
              key={`ellipsis-${index}`}
              aria-hidden
              className="text-ink-tertiary px-2"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={makeHref(item)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  buttonVariants({
                    variant: item === page ? "primary" : "ghost",
                    size: "sm",
                  }),
                  "min-w-8",
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>
      {page < totalPages ? (
        <Link
          href={makeHref(page + 1)}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          下一页
        </Link>
      ) : null}
    </nav>
  );
}

function pageWindow(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const ordered = [...pages]
    .filter((value) => value > 0 && value <= totalPages)
    .sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  for (const value of ordered) {
    if (
      result.length > 0 &&
      typeof result[result.length - 1] === "number" &&
      value - Number(result[result.length - 1]) > 1
    ) {
      result.push("ellipsis");
    }
    result.push(value);
  }
  return result;
}
