export function hashCode(code: string): string {
  const s = `status-ledger:${code.trim()}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function codeOk(stored: string, input: string): boolean {
  if (!stored) return true;
  return hashCode(input) === stored;
}
