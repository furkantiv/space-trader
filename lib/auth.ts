import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthUser = {
  email: string | null;
  id: string;
};

export async function getOptionalUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub || typeof data.claims.sub !== "string") {
    return null;
  }

  const claims = data.claims;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

export async function requireUser() {
  const user = await getOptionalUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
