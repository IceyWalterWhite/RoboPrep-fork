"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
  listClassName?: string;
  "aria-label"?: string;
}

/**
 * Accessible tab strip following the WAI-ARIA tabs pattern:
 * roving tabindex plus Left/Right/Home/End keyboard navigation.
 */
export function Tabs({
  items,
  defaultValue,
  className,
  listClassName,
  "aria-label": ariaLabel = "栏目",
}: TabsProps) {
  const [active, setActive] = React.useState(
    () => defaultValue ?? items[0]?.value ?? "",
  );
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  function moveTo(nextIndex: number) {
    const count = items.length;
    if (count === 0) return;
    const index = (nextIndex + count) % count;
    setActive(items[index].value);
    tabRefs.current[index]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveTo(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveTo(index - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(items.length - 1);
        break;
      default:
        break;
    }
  }

  const activeItem = items.find((item) => item.value === active);

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          "border-line-subtle flex items-center gap-1 border-b",
          listClassName,
        )}
      >
        {items.map((item, index) => {
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`tab-${item.value}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.value}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(item.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-150",
                "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
                isActive
                  ? "border-accent text-ink"
                  : "text-ink-tertiary hover:text-ink-secondary border-transparent",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {activeItem ? (
        <div
          role="tabpanel"
          id={`tabpanel-${activeItem.value}`}
          aria-labelledby={`tab-${activeItem.value}`}
          tabIndex={0}
          className="pt-5 focus-visible:outline-none"
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}
