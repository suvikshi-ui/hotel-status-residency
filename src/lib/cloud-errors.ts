export function isMissingSchema(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  const m = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    m.includes("schema cache") ||
    (m.includes("could not find the table") && m.includes("public."))
  );
}

export function isPermissionDenied(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  const m = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  return (
    code === "42501" ||
    m.includes("permission denied") ||
    m.includes("row-level security") ||
    m.includes("rls")
  );
}

export function isPermissionMessage(raw?: string) {
  const m = (raw ?? "").toLowerCase();
  return (
    m.includes("permission denied") ||
    m.includes("row-level security") ||
    m.includes("rls")
  );
}

/** Optional tables / prune-delete must not block Daily register Save. */
export function isSkippableSealError(error: {
  code?: string;
  message?: string;
} | null): boolean {
  return isMissingSchema(error) || isPermissionDenied(error);
}
