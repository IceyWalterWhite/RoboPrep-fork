import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

/** Shared loading shell used by the `loading.tsx` files of each feature route. */
export function PageSkeleton() {
  return (
    <Container className="py-14">
      <div className="border-line-subtle flex flex-col gap-3 border-b pb-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="border-line-subtle bg-surface rounded-md border p-6"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
        ))}
      </div>
    </Container>
  );
}
