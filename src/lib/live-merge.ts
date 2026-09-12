import { earlierDate } from "./cloud-save.ts";
import {
  mergeLockState,
  parseLockRev,
  parseLockedDates,
} from "./register-lock.ts";
import { mergeSealed, parseSealedIds } from "./sheet-seal.ts";
import type { LedgerSnapshot } from "./supabase-db.ts";

export function rowEq(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function mergeByKey<T>(
  keyOf: (row: T) => string,
  base: T[] | undefined,
  local: T[] | undefined,
  cloud: T[] | undefined,
): T[] {
  const asMap = (rows: T[] | undefined) => {
    const m = new Map<string, T>();
    for (const row of rows ?? []) {
      const k = keyOf(row);
      if (k) m.set(k, row);
    }
    return m;
  };
  const b = asMap(base);
  const l = asMap(local);
  const c = asMap(cloud);
  const ids = new Set([...b.keys(), ...l.keys(), ...c.keys()]);
  const out: T[] = [];
  for (const id of ids) {
    const br = b.get(id);
    const lr = l.get(id);
    const cr = c.get(id);
    if (lr && cr) {
      if (rowEq(lr, cr)) out.push(lr);
      else if (br && rowEq(lr, br)) out.push(cr);
      else if (br && rowEq(cr, br)) out.push(lr);
      else out.push(lr);
    } else if (lr && !cr) {
      if (br) continue;
      out.push(lr);
    } else if (!lr && cr) {
      if (br) continue;
      out.push(cr);
    }
  }
  return out;
}

export function mergeRowsById<T extends { id: string }>(
  primary: T[] | undefined,
  filler: T[] | undefined,
): T[] {
  const keep = primary ?? [];
  const extra = filler ?? [];
  if (!extra.length) return keep;
  const ids = new Set(keep.map((r) => r.id).filter(Boolean));
  return [...keep, ...extra.filter((r) => r.id && !ids.has(r.id))];
}

export function pick3<T>(base: T, local: T, cloud: T): T {
  if (rowEq(local, cloud)) return local;
  if (rowEq(local, base)) return cloud;
  if (rowEq(cloud, base)) return local;
  return local;
}

function emptyRows(s: LedgerSnapshot): LedgerSnapshot {
  return {
    ...s,
    guests: [],
    food: [],
    wholesale: [],
    expenses: [],
    balReceived: [],
    staff: [],
    advances: [],
    rooms: [],
    inventory: [],
    complaints: [],
    ota: [],
    janSales: [],
    janFood: [],
    creditGuests: [],
    lockedDates: {},
    lockRev: {},
    sealedIds: {},
  };
}

export function mergeLiveSnapshot(
  base: LedgerSnapshot | null,
  local: LedgerSnapshot,
  cloud: LedgerSnapshot,
): LedgerSnapshot {
  const b = base ?? emptyRows(local);
  const locks = mergeLockState(
    {
      locked: parseLockedDates(local.lockedDates),
      rev: parseLockRev(local.lockRev),
    },
    {
      locked: parseLockedDates(cloud.lockedDates),
      rev: parseLockRev(cloud.lockRev),
    },
  );
  return {
    hotel: pick3(b.hotel, local.hotel, cloud.hotel),
    opening: pick3(b.opening, local.opening, cloud.opening),
    rooms: mergeByKey((r) => r.no, b.rooms, local.rooms, cloud.rooms),
    guests: mergeByKey((r) => r.id, b.guests, local.guests, cloud.guests),
    food: mergeByKey((r) => r.id, b.food, local.food, cloud.food),
    wholesale: mergeByKey((r) => r.id, b.wholesale, local.wholesale, cloud.wholesale),
    expenses: mergeByKey((r) => r.id, b.expenses, local.expenses, cloud.expenses),
    balReceived: mergeByKey(
      (r) => r.id,
      b.balReceived,
      local.balReceived,
      cloud.balReceived,
    ),
    staff: mergeByKey((r) => r.id, b.staff, local.staff, cloud.staff),
    advances: mergeByKey((r) => r.id, b.advances, local.advances, cloud.advances),
    ota: pick3(b.ota, local.ota, cloud.ota),
    janSales: pick3(b.janSales, local.janSales, cloud.janSales),
    janFood: pick3(b.janFood, local.janFood, cloud.janFood),
    creditGuests: pick3(b.creditGuests, local.creditGuests, cloud.creditGuests),
    selectedDate: local.selectedDate,
    openingDate:
      earlierDate(local.openingDate, cloud.openingDate) || local.openingDate,
    securityCode: pick3(b.securityCode, local.securityCode, cloud.securityCode),
    lockedDates: locks.locked,
    lockRev: locks.rev,
    sealedIds: mergeSealed(
      parseSealedIds(local.sealedIds),
      parseSealedIds(cloud.sealedIds),
    ),
    inventory: mergeByKey(
      (r) => r.id,
      b.inventory ?? [],
      local.inventory ?? [],
      cloud.inventory ?? [],
    ),
    complaints: mergeByKey(
      (r) => r.id,
      b.complaints ?? [],
      local.complaints ?? [],
      cloud.complaints ?? [],
    ),
    savedAt: Math.max(local.savedAt ?? 0, cloud.savedAt ?? 0),
    cloudUpdatedAt: cloud.cloudUpdatedAt,
  };
}
