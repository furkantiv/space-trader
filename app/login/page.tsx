import Link from "next/link";
import { redirect } from "next/navigation";

import { login, signUp } from "@/app/actions/auth";
import { SubmitButton } from "@/app/components/submit-button";
import { getOptionalUser } from "@/lib/auth";

type SearchParamValue = string | string[] | undefined;

function readSearchParam(value: SearchParamValue) {
  return typeof value === "string" ? value : "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const user = await getOptionalUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error = readSearchParam(params.error);
  const message = readSearchParam(params.message);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl px-6 py-12 sm:px-10 lg:px-12">
      <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Access
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Create a private trade ledger.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Supabase Auth protects each table with row-level security, so every
            trade run stays scoped to its owner.
          </p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium text-white">What you get</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Per-user trade tables backed by Postgres + RLS</li>
              <li>BUY / SELL entry tracking with edit and delete</li>
              <li>Live item summaries, balance, and oversell warnings</li>
            </ul>
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
          >
            Back to landing page
          </Link>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold text-white">
              Register or log in
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Use email and password. If your Supabase project requires email
              confirmation, create the account first and then sign in after you
              confirm the address.
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {message}
            </div>
          ) : null}

          <form className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Email
              </span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                placeholder="captain@space-trader.app"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </span>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                autoComplete="current-password"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                placeholder="At least 6 characters"
              />
            </label>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <SubmitButton
                formAction={login}
                pendingLabel="Logging in..."
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Log in
              </SubmitButton>
              <SubmitButton
                formAction={signUp}
                pendingLabel="Creating account..."
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
              >
                Create account
              </SubmitButton>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
