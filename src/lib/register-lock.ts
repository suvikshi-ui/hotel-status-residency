import type { HotelInfo } from "./types";
import type { SealedIds } from "./sheet-seal.ts";
import { parseSealedIds } from "./sheet-seal.ts";

export type LockState = {
  locked: Record<string, true>;
  rev: Record<string, number>;
};

export function isDayLocked(
  lockedDates: Record<string, true> | undefined,
  date: string,
) {
  return Boolean(lockedDates?.[date]);
}

export function withLocked(lockedDates: Record<string, true>, date: string) {
  return { ...lockedDates, [date]: true as const };
}

export function withoutLocked(lockedDates: Record<string, true>, date: string) {
  const next = { ...lockedDates };
  delete next[date];
  return next;
}

export function parseLockedDates(raw: unknown): Record<string, true> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, true> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && value) out[key] = true;
  }
  return out;
}

export function parseLockRev(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) out[key] = n;
  }
  return out;
}

export function bumpLockRev(
  rev: Record<string, number> | undefined,
  date: string,
  at = Date.now(),
) {
  const prev = rev?.[date] ?? 0;
  return { ...(rev ?? {}), [date]: Math.max(at, prev + 1) };
}

export function locksFromHotel(hotel: unknown): Record<string, true> | undefined {
  if (!hotel || typeof hotel !== "object") return undefined;
  if (!Object.prototype.hasOwnProperty.call(hotel, "_lockedDates")) return undefined;
  return parseLockedDates((hotel as { _lockedDates?: unknown })._lockedDates);
}

export function lockRevFromHotel(hotel: unknown): Record<string, number> | undefined {
  if (!hotel || typeof hotel !== "object") return undefined;
  if (!Object.prototype.hasOwnProperty.call(hotel, "_lockRev")) return undefined;
  return parseLockRev((hotel as { _lockRev?: unknown })._lockRev);
}

/** Hotel json `_lockedDates` is the source of truth for every desk. */
export function locksFromMeta(row: {
  locked_dates?: unknown;
  hotel?: unknown;
}): Record<string, true> | undefined {
  const fromHotel = locksFromHotel(row.hotel);
  if (fromHotel !== undefined) return fromHotel;
  if (row.locked_dates != null) return parseLockedDates(row.locked_dates);
  return undefined;
}

export function lockRevFromMeta(row: {
  lock_rev?: unknown;
  hotel?: unknown;
}): Record<string, number> {
  const fromHotel = lockRevFromHotel(row.hotel);
  if (fromHotel !== undefined) return fromHotel;
  if (row.lock_rev != null) return parseLockRev(row.lock_rev);
  return {};
}

export function mergeLockState(local: LockState, cloud: LockState): LockState {
  const dates = new Set([
    ...Object.keys(local.locked ?? {}),
    ...Object.keys(cloud.locked ?? {}),
    ...Object.keys(local.rev ?? {}),
    ...Object.keys(cloud.rev ?? {}),
  ]);
  const locked: Record<string, true> = {};
  const rev: Record<string, number> = {};
  for (const date of dates) {
    const lr = local.rev?.[date] ?? 0;
    const cr = cloud.rev?.[date] ?? 0;
    const localOn = Boolean(local.locked?.[date]);
    const cloudOn = Boolean(cloud.locked?.[date]);
    if (lr > cr) {
      if (localOn) locked[date] = true;
      rev[date] = lr;
    } else if (cr > lr) {
      if (cloudOn) locked[date] = true;
      rev[date] = cr;
    } else {
      if (localOn || cloudOn) locked[date] = true;
      if (lr) rev[date] = lr;
    }
  }
  return { locked, rev };
}

export function hotelForCloud(
  hotel: HotelInfo,
  lockedDates: Record<string, true>,
  lockRev: Record<string, number> = {},
  sealedIds: SealedIds = {},
): HotelInfo & {
  _lockedDates: Record<string, true>;
  _lockRev: Record<string, number>;
  _sealedIds: SealedIds;
} {
  return {
    ...hotel,
    _lockedDates: lockedDates,
    _lockRev: lockRev,
    _sealedIds: parseSealedIds(sealedIds),
  };
}

export function hotelFromCloud(hotel: unknown, fallback: HotelInfo): HotelInfo {
  const raw =
    hotel && typeof hotel === "object"
      ? (hotel as Record<string, unknown>)
      : {};
  const n = Number(raw.dailyTarget);
  return {
    name: typeof raw.name === "string" && raw.name ? raw.name : fallback.name,
    blessing:
      typeof raw.blessing === "string" && raw.blessing
        ? raw.blessing
        : fallback.blessing,
    place: typeof raw.place === "string" && raw.place ? raw.place : fallback.place,
    dailyTarget: Number.isFinite(n) && n > 0 ? n : fallback.dailyTarget,
    month: typeof raw.month === "string" && raw.month ? raw.month : fallback.month,
  };
}

export function pickLockedDates(
  incoming: Record<string, true> | undefined,
  current: Record<string, true> | undefined,
): Record<string, true> {
  if (incoming) return incoming;
  return current ?? {};
}

export function locksEqual(
  a: Record<string, true> | undefined,
  b: Record<string, true> | undefined,
) {
  const left = Object.keys(a ?? {}).sort().join(",");
  const right = Object.keys(b ?? {}).sort().join(",");
  return left === right;
}

/** Locks live on the hotel account, not this computer. */
export function writeStoredLocks(
  _owner?: string | null,
  _locked?: Record<string, true>,
) {}

export function readStoredLocks(_owner?: string | null): Record<string, true> {
  return {};
}
