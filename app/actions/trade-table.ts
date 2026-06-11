"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function redirectToTable(
  tableId: string,
  type: "message" | "error",
  message: string,
): never {
  redirect(`/tables/${tableId}?${type}=${encodeURIComponent(message)}`);
}

function parsePositiveInteger(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseNonNegativeInteger(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseMoney(value: FormDataEntryValue | null) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function saveTradeEntry(formData: FormData) {
  const user = await requireUser();
  const tableId = String(formData.get("table_id") ?? "");
  const entryId = String(formData.get("entry_id") ?? "");
  const type = String(formData.get("type") ?? "");
  const itemName = String(formData.get("item_name") ?? "").trim();
  const amount = parsePositiveInteger(formData.get("amount"));
  const unitPrice = parseMoney(formData.get("unit_price"));
  const episode = parseNonNegativeInteger(formData.get("episode"));
  const note = String(formData.get("note") ?? "").trim();

  if (!tableId) {
    redirect("/dashboard?error=Missing%20trade%20table.");
  }

  if (!["BUY", "SELL"].includes(type)) {
    redirectToTable(tableId, "error", "Trade type must be BUY or SELL.");
  }

  if (!itemName || amount === null || unitPrice === null || episode === null) {
    redirectToTable(
      tableId,
      "error",
      "Item name, amount, unit price, and episode are required.",
    );
  }

  const supabase = await createClient();
  const safeType = type as "BUY" | "SELL";
  const payload = {
    trade_table_id: tableId,
    user_id: user.id,
    type: safeType,
    item_name: itemName,
    amount,
    unit_price: unitPrice,
    episode,
    note: note || null,
  };

  const result = entryId
    ? await supabase
        .from("trade_entries")
        .update(payload)
        .eq("id", entryId)
        .eq("user_id", user.id)
    : await supabase.from("trade_entries").insert(payload);

  if (result.error) {
    redirectToTable(tableId, "error", result.error.message);
  }

  const cookieStore = await cookies();
  cookieStore.set("last_episode", String(episode), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: true,
  });

  revalidatePath(`/tables/${tableId}`);
  redirectToTable(
    tableId,
    "message",
    entryId ? "Trade entry updated." : "Trade entry added.",
  );
}

export async function deleteTradeEntry(formData: FormData) {
  const user = await requireUser();
  const tableId = String(formData.get("table_id") ?? "");
  const entryId = String(formData.get("entry_id") ?? "");

  if (!tableId || !entryId) {
    redirect("/dashboard?error=Missing%20trade%20entry.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trade_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) {
    redirectToTable(tableId, "error", error.message);
  }

  revalidatePath(`/tables/${tableId}`);
  redirectToTable(tableId, "message", "Trade entry deleted.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?message=Signed%20out.");
}
