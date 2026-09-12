/**
 * Hotel Status Residency — Supabase Auth
 *
 * Dashboard → Settings → General → Reference ID  → project id
 * Dashboard → Settings → API → publishable / anon key
 *
 * URL is always https://<project-id>.supabase.co
 */
const env = (key: string) => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof value === "string" ? value.trim() : "";
};

/** Project ref. Fill this if it was not injected as VITE_SUPABASE_PROJECT_ID. */
export const SUPABASE_PROJECT_ID =
  env("VITE_SUPABASE_PROJECT_ID") || "pptxeqcjecnwppftvjhc";

/** Publishable (anon) key — browser-safe. */
export const SUPABASE_PUBLISHABLE_KEY =
  env("VITE_SUPABASE_ANON_KEY") ||
  env("VITE_SUPABASE_PUBLISHABLE_KEY") ||
  "sb_publishable_BFw-cgR_HVOBK8xnEY3jYw_3ee7N-v1";

export const SUPABASE_URL =
  env("VITE_SUPABASE_URL") ||
  (SUPABASE_PROJECT_ID ? `https://${SUPABASE_PROJECT_ID}.supabase.co` : "");

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export const SUPABASE_SQL_EDITOR = SUPABASE_PROJECT_ID
  ? `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`
  : "https://supabase.com/dashboard";

export const SUPABASE_TABLE_EDITOR = SUPABASE_PROJECT_ID
  ? `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/editor`
  : "https://supabase.com/dashboard";
