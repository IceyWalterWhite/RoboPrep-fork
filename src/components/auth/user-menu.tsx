"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function initialsFor(email: string, displayName?: string | null): string {
  const source = displayName?.trim() || email.split("@")[0] || "?";
  return source.slice(0, 2).toUpperCase();
}

export interface UserMenuProps {
  email: string;
  displayName?: string | null;
}

export function UserMenu({ email, displayName }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    setSigningOut(false);
    router.replace("/");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "bg-accent-soft text-accent flex size-8 items-center justify-center rounded-full text-xs font-semibold",
          "hover:bg-accent/15 transition-colors",
          "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2",
        )}
        aria-label={`${displayName ?? email} 的账户菜单`}
      >
        {initialsFor(email, displayName)}
      </button>

      {open ? (
        <div
          role="menu"
          className="border-line-subtle bg-surface shadow-raised absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-md border"
        >
          <div className="border-line-subtle border-b px-4 py-3">
            {displayName ? (
              <p className="text-ink truncate text-sm font-medium">{displayName}</p>
            ) : null}
            <p className="text-ink-tertiary truncate text-xs">{email}</p>
          </div>

          <div className="p-1">
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              disabled={signingOut}
              className="text-ink-secondary hover:bg-surface-muted hover:text-ink flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors disabled:opacity-60"
            >
              <LogOut className="size-4" aria-hidden />
              {signingOut ? "退出中…" : "退出登录"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
