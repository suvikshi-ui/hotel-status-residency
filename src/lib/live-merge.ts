import { earlierDate } from "./cloud-save.ts";
import {
  mergeLockState,
  parseLockRev,
  parseLockedDates,
  mergeOpenMonths,
} from "./register-lock.ts";
import { mergeBankBooks } from "./bank-recon.ts";
import { normalizeGuestCards } from "./guest-cards.ts";
import { normalizeContacts } from "./contacts.ts";
import { normalizeCorporates } from "./corporates.ts";
import { normalizeAgents } from "./agents.ts";
import { normalizeMonthDraws } from "./month-draw.ts";
import { normalizeMonthOpenings } from "./month-opening.ts";
import { keepMonthArchives, normalizeMonthArchives } from "./month-archive.ts";
import { mergeGuestGst } from "./invoice.ts";
import { mergeSealed, parseSealedIds, dropDeletedRows, sealKey } from "./sheet-seal.ts";
import { mergeInventoryFiles } from "./inventory.ts";
import type { LedgerSnapshot } from "./supabase-db.ts";

export function inventoryDeletedIds(
  localDeleted: Record<string, true> | undefined,
  cloudDeleted: Record<string, true> | undefined,
  localFiles: { id: string }[] | undefined,
  localSavedAt: number | undefined,
  cloudSavedAt: number | undefined,
) {
  const deleted = mergeSealed(localDeleted, cloudDeleted);
  if ((localSavedAt ?? 0) < (cloudSavedAt ?? 0)) return deleted;
  const next = { ...deleted };
  for (const file of localFiles ?? []) {
    if (file?.id && !localDeleted?.[file.id]) delete next[file.id];
  }
  return next;
}

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

export function mergeLineRefs<T extends { id: string; payRef?: string | null }>(
  merged: T[],
  local: T[] | undefined,
  cloud: T[] | undefined,
): T[] {
  const localMap = new Map((local ?? []).map((row) => [row.id, row.payRef?.trim() || ""]));
  const cloudMap = new Map((cloud ?? []).map((row) => [row.id, row.payRef?.trim() || ""]));
  return merged.map((row) => {
    const localRef = (localMap.get(row.id) || "").trim();
    const cloudRef = (cloudMap.get(row.id) || "").trim();
    const own = (row.payRef || "").trim();
    const ref = localRef || cloudRef || own;
    if ((row.payRef?.trim() || "") === ref) return row;
    return { ...row, payRef: ref || null };
  });
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
    staffRegister: [],
    payrollFiles: [],
    advances: [],
    rooms: [],
    inventory: [],
    inventoryFiles: [],
    complaints: [],
    reminders: [],
    contacts: [],
    corporates: [],
    agents: [],
    monthDraws: [],
    monthOpenings: [],
    monthArchives: [],
    openMonths: [],
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
  const deletedIds = inventoryDeletedIds(
    parseSealedIds(local.deletedIds),
    parseSealedIds(cloud.deletedIds),
    local.inventoryFiles,
    local.savedAt,
    cloud.savedAt,
  );
  const localRev = parseLockRev(local.lockRev);
  const cloudRev = parseLockRev(cloud.lockRev);
  const locked = locks.locked;
  const inventoryFiles = mergeInventoryFiles(
    local.inventoryFiles,
    cloud.inventoryFiles,
  ).filter((file) => !deletedIds[file.id]);
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
    food: mergeLineRefs(
      overlayLockedDayRows(
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
      local.food,
      cloud.food,
    ),
    wholesale: mergeLineRefs(
      overlayLockedDayRows(
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
      local.wholesale,
      cloud.wholesale,
    ),
    expenses: mergeLineRefs(
      overlayLockedDayRows(
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
      local.expenses,
      cloud.expenses,
    ),
    balReceived: mergeLineRefs(
      overlayLockedDayRows(
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
      local.balReceived,
      cloud.balReceived,
    ),
    staff: mergeByKey((r) => r.id, b.staff, local.staff, cloud.staff).filter(
      (r) => !/^st-(0|1|2|3|4|5|6|7|8|9|10|11|12|13|14)$/.test(r.id),
    ),
    staffRegister: mergeByKey(
      (r) => r.id,
      b.staffRegister ?? [],
      local.staffRegister ?? [],
      cloud.staffRegister ?? [],
    ),
    payrollFiles: dropDeletedRows(
      mergeByKey(
        (r) => r.id,
        b.payrollFiles ?? [],
        local.payrollFiles ?? [],
        cloud.payrollFiles ?? [],
      ),
      deletedIds,
      (id) => id,
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
    inventoryFiles,
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
    contacts: normalizeContacts(
      mergeByKey(
        (r) => r.id,
        b.contacts ?? [],
        local.contacts ?? [],
        cloud.contacts ?? [],
      ),
    ),
    corporates: normalizeCorporates(
      mergeByKey(
        (r) => r.id,
        b.corporates ?? [],
        local.corporates ?? [],
        cloud.corporates ?? [],
      ),
    ),
    agents: normalizeAgents(
      mergeByKey(
        (r) => r.id,
        b.agents ?? [],
        local.agents ?? [],
        cloud.agents ?? [],
      ),
    ),
    monthDraws: normalizeMonthDraws(
      mergeByKey(
        (r) => r.month,
        b.monthDraws ?? [],
        local.monthDraws ?? [],
        cloud.monthDraws ?? [],
      ),
    ),
    monthOpenings: normalizeMonthOpenings(
      mergeByKey(
        (r) => r.month,
        b.monthOpenings ?? [],
        local.monthOpenings ?? [],
        cloud.monthOpenings ?? [],
      ),
    ),
    monthArchives: keepMonthArchives([
      normalizeMonthArchives(b.monthArchives),
      normalizeMonthArchives(local.monthArchives),
      normalizeMonthArchives(cloud.monthArchives),
    ]),
    openMonths: mergeOpenMonths(
      local.openMonths,
      cloud.openMonths,
      local.lockRev,
      cloud.lockRev,
    ),
    guestCards: normalizeGuestCards(
      mergeByKey(
        (r) => r.id,
        b.guestCards ?? [],
        local.guestCards ?? [],
        cloud.guestCards ?? [],
      ),
    ),
    bankRows: mergeBankBooks(local.bankRows ?? [], cloud.bankRows ?? []),
    savedAt: Math.max(local.savedAt ?? 0, cloud.savedAt ?? 0),
    cloudUpdatedAt: cloud.cloudUpdatedAt,
  };
}
