import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-ink-tertiary text-sm">
      <ol className="flex min-w-0 flex-wrap items-center gap-2">
        {items.map((item, index) => <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2"><span aria-hidden className="text-ink-tertiary">{index > 0 ? "/" : null}</span>{item.href ? <Link href={item.href} className="hover:text-ink-secondary truncate">{item.label}</Link> : <span className="text-ink-secondary truncate" aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>}</li>)}
      </ol>
    </nav>
  );
}
