import type { HotelInfo } from "./types";

const LOCK_STORE = "status-register-locks";

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

export function locksFromHotel(hotel: unknown): Record<string, true> | undefined {
  if (!hotel || typeof hotel !== "object") return undefined;
  if (!Object.prototype.hasOwnProperty.call(hotel, "_lockedDates")) return undefined;
  return parseLockedDates((hotel as { _lockedDates?: unknown })._lockedDates);
}

export function hotelForCloud(
  hotel: HotelInfo,
  lockedDates: Record<string, true>,
): HotelInfo & { _lockedDates: Record<string, true> } {
  return { ...hotel, _lockedDates: lockedDates };
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
  const left = Object.keys(a ?? {}).sort();
  const right = Object.keys(b ?? {}).sort();
  if (left.length !== right.length) return false;
  return left.every((key, i) => key === right[i]);
}

export function readStoredLocks(ownerId: string): Record<string, true> | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${LOCK_STORE}:${ownerId}`);
    if (raw == null) return null;
    return parseLockedDates(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeStoredLocks(
  ownerId: string,
  lockedDates: Record<string, true>,
) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`${LOCK_STORE}:${ownerId}`, JSON.stringify(lockedDates));
}
