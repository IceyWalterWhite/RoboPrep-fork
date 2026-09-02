"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchHit {
  title: string;
  subtitle: string | null;
  href: string;
  group: string;
}

interface GroupedResults {
  query: string;
  groups: Array<{ group: string; label: string; hits: SearchHit[] }>;
  total: number;
}

/**
 * Week 8 Task 25: ⌘K global search panel. Grouped results, keyboard
 * navigation (↑/↓/Enter/Escape), mobile friendly, graceful empty/error
 * states (Task 28). No raw DB errors surface.
 */
export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GroupedResults | null>(null);
  const [status, setStatus] = React.useState<"idle" | "error">("idle");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      debounceRef.current = setTimeout(() => {
        setResults(null);
        setStatus("idle");
      }, 0);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as GroupedResults;
        setResults(data);
        setStatus("idle");
      } catch {
        setStatus("error");
        setResults(null);
      }
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce effect keyed on query
  }, [query]);

  // Derived: a request is in flight when the typed query has no results yet.
  const busy =
    query.trim().length >= 2 &&
    status !== "error" &&
    (results === null || results.query !== query.trim());

  const flatHits: SearchHit[] = React.useMemo(
    () => results?.groups.flatMap((group) => group.hits) ?? [],
    [results],
  );

  function go(hit: SearchHit) {
    onClose();
    router.push(hit.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatHits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && flatHits[activeIndex]) {
      event.preventDefault();
      go(flatHits[activeIndex]);
    }
  }

  const globalIndexByHref = new Map<string, number>();
  flatHits.forEach((hit, index) => {
    if (!globalIndexByHref.has(hit.href)) globalIndexByHref.set(hit.href, index);
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="text-ink-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="搜索问题、面试、Coding 和公司…"
          aria-label="全局搜索"
          className="pl-9"
          role="combobox"
          aria-expanded={flatHits.length > 0}
          aria-controls="global-search-results"
        />
      </div>

      {busy && (
        <p className="text-ink-tertiary flex items-center gap-2 text-sm" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden /> 搜索中…
        </p>
      )}

      {status === "error" && (
        <p className="text-ink-secondary text-sm" role="status">
          搜索暂时不可用，请稍后再试。
        </p>
      )}

      {status === "idle" &&
        query.trim().length >= 2 &&
        results &&
        results.total === 0 && (
          <p className="text-ink-secondary text-sm" role="status">
            没有找到“{results.query}”的结果。可以尝试更短的关键词，或浏览{" "}
            <Link href="/knowledge" className="text-accent hover:underline">
              知识库
            </Link>
            、{" "}
            <Link href="/interviews" className="text-accent hover:underline">
              面试
            </Link>
            、{" "}
            <Link href="/coding" className="text-accent hover:underline">
              Coding
            </Link>{" "}
            或{" "}
            <Link href="/companies" className="text-accent hover:underline">
              公司
            </Link>
            。
          </p>
        )}

      {results && results.groups.length > 0 && (
        <div
          id="global-search-results"
          role="listbox"
          aria-label="搜索结果"
          className="flex flex-col gap-4"
        >
          {results.groups.map((group) => (
            <div key={group.group}>
              <h3 className="text-ink-tertiary text-xs font-semibold tracking-wide uppercase">
                {group.label}
              </h3>
              <ul className="mt-1 flex flex-col">
                {group.hits.map((hit) => {
                  const active = globalIndexByHref.get(hit.href) === activeIndex;
                  return (
                    <li key={hit.href}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => go(hit)}
                        className={cn(
                          "w-full rounded-sm px-2 py-1.5 text-left transition-colors",
                          active ? "bg-surface-sunken" : "hover:bg-surface-sunken",
                        )}
                      >
                        <span className="text-ink block truncate text-sm font-medium">
                          {hit.title}
                        </span>
                        {hit.subtitle && (
                          <span className="text-ink-tertiary block truncate text-xs">
                            {hit.subtitle}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {query.trim().length < 2 && (
        <p className="text-ink-tertiary text-sm">
          至少输入两个字符。结果覆盖知识库、面试、Coding、公司和主题。
        </p>
      )}
    </div>
  );
}
