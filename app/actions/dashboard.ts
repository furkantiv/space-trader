"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function redirectDashboardError(message: string) {
  redirect(`/dashboard?error=${encodeURIComponent(message)}`);
}

export async function createTradeTable(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    redirectDashboardError("Table name is required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("trade_tables").insert({
    user_id: user.id,
    name,
    description: description || null,
  });

  if (error) {
    redirectDashboardError(error.message);
  }

  revalidatePath("/dashboard");
  redirect(
    `/dashboard?message=${encodeURIComponent("Trade table created.")}`,
  );
}

export async function deleteTradeTable(formData: FormData) {
  const user = await requireUser();
  const tableId = String(formData.get("table_id") ?? "");

  if (!tableId) {
    redirectDashboardError("Table id is missing.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trade_tables")
    .delete()
    .eq("id", tableId)
    .eq("user_id", user.id);

  if (error) {
    redirectDashboardError(error.message);
  }

  revalidatePath("/dashboard");
  redirect(
    `/dashboard?message=${encodeURIComponent("Trade table deleted.")}`,
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?message=Signed%20out.");
}
