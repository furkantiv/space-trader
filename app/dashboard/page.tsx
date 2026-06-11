import Link from "next/link";

import {
  createTradeTable,
  deleteTradeTable,
  signOut,
} from "@/app/actions/dashboard";
import { SubmitButton } from "@/app/components/submit-button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/trades";

type SearchParamValue = string | string[] | undefined;

function readSearchParam(value: SearchParamValue) {
  return typeof value === "string" ? value : "";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const params = await searchParams;
  const message = readSearchParam(params.message);
  const error = readSearchParam(params.error);

  const { data: tables, error: tablesError } = await supabase
    .from("trade_tables")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 sm:px-10 lg:px-12">
      <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Trade tables
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Signed in as {user.email ?? "unknown email"}. Each table is one
            challenge run, save, or trading ledger.
          </p>
        </div>
        <form action={signOut}>
          <SubmitButton
            pendingLabel="Signing out..."
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-rose-300/40 hover:bg-rose-300/10"
          >
            Sign out
          </SubmitButton>
        </form>
      </header>

      {message ? (
        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      {error || tablesError ? (
        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error || tablesError?.message}
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">Create trade table</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Keep separate tables for different Space Engineers runs or challenge
            phases.
          </p>

          <form action={createTradeTable} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Name
              </span>
              <input
                type="text"
                name="name"
                required
                maxLength={80}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                placeholder="Trade-only survival run"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Description
              </span>
              <textarea
                name="description"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                placeholder="Optional notes about this save, scenario, or episode range."
              />
            </label>

            <SubmitButton
              pendingLabel="Creating..."
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Create table
            </SubmitButton>
          </form>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Your tables</h2>
              <p className="mt-2 text-sm text-slate-400">
                {tables?.length ?? 0} tracked run
                {tables?.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          {tables && tables.length > 0 ? (
            <div className="mt-6 space-y-4">
              {tables.map((table) => (
                <article
                  key={table.id}
                  className="rounded-3xl border border-white/8 bg-white/5 p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {table.name}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                        {table.description?.trim() || "No description yet."}
                      </p>
                      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">
                        Updated {formatDateTime(table.updated_at)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link
                        href={`/tables/${table.id}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                      >
                        Open table
                      </Link>
                      <form action={deleteTradeTable}>
                        <input type="hidden" name="table_id" value={table.id} />
                        <SubmitButton
                          pendingLabel="Deleting..."
                          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-rose-300/40 hover:bg-rose-300/10"
                        >
                          Delete
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/12 bg-white/[0.03] p-8 text-sm text-slate-400">
              No trade tables yet. Create your first run on the left and start
              logging trades.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
