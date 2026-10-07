import { AudioLines, LockKeyhole } from "lucide-react";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/10 text-accent">
            <AudioLines className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Audio Review</h1>
            <p className="text-sm text-muted">Sign in to continue.</p>
          </div>
        </div>

        <form action="/api/login" method="post" className="space-y-5">
          <input type="hidden" name="next" value={params?.next ?? "/"} />

          <label className="block">
            <span className="text-sm font-medium text-ink">Username</span>
            <input
              className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              name="username"
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Password</span>
            <input
              className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {error === "invalid" ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Incorrect username or password.
            </p>
          ) : null}

          {error === "config" ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Login is not configured. Add AUTH_USERNAME, AUTH_PASSWORD, and AUTH_SECRET.
            </p>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <LockKeyhole className="h-4 w-4" />
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
