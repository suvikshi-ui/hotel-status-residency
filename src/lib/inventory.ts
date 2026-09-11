export interface InventoryItem {
  id: string;
  name: string;
  opening: number;
  received: number;
  issued: number;
  laundry: number;
}

export const LINEN_CATALOG: { id: string; name: string }[] = [
  { id: "inv-single-sheet", name: "Single bed sheet" },
  { id: "inv-double-sheet", name: "Double bed sheet" },
  { id: "inv-towel", name: "Towel" },
  { id: "inv-single-duvet", name: "Single duvet" },
  { id: "inv-double-duvet", name: "Double duvet" },
  { id: "inv-hand-towel", name: "Hand towel" },
];

function qty(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.round(v);
}

export function inventoryClosing(item: Pick<InventoryItem, "opening" | "received" | "issued">) {
  return item.opening + item.received - item.issued;
}

export function seedInventory(): InventoryItem[] {
  return LINEN_CATALOG.map((row) => ({
    ...row,
    opening: 0,
    received: 0,
    issued: 0,
    laundry: 0,
  }));
}

export function normalizeInventory(rows: InventoryItem[] | undefined | null): InventoryItem[] {
  const incoming = Array.isArray(rows) ? rows : [];
  const byId = new Map(incoming.map((r) => [r.id, r]));
  const byName = new Map(
    incoming.map((r) => [r.name.trim().toLowerCase(), r]),
  );
  const out: InventoryItem[] = [];
  const seen = new Set<string>();
  for (const cat of LINEN_CATALOG) {
    const hit = byId.get(cat.id) ?? byName.get(cat.name.toLowerCase());
    out.push({
      id: cat.id,
      name: cat.name,
      opening: qty(hit?.opening),
      received: qty(hit?.received),
      issued: qty(hit?.issued),
      laundry: qty(hit?.laundry),
    });
    seen.add(cat.id);
    if (hit?.id) seen.add(hit.id);
    seen.add(cat.name.toLowerCase());
  }
  for (const row of incoming) {
    const nameKey = row.name.trim().toLowerCase();
    if (!nameKey || seen.has(row.id) || seen.has(nameKey)) continue;
    seen.add(row.id);
    seen.add(nameKey);
    out.push({
      id: row.id || `inv-${nameKey.replace(/\s+/g, "-")}`,
      name: row.name.trim(),
      opening: qty(row.opening),
      received: qty(row.received),
      issued: qty(row.issued),
      laundry: qty(row.laundry),
    });
  }
  return out;
}
