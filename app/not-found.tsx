import Link from "next/link";

export default function NotFound() {
  return (
    <section className="rounded-lg border border-line bg-white p-8 text-center shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-muted">The page you opened does not exist in this audio review workspace.</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
      >
        Back to dashboard
      </Link>
    </section>
  );
}
