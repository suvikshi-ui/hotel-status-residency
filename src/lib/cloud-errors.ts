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

/** sheet_seals is optional — hotel json `_sealedIds` is enough. */
export function isSkippableSealError(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  if (isMissingSchema(error)) return true;
  const m = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  return (
    code === "42501" ||
    m.includes("permission denied") ||
    m.includes("row-level security") ||
    m.includes("rls")
  );
}
