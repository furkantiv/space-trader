"use client";

import Link from "next/link";

import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const isConfigurationError = error.name === "MissingSupabaseEnvError";

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-white">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12 sm:px-10">
          <section className="w-full rounded-[2rem] border border-white/10 bg-slate-900/85 p-8 shadow-2xl shadow-black/30">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
              Space Engineers Trade Tracker
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              {isConfigurationError ? "Supabase setup is incomplete" : "Something went wrong"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {isConfigurationError
                ? "This deployment is missing the required Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy."
                : "The app hit an unexpected runtime error. Retry the request, and if it keeps failing, inspect the server logs for this deployment."}
            </p>
            {error.digest ? (
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                Error digest: {error.digest}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => unstable_retry()}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
              >
                Back to home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
