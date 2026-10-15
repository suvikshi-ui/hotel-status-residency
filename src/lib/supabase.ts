import type { SupabaseClient } from "@supabase/supabase-js";

export function getSupabase(): SupabaseClient {
  throw new Error("Supabase project is not connected");
}
