import { earlierDate } from "./cloud-save.ts";
import {
  mergeLockState,
  parseLockRev,
  parseLockedDates,
} from "./register-lock.ts";
import { mergeBankRows } from "./bank-recon.ts";
import { mergeGuestGst } from "./invoice.ts";
import { mergeSealed, parseSealedIds, dropDeletedRows, sealKey } from "./sheet-seal.ts";
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
    reminders: [],
    bankRows: [],
    ota: [],
    janSales: [],
    janFood: [],
    creditGuests: [],
    lockedDates: {},
    lockRev: {},
    sealedIds: {},
    deletedIds: {},
  };
}

export function overlayLockedDayRows<T extends { date: string }>(
  merged: T[],
  cloud: T[] | undefined,
  locked: Record<string, true> | undefined,
  localRev: Record<string, number> | undefined,
  cloudRev: Record<string, number> | undefined,
): T[] {
  const dates = Object.keys(locked ?? {});
  if (!dates.length) return merged;
  const takeCloud = new Set<string>();
  for (const d of dates) {
    if (!locked?.[d]) continue;
    if ((localRev?.[d] ?? 0) > (cloudRev?.[d] ?? 0)) continue;
    takeCloud.add(d);
  }
  if (!takeCloud.size) return merged;
  const rest = merged.filter((r) => !takeCloud.has(r.date));
  const fromCloud = (cloud ?? []).filter((r) => takeCloud.has(r.date));
  return [...rest, ...fromCloud];
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
  const deletedIds = mergeSealed(
    parseSealedIds(local.deletedIds),
    parseSealedIds(cloud.deletedIds),
  );
  const localRev = parseLockRev(local.lockRev);
  const cloudRev = parseLockRev(cloud.lockRev);
  const locked = locks.locked;
  return {
    hotel: pick3(b.hotel, local.hotel, cloud.hotel),
    opening: pick3(b.opening, local.opening, cloud.opening),
    rooms: mergeByKey((r) => r.no, b.rooms, local.rooms, cloud.rooms),
    guests: mergeGuestGst(
      overlayLockedDayRows(
        dropDeletedRows(
          mergeByKey((r) => r.id, b.guests, local.guests, cloud.guests),
          deletedIds,
          sealKey.guest,
        ),
        cloud.guests,
        locked,
        localRev,
        cloudRev,
      ),
      local.guests,
      cloud.guests,
    ),
    food: overlayLockedDayRows(
      dropDeletedRows(
        mergeByKey((r) => r.id, b.food, local.food, cloud.food),
        deletedIds,
        sealKey.food,
      ),
      cloud.food,
      locked,
      localRev,
      cloudRev,
    ),
    wholesale: overlayLockedDayRows(
      dropDeletedRows(
        mergeByKey((r) => r.id, b.wholesale, local.wholesale, cloud.wholesale),
        deletedIds,
        sealKey.wholesale,
      ),
      cloud.wholesale,
      locked,
      localRev,
      cloudRev,
    ),
    expenses: overlayLockedDayRows(
      dropDeletedRows(
        mergeByKey((r) => r.id, b.expenses, local.expenses, cloud.expenses),
        deletedIds,
        sealKey.expense,
      ),
      cloud.expenses,
      locked,
      localRev,
      cloudRev,
    ),
    balReceived: overlayLockedDayRows(
      dropDeletedRows(
        mergeByKey(
          (r) => r.id,
          b.balReceived,
          local.balReceived,
          cloud.balReceived,
        ),
        deletedIds,
        sealKey.balance,
      ),
      cloud.balReceived,
      locked,
      localRev,
      cloudRev,
    ),
    staff: mergeByKey((r) => r.id, b.staff, local.staff, cloud.staff).filter(
      (r) => !/^st-(0|1|2|3|4|5|6|7|8|9|10|11|12|13|14)$/.test(r.id),
    ),
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
    deletedIds,
    inventory: mergeRowsById(local.inventory ?? [], cloud.inventory ?? []),
    complaints: dropDeletedRows(
      mergeRowsById(local.complaints ?? [], cloud.complaints ?? []),
      deletedIds,
      sealKey.complaint,
    ),
    reminders: mergeByKey(
      (r) => r.id,
      b.reminders ?? [],
      local.reminders ?? [],
      cloud.reminders ?? [],
    ),
    bankRows: mergeBankRows(local.bankRows ?? [], cloud.bankRows ?? []),
    savedAt: Math.max(local.savedAt ?? 0, cloud.savedAt ?? 0),
    cloudUpdatedAt: cloud.cloudUpdatedAt,
  };
}
