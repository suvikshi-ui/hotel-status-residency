import { addDays, format, parseISO } from "date-fns";
import { uid } from "./format";
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

export function addDaysIso(iso: string, days: number) {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
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
          return { ...g, stay: "out", checkIn, checkOut: row.date };
        }
        if (g.date <= row.date) {
          return { ...g, checkIn, checkOut: row.date };
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
