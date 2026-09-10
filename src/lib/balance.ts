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
    row.nights += 1;
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
      const k = `${g.name.trim().toUpperCase()}|${g.roomNo}`;
      const list = groups.get(k) ?? [];
      list.push(g);
      groups.set(k, list);
    }
    for (const list of groups.values()) {
      const inDate = list.reduce(
        (m, g) => (m < g.date ? m : g.date),
        list[0]!.date,
      );
      const out = list.find((g) => g.stay === "out");
      for (const g of list) {
        g.checkIn = g.checkIn || inDate;
        g.checkOut = out?.checkOut || out?.date || null;
      }
    }
    row.guestCount = new Set(
      row.guests.map((g) => g.name.trim().toUpperCase()),
    ).size;
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
