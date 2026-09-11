export interface InventoryItem {
  id: string;
  name: string;
  lastMonth: number;
  thisMonth: number;
  expected: number;
}

export type InventoryCheck =
  | { kind: "even" }
  | { kind: "take-out"; qty: number }
  | { kind: "replace"; qty: number };

type RawInventory = {
  id?: string;
  name?: string;
  lastMonth?: unknown;
  thisMonth?: unknown;
  expected?: unknown;
  opening?: unknown;
  received?: unknown;
  issued?: unknown;
};

export const LINEN_CATALOG: { id: string; name: string }[] = [
  { id: "inv-single-sheet", name: "Single bed sheet" },
  { id: "inv-double-sheet", name: "Double bed sheet" },
  { id: "inv-pillow-cover", name: "Pillow cover" },
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

function fieldsFrom(row: RawInventory | undefined): Pick<
  InventoryItem,
  "lastMonth" | "thisMonth" | "expected"
> {
  if (!row) return { lastMonth: 0, thisMonth: 0, expected: 0 };
  const lastMonth = row.lastMonth ?? row.opening;
  const thisMonth =
    row.thisMonth ??
    (row.opening != null || row.received != null || row.issued != null
      ? qty(row.opening) + qty(row.received) - qty(row.issued)
      : 0);
  return {
    lastMonth: qty(lastMonth),
    thisMonth: qty(thisMonth),
    expected: qty(row.expected),
  };
}

export function emptyInventoryItem(
  id: string,
  name: string,
): InventoryItem {
  return { id, name, lastMonth: 0, thisMonth: 0, expected: 0 };
}

export function inventoryDifference(
  item: Pick<InventoryItem, "lastMonth" | "thisMonth">,
) {
  return item.thisMonth - item.lastMonth;
}

export function signedCount(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return "0";
}

export function inventoryCheck(
  item: Pick<InventoryItem, "thisMonth" | "expected">,
): InventoryCheck {
  const gap = item.thisMonth - item.expected;
  if (gap === 0) return { kind: "even" };
  if (gap > 0) return { kind: "take-out", qty: gap };
  return { kind: "replace", qty: -gap };
}

export function inventoryCheckLabel(check: InventoryCheck): string {
  if (check.kind === "even") return "बराबर है";
  if (check.kind === "take-out") return `${check.qty} बाहर निकालना पड़ेगा`;
  return `${check.qty} रिप्लेस करना पड़ेगा`;
}

export function seedInventory(): InventoryItem[] {
  return LINEN_CATALOG.map((row) => emptyInventoryItem(row.id, row.name));
}

export function normalizeInventory(
  rows: RawInventory[] | undefined | null,
): InventoryItem[] {
  const incoming = Array.isArray(rows) ? rows : [];
  const byId = new Map(incoming.map((r) => [r.id ?? "", r]));
  const byName = new Map(
    incoming.map((r) => [(r.name ?? "").trim().toLowerCase(), r]),
  );
  const out: InventoryItem[] = [];
  const seen = new Set<string>();
  for (const cat of LINEN_CATALOG) {
    const hit = byId.get(cat.id) ?? byName.get(cat.name.toLowerCase());
    out.push({
      id: cat.id,
      name: cat.name,
      ...fieldsFrom(hit),
    });
    seen.add(cat.id);
    if (hit?.id) seen.add(hit.id);
    seen.add(cat.name.toLowerCase());
  }
  for (const row of incoming) {
    const name = (row.name ?? "").trim();
    const nameKey = name.toLowerCase();
    const id = row.id ?? "";
    if (!nameKey || seen.has(id) || seen.has(nameKey)) continue;
    seen.add(id);
    seen.add(nameKey);
    out.push({
      id: id || `inv-${nameKey.replace(/\s+/g, "-")}`,
      name,
      ...fieldsFrom(row),
    });
  }
  return out;
}
