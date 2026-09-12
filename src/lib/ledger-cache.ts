export const LEDGER_CACHE_PREFIXES = [
  "status-ledger-",
  "status-register-locks",
] as const;

export function isLedgerCacheKey(key: string) {
  return LEDGER_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Drop this browser's old register copy so login always shows the account books. */
export function clearLocalLedgerCache() {
  if (typeof localStorage === "undefined") return 0;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isLedgerCacheKey(key)) keys.push(key);
  }
  for (const key of keys) localStorage.removeItem(key);
  return keys.length;
}
