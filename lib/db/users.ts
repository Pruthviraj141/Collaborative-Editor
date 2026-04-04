import type { ProfileRecord } from "@/types/document";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getProfile(client: ReturnType<typeof getSupabaseServerClient>, id: string) {
  const { data, error } = await client.from("profiles").select("*").eq("id", id).single();

  if (error && error.code !== "PGRST116") {
    throw new Error("Unable to fetch profile");
  }

  return (data ?? null) as ProfileRecord | null;
}