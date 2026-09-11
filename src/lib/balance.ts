import { differenceInCalendarDays, parseISO } from "date-fns";
import {
  checkoutFromLastNight,
  nightsFromDates,
} from "./stay";
import type { GuestEntry, NamedAmount, PayMode } from "./types";

export interface DueLine {
  id: string;
  date: string;
  name: string;
  roomNo: string;
  amount: number;
  source: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  inTime?: string | null;
  outTime?: string | null;
  stay?: "continue" | "out" | null;
}

export interface DueReceipt {
  id: string;
  date: string;
  particular: string;
  mode: PayMode;
  amount: number;
}

export type DueStatus = "paid" | "partial" | "open";

export interface DueStay {
  id: string;
  name: string;
  roomNo: string;
  checkIn: string;
  checkOut: string | null;
  inHouse: boolean;
  days: number;
  perDay: number;
  billed: number;
  paid: number;
  remaining: number;
  status: DueStatus;
}

export interface DueAccount {
  key: string;
  billed: number;
  collected: number;
  remaining: number;
  nights: number;
  guestCount: number;
  firstDate: string;
  lastDate: string;
  guests: DueLine[];
  stays: DueStay[];
  receipts: DueReceipt[];
  settled: boolean;
}

export function sourceKey(g: GuestEntry): string {
  const s = (g.source ?? "").trim();
  if (s) return s;
  return (g.name ?? "").trim() || "Unknown";
}

function receiptMatches(particular: string, key: string): boolean {
  const p = particular.trim().toUpperCase();
  const k = key.trim().toUpperCase();
  if (!p || !k) return false;
  if (p === k) return true;
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Z0-9])${escaped}([^A-Z0-9]|$)`).test(p);
}

function personKey(g: { name: string; roomNo: string }) {
  return `${g.name.trim().toUpperCase()}|${g.roomNo.trim()}`;
}

export function splitStayNights(nights: DueLine[]): DueLine[][] {
  const sorted = [...nights].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const chunks: DueLine[][] = [];
  let cur: DueLine[] = [];
  for (const n of sorted) {
    const prev = cur[cur.length - 1];
    if (prev) {
      let gap = true;
      try {
        gap = differenceInCalendarDays(parseISO(n.date), parseISO(prev.date)) > 1;
      } catch {
        gap = n.date !== prev.date;
      }
      if (gap || prev.stay === "out") {
        chunks.push(cur);
        cur = [];
      }
    }
    cur.push(n);
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

export function stayFromNights(nights: DueLine[]): DueStay {
  const dates = nights.map((n) => n.date).sort();
  const first = dates[0] ?? "";
  const lastNight = dates[dates.length - 1] ?? first;
  const out = [...nights].reverse().find((n) => n.stay === "out" || Boolean(n.checkOut));
  const checkIn =
    nights.reduce((m, n) => {
      const v = n.checkIn || n.date;
      return m && m < v ? m : v;
    }, first) || first;
  const explicitOut = out?.checkOut || null;
  const left =
    Boolean(out) || nights.some((n) => n.stay === "out" || Boolean(n.checkOut));
  const morning = checkoutFromLastNight(lastNight);
  const checkOut = left
    ? explicitOut && explicitOut > lastNight
      ? explicitOut
      : morning
    : explicitOut && explicitOut > lastNight
      ? explicitOut
      : null;
  const billed = nights.reduce((s, n) => s + n.amount, 0);
  const days = nightsFromDates(checkIn, checkOut || morning);
  const same = nights.length > 0 && nights.every((n) => n.amount === nights[0]!.amount);
  const perDay = nights.length
    ? same
      ? nights[0]!.amount
      : Math.round(billed / nights.length)
    : 0;
  return {
    id: nights[0]?.id ?? `${checkIn}-${lastNight}`,
    name: nights[0]?.name ?? "",
    roomNo: nights[0]?.roomNo ?? "",
    checkIn,
    checkOut,
    inHouse: !checkOut,
    days,
    perDay,
    billed,
    paid: 0,
    remaining: billed,
    status: billed <= 0 ? "paid" : "open",
  };
}

export function allocateStaysFifo(stays: DueStay[], collected: number): DueStay[] {
  const ordered = [...stays].sort(
    (a, b) =>
      a.checkIn.localeCompare(b.checkIn) ||
      a.name.localeCompare(b.name) ||
      a.roomNo.localeCompare(b.roomNo),
  );
  let left = Math.max(0, collected);
  return ordered.map((stay) => {
    const take = Math.min(stay.billed, left);
    left -= take;
    const remaining = Math.max(0, stay.billed - take);
    const status: DueStatus =
      remaining <= 0 ? "paid" : take > 0 ? "partial" : "open";
    return { ...stay, paid: take, remaining, status };
  });
}

function buildStays(lines: DueLine[]): DueStay[] {
  const groups = new Map<string, DueLine[]>();
  for (const g of lines) {
    const k = personKey(g);
    const list = groups.get(k) ?? [];
    list.push(g);
    groups.set(k, list);
  }
  const stays: DueStay[] = [];
  for (const list of groups.values()) {
    for (const chunk of splitStayNights(list)) {
      stays.push(stayFromNights(chunk));
    }
  }
  return stays;
}

export function buildDueAccounts(
  guests: GuestEntry[],
  receipts: NamedAmount[],
): DueAccount[] {
  const map = new Map<string, DueAccount>();

  function ensure(key: string): DueAccount {
    let row = map.get(key);
    if (!row) {
      row = {
        key,
        billed: 0,
        collected: 0,
        remaining: 0,
        nights: 0,
        guestCount: 0,
        firstDate: "",
        lastDate: "",
        guests: [],
        stays: [],
        receipts: [],
        settled: false,
      };
      map.set(key, row);
    }
    return row;
  }

  for (const g of guests) {
    if (g.mode !== "BALANCE") continue;
    const key = sourceKey(g);
    const row = ensure(key);
    row.billed += g.amount;
    row.guests.push({
      id: g.id,
      date: g.date,
      name: g.name,
      roomNo: g.roomNo,
      amount: g.amount,
      source: g.source ?? null,
      checkIn: g.checkIn ?? null,
      checkOut: g.checkOut ?? g.coDate ?? null,
      inTime: g.inTime ?? g.time ?? null,
      outTime: g.outTime ?? null,
      stay: g.stay === "out" ? "out" : "continue",
    });
    if (!row.firstDate || g.date < row.firstDate) row.firstDate = g.date;
    if (!row.lastDate || g.date > row.lastDate) row.lastDate = g.date;
  }

  const keys = [...map.keys()].sort((a, b) => b.length - a.length);
  for (const r of receipts) {
    if (r.kind === "ota" || r.kind === "other") continue;
    const hit = keys.find((k) => receiptMatches(r.particular, k));
    if (!hit) continue;
    const row = map.get(hit)!;
    row.collected += r.amount;
    row.receipts.push({
      id: r.id,
      date: r.date,
      particular: r.particular,
      mode: r.mode,
      amount: r.amount,
    });
  }

  for (const row of map.values()) {
    row.remaining = row.billed - row.collected;
    row.settled = row.remaining <= 0;
    row.guests.sort(
      (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name),
    );
    row.receipts.sort((a, b) => a.date.localeCompare(b.date));
    const groups = new Map<string, DueLine[]>();
    for (const g of row.guests) {
      const k = personKey(g);
      const list = groups.get(k) ?? [];
      list.push(g);
      groups.set(k, list);
    }
    for (const list of groups.values()) {
      const inDate = list.reduce(
        (m, g) => (m < g.date ? m : g.date),
        list[0]!.date,
      );
      const chunks = splitStayNights(list);
      for (const chunk of chunks) {
        const out = chunk.find((g) => g.stay === "out");
        const chunkIn = chunk.reduce(
          (m, g) => (m < (g.checkIn || g.date) ? m : g.checkIn || g.date),
          chunk[0]!.date,
        );
        for (const g of chunk) {
          g.checkIn = g.checkIn || chunkIn || inDate;
          g.checkOut =
            out?.checkOut ||
            (out ? checkoutFromLastNight(out.date) : null);
        }
      }
    }
    row.guestCount = new Set(
      row.guests.map((g) => g.name.trim().toUpperCase()),
    ).size;
    row.stays = allocateStaysFifo(buildStays(row.guests), row.collected);
    row.nights = row.stays.reduce((s, stay) => s + stay.days, 0);
  }

  return [...map.values()].sort((a, b) => {
    if (a.settled !== b.settled) return a.settled ? 1 : -1;
    if (b.remaining !== a.remaining) return b.remaining - a.remaining;
    return a.key.localeCompare(b.key);
  });
}

export function uniqueSources(guests: GuestEntry[]): string[] {
  const set = new Set<string>();
  for (const g of guests) {
    const s = (g.source ?? "").trim();
    if (s) set.add(s);
    if (g.mode === "BALANCE") {
      const key = sourceKey(g);
      if (key && key !== "Unknown") set.add(key);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function lookupDueAccount(
  accounts: DueAccount[],
  name: string,
): DueAccount | null {
  const t = name.trim().toLowerCase();
  if (!t) return null;
  const exact = accounts.find((a) => a.key.toLowerCase() === t);
  if (exact) return exact;
  const starts = accounts.filter((a) => a.key.toLowerCase().startsWith(t));
  if (starts.length === 1) return starts[0] ?? null;
  const includes = accounts.filter((a) => a.key.toLowerCase().includes(t));
  if (includes.length === 1) return includes[0] ?? null;
  const guestHits = accounts.filter((a) =>
    a.guests.some(
      (g) =>
        g.name.toLowerCase().includes(t) || g.roomNo.toLowerCase() === t,
    ),
  );
  if (guestHits.length === 1) return guestHits[0] ?? null;
  return null;
}

export function dueStatusLabel(status: DueStatus) {
  if (status === "paid") return "Paid";
  if (status === "partial") return "Partial";
  return "Open";
}
