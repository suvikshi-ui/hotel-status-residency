export type SealedIds = Record<string, true>;

export const sealKey = {
  guest: (id: string) => `guest:${id}`,
  food: (id: string) => `food:${id}`,
  wholesale: (id: string) => `ws:${id}`,
  expense: (id: string) => `exp:${id}`,
  balance: (id: string) => `bal:${id}`,
  complaint: (id: string) => `c:${id}`,
  inventoryMonth: (month: string) => `inv:${month.slice(0, 7)}`,
  staffMonth: (month: string) => `staff:${month.slice(0, 7)}`,
  advanceMonth: (month: string) => `adv:${month.slice(0, 7)}`,
};

export function parseSealedIds(raw: unknown): SealedIds {
  if (!raw || typeof raw !== "object") return {};
  const out: SealedIds = {};
  if (Array.isArray(raw)) {
    for (const value of raw) {
      if (typeof value === "string" && value) out[value] = true;
    }
    return out;
  }
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key && value) out[key] = true;
  }
  return out;
}

export function isSealed(sealed: SealedIds | undefined, key: string) {
  return Boolean(key && sealed?.[key]);
}

export function mergeSealed(
  a: SealedIds | undefined,
  b: SealedIds | undefined,
): SealedIds {
  return { ...(a ?? {}), ...(b ?? {}) };
}

export function withSealed(sealed: SealedIds | undefined, keys: string[]): SealedIds {
  const next = { ...(sealed ?? {}) };
  for (const key of keys) {
    if (key) next[key] = true;
  }
  return next;
}

export function unsealedKeys(keys: string[], sealed: SealedIds | undefined) {
  return keys.filter((key) => key && !sealed?.[key]);
}

export function sealedFromHotel(hotel: unknown): SealedIds | undefined {
  if (!hotel || typeof hotel !== "object") return undefined;
  if (!Object.prototype.hasOwnProperty.call(hotel, "_sealedIds")) return undefined;
  return parseSealedIds((hotel as { _sealedIds?: unknown })._sealedIds);
}

export function freezeIfSealed<T extends { id: string }>(
  previous: T[],
  next: T[],
  sealed: SealedIds | undefined,
  keyOf: (id: string) => string,
): T[] {
  const prevById = new Map(previous.map((row) => [row.id, row]));
  const out: T[] = [];
  const seen = new Set<string>();
  for (const row of next) {
    if (!row.id) continue;
    seen.add(row.id);
    out.push(isSealed(sealed, keyOf(row.id)) ? (prevById.get(row.id) ?? row) : row);
  }
  for (const row of previous) {
    if (row.id && !seen.has(row.id) && isSealed(sealed, keyOf(row.id))) {
      out.push(row);
    }
  }
  return out;
}
