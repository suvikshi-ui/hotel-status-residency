import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { uid, normRoom } from "./format";
import type { GuestEntry } from "./types";

export function stayKey(g: {
  name: string;
  roomNo: string;
  source?: string | null;
  mode: string;
}) {
  return [
    g.name.trim().toUpperCase(),
    g.roomNo.trim(),
    (g.source ?? "").trim().toUpperCase(),
    g.mode,
  ].join("|");
}

/** Name + room + mode — the register duplicate key. */
export function postingKey(g: { name: string; roomNo: string; mode: string }) {
  return `${g.name.trim().toUpperCase()}|${normRoom(g.roomNo)}|${g.mode}`;
}

export function findDuplicateOnDate(
  guests: GuestEntry[],
  date: string,
  match: { name: string; roomNo: string; mode: string },
  exceptId?: string,
): GuestEntry | null {
  const key = postingKey(match);
  return (
    guests.find(
      (g) =>
        g.date === date &&
        g.id !== exceptId &&
        postingKey(g) === key,
    ) ?? null
  );
}

export function addDaysIso(iso: string, days: number) {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

/** Last occupied night D checks out next morning (hotel day 11:00 AM → 11:00 AM). */
export function checkoutFromLastNight(lastNight: string) {
  return addDaysIso(lastNight, 1);
}

export function nightsFromDates(checkIn: string, checkOut: string) {
  try {
    return Math.max(
      0,
      differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)),
    );
  } catch {
    return 0;
  }
}

export function stayDates(guests: GuestEntry[], g: GuestEntry) {
  const nights = guests.filter((x) => stayKey(x) === stayKey(g));
  const checkIn =
    g.checkIn ||
    nights.reduce((m, x) => (m && m < x.date ? m : x.date), g.date);
  const out = nights.find((x) => x.stay === "out" || Boolean(x.checkOut));
  const lastNight = nights.reduce(
    (m, x) => (m > x.date ? m : x.date),
    g.date,
  );
  const checkOut =
    g.checkOut ||
    out?.checkOut ||
    checkoutFromLastNight(out?.stay === "out" ? out.date : lastNight);
  return {
    checkIn,
    checkOut,
    nights: nightsFromDates(checkIn, checkOut),
  };
}

/** Source/name edits follow the whole stay so Balance does not split one company. */
export function applyGuestPatch(
  guests: GuestEntry[],
  id: string,
  patch: Partial<GuestEntry>,
): GuestEntry[] {
  const prev = guests.find((g) => g.id === id);
  if (!prev) return guests;
  const oldKey = stayKey(prev);
  const shareSource = Object.prototype.hasOwnProperty.call(patch, "source");
  const shareName = Object.prototype.hasOwnProperty.call(patch, "name");
  return guests.map((g) => {
    if (g.id === id) return { ...g, ...patch };
    if (!shareSource && !shareName) return g;
    if (stayKey(g) !== oldKey) return g;
    return {
      ...g,
      ...(shareSource ? { source: patch.source ?? null } : {}),
      ...(shareName && patch.name ? { name: patch.name } : {}),
    };
  });
}

export function applyStay(
  guests: GuestEntry[],
  id: string,
  stay: "continue" | "out",
): GuestEntry[] {
  const row = guests.find((g) => g.id === id);
  if (!row) return guests;
  const key = stayKey(row);
  const nights = guests
    .filter((g) => stayKey(g) === key)
    .sort((a, b) => a.date.localeCompare(b.date));
  const first = nights[0];
  const checkIn = first?.checkIn || first?.date || row.date;

  if (stay === "out") {
    return guests
      .filter((g) => !(stayKey(g) === key && g.date > row.date))
      .map((g) => {
        if (stayKey(g) !== key) return g;
        if (g.id === id) {
          return {
            ...g,
            stay: "out",
            checkIn,
            checkOut: checkoutFromLastNight(row.date),
          };
        }
        if (g.date <= row.date) {
          return { ...g, checkIn, checkOut: checkoutFromLastNight(row.date) };
        }
        return g;
      });
  }

  let nextGuests = guests.map((g) => {
    if (stayKey(g) !== key) return g;
    if (g.id === id) {
      return {
        ...g,
        stay: "continue" as const,
        checkIn,
        checkOut: null,
        outTime: null,
      };
    }
    return {
      ...g,
      checkIn,
      checkOut: null,
      stay: g.stay === "out" ? "continue" : g.stay,
    };
  });

  const next = addDaysIso(row.date, 1);
  const exists = nextGuests.some((g) => stayKey(g) === key && g.date === next);
  if (!exists) {
    const slNo =
      nextGuests.filter((g) => g.date === next).reduce((m, x) => Math.max(m, x.slNo), 0) +
      1;
    nextGuests = [
      ...nextGuests,
      {
        ...row,
        id: uid("g"),
        date: next,
        slNo,
        stay: "continue",
        checkIn,
        checkOut: null,
        outTime: null,
      },
    ];
  }
  return nextGuests;
}

/** Occupied rooms on a date — includes guests already marked out that night. */
export function occupantsOnDate(guests: GuestEntry[], date: string): GuestEntry[] {
  const seen = new Set<string>();
  const out: GuestEntry[] = [];
  for (const g of guests) {
    if (g.date !== date) continue;
    const k = stayKey(g);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(g);
  }
  return out.sort(
    (a, b) =>
      a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }) ||
      a.slNo - b.slNo,
  );
}

/** In-house guests on a date, one row per stay. Already checked out are skipped. */
export function inHouseOnDate(guests: GuestEntry[], date: string): GuestEntry[] {
  return occupantsOnDate(guests, date).filter((g) => g.stay !== "out");
}

export function stayOnDate(
  guests: GuestEntry[],
  g: GuestEntry,
  date: string,
): boolean {
  const k = stayKey(g);
  return guests.some((x) => x.date === date && stayKey(x) === k);
}

/**
 * Night audit: ticked ids continue onto the next calendar day.
 * Everyone else in-house that night is checked out.
 */
export function applyYesterdayRoll(
  guests: GuestEntry[],
  fromDate: string,
  continueIds: Iterable<string>,
): GuestEntry[] {
  const keep = new Set(continueIds);
  const rows = occupantsOnDate(guests, fromDate);
  let next = guests;
  for (const g of rows) {
    next = applyStay(next, g.id, keep.has(g.id) ? "continue" : "out");
  }
  return next;
}
