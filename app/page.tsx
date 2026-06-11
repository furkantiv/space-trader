import Link from "next/link";
import { redirect } from "next/navigation";

import { getOptionalUser } from "@/lib/auth";

const highlights = [
	"Track BUY and SELL trades by episode.",
	"See live balance and per-item profit/loss.",
	"Replace the spreadsheet with a focused dashboard.",
];

export default async function HomePage() {
	const user = await getOptionalUser();

	if (user) {
		redirect("/dashboard");
	}

	return (
		<main className="relative overflow-hidden">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(48,181,208,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.14),_transparent_24%)]" />
			<section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-12">
				<div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
					<div className="max-w-3xl">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
							Space Engineers Trade Tracker
						</div>
						<h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
							A cleaner ledger for a trade-only survival run.
						</h1>
						<p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
							Build a table for each save, record every deal, and let the app
							calculate balance, remaining stock, and realized profit without
							fighting a spreadsheet.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link
								href="/login"
								className="inline-flex items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
							>
								Register or log in
							</Link>
							<Link
								href="/login"
								className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
							>
								Open the dashboard
							</Link>
						</div>
					</div>

					<div className="rounded-[2rem] border border-white/10 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur">
						<div className="rounded-[1.5rem] border border-white/8  p-5">
							<div className="mb-4 flex items-center justify-between">
								<div>
									<p className="text-xs uppercase tracking-[0.3em] text-slate-500">
										Episode 8 Snapshot
									</p>
									<p className="mt-2 text-2xl font-semibold text-white">
										Balance: -14,302,280
									</p>
								</div>
								<div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-right">
									<p className="text-[11px] uppercase tracking-[0.2em] text-amber-200">
										Warning
									</p>
									<p className="text-sm font-medium text-amber-100">
										Oversold items flagged
									</p>
								</div>
							</div>

							<div className="overflow-hidden rounded-2xl border border-white/8">
								<table className="w-full text-left text-sm">
									<thead className="bg-white/5 text-slate-400">
										<tr>
											<th className="px-4 py-3 font-medium">Type</th>
											<th className="px-4 py-3 font-medium">Item</th>
											<th className="px-4 py-3 font-medium">Amount</th>
											<th className="px-4 py-3 font-medium">Unit Price</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-white/6">
										<tr className="text-slate-200">
											<td className="px-4 py-3 text-rose-300">BUY</td>
											<td className="px-4 py-3">Motor</td>
											<td className="px-4 py-3">1,196</td>
											<td className="px-4 py-3">5,774</td>
										</tr>
										<tr className="text-slate-200">
											<td className="px-4 py-3 text-emerald-300">SELL</td>
											<td className="px-4 py-3">Interior Plate</td>
											<td className="px-4 py-3">909</td>
											<td className="px-4 py-3">585</td>
										</tr>
									</tbody>
								</table>
							</div>

							<ul className="mt-5 space-y-3">
								{highlights.map((highlight) => (
									<li
										key={highlight}
										className="flex items-start gap-3 text-sm text-slate-300"
									>
										<span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
										<span>{highlight}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
