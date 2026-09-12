import { getSupabase } from "./supabase";
import { locksFromHotel } from "./register-lock";

export async function pullLockedDates(
  userId: string,
): Promise<Record<string, true> | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("ledger_meta")
    .select("hotel")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const locks = locksFromHotel((data as { hotel?: unknown }).hotel);
  if (locks === undefined) return null;
  return locks;
}
