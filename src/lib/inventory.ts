export interface InventoryItem {
  id: string;
  name: string;
  lastMonth: number;
  thisMonth: number;
  notes: string;
}

type RawInventory = {
  id?: string;
  name?: string;
  lastMonth?: unknown;
  thisMonth?: unknown;
  notes?: unknown;
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

function notesOf(row: RawInventory | undefined): string {
  const n = row?.notes;
  return typeof n === "string" ? n.trim() : "";
}

function fieldsFrom(row: RawInventory | undefined): Pick<
  InventoryItem,
  "lastMonth" | "thisMonth" | "notes"
> {
  if (!row) return { lastMonth: 0, thisMonth: 0, notes: "" };
  const lastMonth = row.lastMonth ?? row.opening;
  const thisMonth =
    row.thisMonth ??
    (row.opening != null || row.received != null || row.issued != null
      ? qty(row.opening) + qty(row.received) - qty(row.issued)
      : 0);
  return {
    lastMonth: qty(lastMonth),
    thisMonth: qty(thisMonth),
    notes: notesOf(row),
  };
}

export function emptyInventoryItem(
  id: string,
  name: string,
): InventoryItem {
  return { id, name, lastMonth: 0, thisMonth: 0, notes: "" };
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

export const FILE_PREFIX = "ifile:";

export type InventoryBook = "linen" | "ws" | "kitchen";

export interface InventoryFile {
  id: string;
  kind: InventoryBook;
  period: string;
  createdAt: string;
  lines: InventoryItem[];
}

export const KITCHEN_CATALOG: { id: string; name: string }[] = [
  { id: "kit-rice", name: "Rice" },
  { id: "kit-atta", name: "Atta" },
  { id: "kit-oil", name: "Oil" },
  { id: "kit-dal", name: "Dal" },
  { id: "kit-sugar", name: "Sugar" },
  { id: "kit-tea", name: "Tea" },
  { id: "kit-milk", name: "Milk" },
  { id: "kit-masala", name: "Masala" },
];

export const WS_CATALOG: { id: string; name: string }[] = [];

export function inventoryPeriod(kind: InventoryBook, date: string) {
  return kind === "ws" ? date.slice(0, 10) : date.slice(0, 7);
}

export function inventoryFileId(kind: InventoryBook, period: string) {
  return `${FILE_PREFIX}${kind}:${period}`;
}

export function isInventoryFileId(id: string) {
  return id.startsWith(FILE_PREFIX);
}

export function seedBook(kind: InventoryBook): InventoryItem[] {
  if (kind === "kitchen") {
    return KITCHEN_CATALOG.map((row) => emptyInventoryItem(row.id, row.name));
  }
  if (kind === "ws") {
    return WS_CATALOG.map((row) => emptyInventoryItem(row.id, row.name));
  }
  return seedInventory();
}

export function carryForward(
  previous: InventoryItem[] | undefined,
  seed: InventoryItem[],
): InventoryItem[] {
  const byName = new Map(
    (previous ?? []).map((row) => [row.name.trim().toLowerCase(), row]),
  );
  const seen = new Set<string>();
  const out = seed.map((row) => {
    seen.add(row.name.trim().toLowerCase());
    const hit = byName.get(row.name.trim().toLowerCase());
    if (!hit) return { ...row, lastMonth: 0, thisMonth: 0, notes: "" };
    return {
      ...row,
      lastMonth: hit.thisMonth,
      thisMonth: 0,
      notes: "",
    };
  });
  for (const row of previous ?? []) {
    const key = row.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...row,
      lastMonth: row.thisMonth,
      thisMonth: 0,
      notes: "",
    });
  }
  return out;
}

export function encodeInventoryFile(file: InventoryFile): InventoryItem {
  return {
    id: file.id,
    name: file.kind,
    lastMonth: 0,
    thisMonth: file.lines.length,
    notes: JSON.stringify({
      v: 1,
      kind: file.kind,
      period: file.period,
      createdAt: file.createdAt,
      lines: file.lines,
    }),
  };
}

export function decodeInventoryFile(row: {
  id?: string;
  notes?: string;
}): InventoryFile | null {
  const id = row.id ?? "";
  if (!isInventoryFileId(id)) return null;
  try {
    const parsed = JSON.parse(row.notes ?? "") as {
      kind?: string;
      period?: string;
      createdAt?: string;
      lines?: RawInventory[];
    };
    const kind =
      parsed.kind === "ws" || parsed.kind === "kitchen" || parsed.kind === "linen"
        ? parsed.kind
        : id.includes(":ws:")
          ? "ws"
          : id.includes(":kitchen:")
            ? "kitchen"
            : "linen";
    const period = (parsed.period || id.split(":").slice(2).join(":")).slice(0, 10);
    if (!period) return null;
    return {
      id,
      kind,
      period: kind === "ws" ? period.slice(0, 10) : period.slice(0, 7),
      createdAt: (parsed.createdAt || period).slice(0, 10),
      lines:
        kind === "linen"
          ? normalizeInventory(parsed.lines)
          : (parsed.lines ?? [])
              .map((line) => ({
                id: line.id || uidSafe(line.name),
                name: (line.name ?? "").trim(),
                ...fieldsFrom(line),
              }))
              .filter((line) => line.name),
    };
  } catch {
    return null;
  }
}

function uidSafe(name: unknown) {
  const text = typeof name === "string" ? name : "item";
  return `inv-${text.trim().toLowerCase().replace(/\s+/g, "-") || "item"}`;
}

export function splitInventoryRows(rows: RawInventory[] | undefined | null) {
  const items: RawInventory[] = [];
  const files: InventoryFile[] = [];
  for (const row of rows ?? []) {
    const file = decodeInventoryFile({
      id: row.id,
      notes: typeof row.notes === "string" ? row.notes : "",
    });
    if (file) files.push(file);
    else if (!isInventoryFileId(row.id ?? "")) items.push(row);
  }
  return { items, files };
}

export function normalizeInventoryFiles(rows: InventoryFile[] | undefined | null) {
  const out: InventoryFile[] = [];
  const seen = new Set<string>();
  for (const row of rows ?? []) {
    if (!row?.id || seen.has(row.id)) continue;
    if (row.kind !== "linen" && row.kind !== "ws" && row.kind !== "kitchen") continue;
    const period = row.kind === "ws" ? row.period.slice(0, 10) : row.period.slice(0, 7);
    if (!period) continue;
    seen.add(row.id);
    out.push({
      id: row.id,
      kind: row.kind,
      period,
      createdAt: (row.createdAt || period).slice(0, 10),
      lines:
        row.kind === "linen"
          ? normalizeInventory(row.lines)
          : (row.lines ?? [])
              .filter((line) => line && line.name?.trim())
              .map((line) => ({
                id: line.id || uidSafe(line.name),
                name: line.name.trim(),
                lastMonth: qty(line.lastMonth),
                thisMonth: qty(line.thisMonth),
                notes: (line.notes ?? "").trim(),
              })),
    });
  }
  return out.sort((a, b) => b.period.localeCompare(a.period) || a.kind.localeCompare(b.kind));
}

export function filesForBook(files: InventoryFile[], kind: InventoryBook) {
  return files.filter((file) => file.kind === kind);
}

export function seedInventory(): InventoryItem[] {
  return LINEN_CATALOG.map((row) => emptyInventoryItem(row.id, row.name));
}

export function normalizeInventory(
  rows: RawInventory[] | undefined | null,
): InventoryItem[] {
  const incoming = Array.isArray(rows) ? rows.filter((row) => !isInventoryFileId(row.id ?? "")) : [];
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
