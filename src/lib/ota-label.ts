export function otaChannelLabel(particular: string) {
  const compact = particular.trim().toUpperCase().replace(/\s+/g, "");
  if (compact.startsWith("FAB")) return "FAB";
  if (compact.startsWith("BRAVE")) return "BRAVESTAY";
  return particular.trim().toUpperCase();
}

export function otaReceivedTag(
  recs: { particular: string; kind?: string | null }[],
) {
  const seen = new Set<string>();
  for (const row of recs) {
    if (row.kind !== "ota") continue;
    const name = otaChannelLabel(row.particular);
    if (name) seen.add(name);
  }
  const first = ["FAB", "BRAVESTAY"].filter((name) => seen.has(name));
  const rest = [...seen].filter((name) => name !== "FAB" && name !== "BRAVESTAY").sort();
  const names = [...first, ...rest];
  return names.length ? ` ${names.join(", ")}` : "";
}

export function joinRecvTags(base: string, extra: string) {
  const left = base.trim();
  const right = extra.trim();
  if (left && right) return ` ${left}, ${right}`;
  if (left) return ` ${left}`;
  if (right) return ` ${right}`;
  return "";
}
