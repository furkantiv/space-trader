import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
	deleteTradeEntry,
	saveTradeEntry,
	signOut,
} from "@/app/actions/trade-table";
import { ItemNameField } from "@/app/components/item-name-field";
import { SubmitButton } from "@/app/components/submit-button";
import { requireUser } from "@/lib/auth";
import { ITEM_GROUPS, ITEM_NAMES } from "@/lib/items";
import { createClient } from "@/lib/supabase/server";
import {
	computeEntryChange,
	createFilterQuery,
	formatCredits,
	formatDateTime,
	formatWholeNumber,
	summarizeTradeEntries,
	type TradeEntryType,
} from "@/lib/trades";

type SearchParamValue = string | string[] | undefined;

function readSearchParam(value: SearchParamValue) {
	return typeof value === "string" ? value : "";
}

function parseEpisodeFilter(value: string) {
	if (!value) {
		return "";
	}

	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed >= 0 ? String(parsed) : "";
}

function tradeTypeClasses(type: string) {
	return type === "SELL" ? "text-emerald-300" : "text-rose-300";
}

function changeClasses(value: number) {
	if (value > 0) {
		return "text-emerald-300";
	}

	if (value < 0) {
		return "text-rose-300";
	}

	return "text-slate-200";
}

export default async function TradeTablePage({
	params,
	searchParams,
}: {
	params: Promise<{ tableId: string }>;
	searchParams: Promise<Record<string, SearchParamValue>>;
}) {
	await requireUser();
	const { tableId } = await params;
	const currentSearchParams = await searchParams;
	const itemFilter = readSearchParam(currentSearchParams.item).trim();
	const episodeFilter = parseEpisodeFilter(
		readSearchParam(currentSearchParams.episode),
	);
	const editingEntryId = readSearchParam(currentSearchParams.edit);
	const error = readSearchParam(currentSearchParams.error);
	const message = readSearchParam(currentSearchParams.message);

	const supabase = await createClient();
	const [
		{ data: table, error: tableError },
		{ data: entries, error: entriesError },
	] = await Promise.all([
		supabase.from("trade_tables").select("*").eq("id", tableId).maybeSingle(),
		supabase
			.from("trade_entries")
			.select("*")
			.eq("trade_table_id", tableId)
			.order("created_at", { ascending: false }),
	]);

	if (tableError || !table) {
		notFound();
	}

	const normalizedItemFilter = itemFilter.toLowerCase();
	const filteredEntries =
		entries?.filter((entry) => {
			const matchesItem = normalizedItemFilter
				? entry.item_name.toLowerCase().includes(normalizedItemFilter)
				: true;
			const matchesEpisode = episodeFilter
				? entry.episode === Number.parseInt(episodeFilter, 10)
				: true;
			return matchesItem && matchesEpisode;
		}) ?? [];

	const selectedEntry =
		entries?.find((entry) => entry.id === editingEntryId) ?? null;
	const summaries = summarizeTradeEntries(filteredEntries);
	const itemSuggestions = Array.from(
		new Set(
			[
				...ITEM_NAMES,
				...(entries ?? []).map((entry) => entry.item_name.trim()),
			]
				.filter(Boolean)
				.sort((left, right) => left.localeCompare(right)),
		),
	);
	const lastEpisodeCookie = (await cookies()).get("last_episode")?.value ?? "";
	const entryType = (selectedEntry?.type ?? "BUY") as TradeEntryType;
	const itemName = selectedEntry?.item_name ?? itemFilter;
	const amount = selectedEntry ? String(selectedEntry.amount) : "";
	const unitPrice = selectedEntry ? String(selectedEntry.unit_price) : "";
	const episode = selectedEntry
		? String(selectedEntry.episode)
		: episodeFilter || lastEpisodeCookie;
	const note = selectedEntry?.note ?? "";
	const filterQuery = createFilterQuery({
		item: itemFilter,
		episode: episodeFilter,
	});

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-[1720px] flex-col px-6 py-6 sm:px-10 lg:px-12">
			<header className="rounded-[1.6rem] border border-white/10 bg-slate-900/80 px-5 py-2 shadow-2xl shadow-black/25 sm:px-6">
				<div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
					<div>
						<div className="flex flex-wrap items-center gap-1 text-sm text-slate-400">
							<Link
								href="/dashboard"
								className="transition hover:text-cyan-200"
							>
								Dashboard
							</Link>
							<span>/</span>
							<span>{table.name}</span>
						</div>
						<h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
							{table.name}
						</h1>
						<p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
							{table.description?.trim() || "No description for this run yet."}
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
				</div>
			</header>

			{message ? (
				<div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
					{message}
				</div>
			) : null}

			{error || entriesError ? (
				<div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
					{error || entriesError?.message}
				</div>
			) : null}

			<section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				<SummaryCard
					label={itemFilter || episodeFilter ? "Filtered balance" : "Balance"}
					value={formatCredits(summaries.balance)}
					tone={changeClasses(summaries.balance)}
				/>
				<SummaryCard
					label="Total Profit"
					value={formatCredits(summaries.totalProfit)}
					tone={changeClasses(summaries.totalProfit)}
				/>
				<SummaryCard
					label="Total buys"
					value={formatCredits(summaries.totalBuyValue)}
					tone="text-rose-300"
				/>
				<SummaryCard
					label="Total sells"
					value={formatCredits(summaries.totalSellValue)}
					tone="text-emerald-300"
				/>
				<SummaryCard
					label="Warnings"
					value={String(summaries.warningCount)}
					tone={
						summaries.warningCount > 0 ? "text-amber-300" : "text-slate-100"
					}
					description={`${filteredEntries.length} visible entries`}
				/>
			</section>

			<div className="mt-4 grid gap-8 xl:grid-cols-[1fr_2fr]">
				<section className="rounded-[2rem] border border-white/10  p-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="text-xl font-semibold text-white">
								{selectedEntry ? "Edit trade entry" : "Add trade entry"}
							</h2>
							<p className="mt-2 text-sm leading-7 text-slate-400">
								The form keeps the last used episode as a default for faster
								logging.
							</p>
						</div>
						{selectedEntry ? (
							<Link
								href={`/tables/${tableId}${filterQuery}`}
								className="text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
							>
								Cancel edit
							</Link>
						) : null}
					</div>

					<form action={saveTradeEntry} className="mt-6 grid gap-5">
						<input type="hidden" name="table_id" value={table.id} />
						<input
							type="hidden"
							name="entry_id"
							value={selectedEntry?.id ?? ""}
						/>

						<label className="block">
							<span className="mb-2 block text-sm font-medium text-slate-200">
								Type
							</span>
							<select
								name="type"
								defaultValue={entryType}
								className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/50"
							>
								<option value="BUY">BUY</option>
								<option value="SELL">SELL</option>
							</select>
						</label>

						<div className="grid gap-4 md:grid-cols-2">
							<ItemNameField
								defaultValue={itemName}
								groups={ITEM_GROUPS}
								suggestions={itemSuggestions}
							/>
							<label className="block">
								<span className="mb-2 block text-sm font-medium text-slate-200">
									Episode
								</span>
								<input
									type="number"
									name="episode"
									min={0}
									required
									defaultValue={episode}
									className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
									placeholder="8"
								/>
							</label>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<label className="block">
								<span className="mb-2 block text-sm font-medium text-slate-200">
									Amount
								</span>
								<input
									type="number"
									name="amount"
									min={1}
									required
									defaultValue={amount}
									className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
									placeholder="4471"
								/>
							</label>
							<label className="block">
								<span className="mb-2 block text-sm font-medium text-slate-200">
									Unit price
								</span>
								<input
									type="number"
									name="unit_price"
									min={0}
									step="0.01"
									required
									defaultValue={unitPrice}
									className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
									placeholder="1459"
								/>
							</label>
						</div>

						<label className="block">
							<span className="mb-2 block text-sm font-medium text-slate-200">
								Note
							</span>
							<textarea
								name="note"
								rows={4}
								defaultValue={note}
								className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
								placeholder="Optional details about the deal."
							/>
						</label>

						<SubmitButton
							pendingLabel={selectedEntry ? "Saving..." : "Adding..."}
							className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
						>
							{selectedEntry ? "Save changes" : "Add trade"}
						</SubmitButton>
					</form>
				</section>
				<section className="rounded-[2rem] border border-white/10 p-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="text-xl font-semibold text-white">
								Trade entries
							</h2>
							<p className="mt-2 text-sm text-slate-400">
								{filteredEntries.length} visible entries for this table.
							</p>
						</div>
					</div>

					<form
						action={`/tables/${tableId}`}
						className="mt-6 rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-4"
					>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">
									Filters
								</h3>
								<p className="mt-2 text-sm leading-6 text-slate-400">
									Filter the entry list and summary without leaving the trade
									form.
								</p>
							</div>
							<Link
								href={`/tables/${tableId}`}
								className="text-sm font-medium text-slate-400 transition hover:text-white"
							>
								Reset filters
							</Link>
						</div>

						<div className="mt-4 grid gap-4 md:grid-cols-2">
							<label className="block">
								<span className="mb-2 block text-sm font-medium text-slate-200">
									Item search
								</span>
								<input
									type="text"
									name="item"
									defaultValue={itemFilter}
									className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
									placeholder="Motor"
								/>
							</label>
							<label className="block">
								<span className="mb-2 block text-sm font-medium text-slate-200">
									Episode filter
								</span>
								<input
									type="number"
									name="episode"
									min={0}
									defaultValue={episodeFilter}
									className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
									placeholder="Any"
								/>
							</label>
						</div>

						<div className="mt-4">
							<button
								type="submit"
								className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
							>
								Apply filters
							</button>
						</div>
					</form>

					<div className="mt-6 overflow-x-auto rounded-3xl border border-white/8">
						<table className="min-w-full text-left text-sm">
							<thead className="bg-white/5 text-slate-400">
								<tr>
									<th className="px-4 py-3 font-medium">Type</th>
									<th className="px-4 py-3 font-medium">Item</th>
									<th className="px-4 py-3 font-medium">Amount</th>
									<th className="px-4 py-3 font-medium">Unit</th>
									<th className="px-4 py-3 font-medium">Change</th>
									<th className="px-4 py-3 font-medium">Episode</th>
									<th className="px-4 py-3 font-medium">Note</th>
									<th className="px-4 py-3 font-medium">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/6">
								{filteredEntries.length > 0 ? (
									filteredEntries.map((entry) => {
										const totalChange = computeEntryChange(entry);
										const entryQuery = createFilterQuery({
											item: itemFilter,
											episode: episodeFilter,
											edit: entry.id,
										});

										return (
											<tr key={entry.id} className="align-top text-slate-200">
												<td
													className={`px-4 py-4 font-semibold ${tradeTypeClasses(entry.type)}`}
												>
													{entry.type}
												</td>
												<td className="px-4 py-4">
													<div className="font-medium text-white">
														{entry.item_name}
													</div>
													<div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
														{formatDateTime(entry.created_at)}
													</div>
												</td>
												<td className="px-4 py-4">
													{formatWholeNumber(entry.amount)}
												</td>
												<td className="px-4 py-4">
													{formatCredits(entry.unit_price)}
												</td>
												<td
													className={`px-4 py-4 font-semibold ${changeClasses(totalChange)}`}
												>
													{formatCredits(totalChange)}
												</td>
												<td className="px-4 py-4">{entry.episode}</td>
												<td className="px-4 py-4 text-slate-400">
													{entry.note?.trim() || "-"}
												</td>
												<td className="px-4 py-4">
													<div className="flex gap-3">
														<Link
															href={`/tables/${tableId}${entryQuery}`}
															className="text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
														>
															Edit
														</Link>
														<form action={deleteTradeEntry}>
															<input
																type="hidden"
																name="table_id"
																value={tableId}
															/>
															<input
																type="hidden"
																name="entry_id"
																value={entry.id}
															/>
															<SubmitButton
																pendingLabel="Deleting..."
																className="text-sm font-medium text-rose-200 transition hover:text-rose-100"
															>
																Delete
															</SubmitButton>
														</form>
													</div>
												</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td
											colSpan={8}
											className="px-4 py-8 text-center text-slate-400"
										>
											No trades match the current filters yet.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</section>
			</div>

			<div className="mt-4 ">
				<section className="rounded-[2rem] border border-cyan-300/10  p-7 shadow-2xl shadow-cyan-950/20">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
						<div>
							<h2 className="text-2xl font-semibold text-white">
								Item summary
							</h2>
							<p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
								Uses the average cost method for realized profit and flags items
								where total sold amount exceeds total bought amount.
							</p>
						</div>
						<div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/6 px-4 py-3 text-sm text-slate-300">
							<div className="font-medium text-white">
								{summaries.items.length} summarized item
								{summaries.items.length === 1 ? "" : "s"}
							</div>
							<div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
								Screenshot-ready layout
							</div>
						</div>
					</div>

					<p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
						Averaged buy cost / realized sell performance
					</p>

					<div className="mt-6 overflow-x-auto rounded-[1.8rem] border border-white/8 bg-slate-950/75">
						<table className="min-w-full text-left text-sm">
							<thead className="bg-white/6 text-slate-300">
								<tr>
									<th className="px-5 py-4 font-medium">Item</th>
									<th className="px-5 py-4 font-medium">Bought</th>
									<th className="px-5 py-4 font-medium">Bought Value</th>
									<th className="px-5 py-4 font-medium">Sold</th>
									<th className="px-5 py-4 font-medium">Sold Value</th>
									<th className="px-5 py-4 font-medium">Remaining</th>
									<th className="px-5 py-4 font-medium">Avg Buy</th>
									<th className="px-5 py-4 font-medium">Avg Sell</th>
									<th className="px-5 py-4 font-medium">Profit</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/6">
								{summaries.items.length > 0 ? (
									summaries.items.map((item) => (
										<tr
											key={item.itemName}
											className="align-top text-slate-200"
										>
											<td className="px-5 py-5">
												<div className="text-base font-semibold text-white">
													{item.itemName}
												</div>
												{item.warning ? (
													<div className="mt-3 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
														Sold more than bought
													</div>
												) : (
													<div className="mt-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
														Inventory stable
													</div>
												)}
											</td>
											<td className="px-5 py-5 text-base">
												{formatWholeNumber(item.totalBoughtAmount)}
											</td>
											<td className="px-5 py-5 text-base text-slate-300">
												{formatCredits(item.totalBoughtValue)}
											</td>
											<td className="px-5 py-5 text-base">
												{formatWholeNumber(item.totalSoldAmount)}
											</td>
											<td className="px-5 py-5 text-base text-slate-300">
												{formatCredits(item.totalSoldValue)}
											</td>
											<td
												className={`px-5 py-5 text-base font-semibold ${
													item.remainingAmount < 0
														? "text-amber-300"
														: "text-slate-100"
												}`}
											>
												{formatWholeNumber(item.remainingAmount)}
											</td>
											<td className="px-5 py-5 text-base text-slate-300">
												{formatCredits(item.averageBuyPrice)}
											</td>
											<td className="px-5 py-5 text-base text-slate-300">
												{formatCredits(item.averageSellPrice)}
											</td>
											<td
												className={`px-5 py-5 text-base font-semibold ${changeClasses(
													item.realizedProfitLoss,
												)}`}
											>
												{formatCredits(item.realizedProfitLoss)}
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan={9}
											className="px-5 py-10 text-center text-slate-400"
										>
											Item summaries will appear once this table has trades.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</main>
	);
}

function SummaryCard({
	label,
	value,
	tone,
	description,
}: {
	label: string;
	value: string;
	tone: string;
	description?: string;
}) {
	return (
		<article className="rounded-[1.6rem] border border-white/10 bg-slate-950/70 p-4">
			<p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
				{label}
			</p>
			<p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
			{description ? (
				<p className="mt-1 text-sm text-slate-400">{description}</p>
			) : null}
		</article>
	);
}
