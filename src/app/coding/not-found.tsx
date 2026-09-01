import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-content flex-col items-center justify-center px-5 text-center sm:px-8">
      <h1 className="text-ink text-xl font-semibold">Coding problem not found</h1>
      <p className="text-ink-secondary mt-2 text-sm">This problem may be unpublished or the link may be out of date.</p>
      <Link href="/coding" className="text-accent hover:text-accent-hover mt-5 text-sm font-medium">Back to coding</Link>
    </main>
  );
}
