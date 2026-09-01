"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";

import { UserMenu } from "@/components/auth/user-menu";
import { GlobalSearch } from "@/components/search/global-search";
import { Modal } from "@/components/ui/modal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NavbarUser {
  email: string;
  displayName: string | null;
}

const navLinks = [
  { href: "/interviews", label: "Interview" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/coding", label: "Coding" },
  { href: "/companies", label: "Companies" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ user }: { user: NavbarUser | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // ⌘K / Ctrl+K opens the search placeholder.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="nav-surface border-line-subtle sticky top-0 z-40 border-b">
      <div className="max-w-wide mx-auto flex h-14 w-full items-center gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="text-ink text-[0.9375rem] font-semibold tracking-[-0.01em]"
        >
          RoboPrep
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-sm transition-colors duration-150",
                    isActive(pathname, link.href)
                      ? "text-ink"
                      : "text-ink-secondary hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "border-line bg-surface text-ink-tertiary hover:text-ink-secondary hidden items-center gap-2 rounded-sm border px-3 py-1.5 text-sm transition-colors sm:flex",
            )}
          >
            <Search className="size-4" aria-hidden />
            Search
            <kbd className="border-line bg-surface-muted text-ink-tertiary ml-2 rounded-[4px] border px-1.5 py-0.5 font-sans text-[0.6875rem]">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="text-ink-secondary hover:bg-surface-sunken hover:text-ink rounded-sm p-2 transition-colors sm:hidden"
          >
            <Search className="size-5" aria-hidden />
          </button>

          {user ? (
            <UserMenu email={user.email} displayName={user.displayName} />
          ) : (
            <Link
              href="/sign-in"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="text-ink-secondary hover:bg-surface-sunken hover:text-ink rounded-sm p-2 transition-colors md:hidden"
          >
            {mobileOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-line-subtle bg-surface border-t md:hidden"
        >
          <ul className="max-w-wide mx-auto flex flex-col px-5 py-2 sm:px-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-sm px-2 py-3 text-[0.9375rem]",
                    isActive(pathname, link.href)
                      ? "text-ink font-medium"
                      : "text-ink-secondary",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Search"
        description="Search across interview experiences, knowledge questions and coding tasks."
      >
        <GlobalSearch onClose={() => setSearchOpen(false)} />
      </Modal>
    </header>
  );
}
