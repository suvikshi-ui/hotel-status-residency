/**
 * Completely offline. The live site does not sign in and does not call Supabase.
 * Keys stay empty so a build cannot open the old project by accident.
 */
export const SUPABASE_PROJECT_ID = "";

export const SUPABASE_PUBLISHABLE_KEY = "";

export const SUPABASE_URL = "";

export const OFFLINE_BOOKS = true;

export function isSupabaseConfigured() {
  return false;
}

export const SUPABASE_SQL_EDITOR = "https://supabase.com/dashboard";

export const DESK_SAVE_SQL_FILE =
  "https://github.com/suvikshi-ui/hotel-status-residency/blob/main/supabase/migrations/0009_desk_can_save.sql";

export const SUPABASE_TABLE_EDITOR = "https://supabase.com/dashboard";
