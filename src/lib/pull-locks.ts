import { getSupabase } from "./supabase";
import {
  lockRevFromHotel,
  locksFromHotel,
  type LockState,
} from "./register-lock";

export async function pullLockState(userId: string): Promise<LockState | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("ledger_meta")
    .select("hotel")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const hotel = (data as { hotel?: unknown }).hotel;
  const locked = locksFromHotel(hotel);
  if (locked === undefined) return null;
  return { locked, rev: lockRevFromHotel(hotel) ?? {} };
}

export async function pullLockedDates(
  userId: string,
): Promise<Record<string, true> | null> {
  const state = await pullLockState(userId);
  return state ? state.locked : null;
}
