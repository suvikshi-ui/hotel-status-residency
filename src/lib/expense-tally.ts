import type { NamedAmount, PayMode } from "./types";

export type ExpBucket = "flysky" | "ws" | "kitchen" | "salary" | "ops";

export function expenseBucket(particular: string): ExpBucket {
  const p = particular.trim().toUpperCase();
  if (p.startsWith("FLYSKY")) return "flysky";
  if (p === "WS" || p.startsWith("WS ") || p.startsWith("WS(") || p.startsWith("WS ("))
    return "ws";
  if (p.includes("SALARY")) return "salary";
  if (
    /RATION|VEG|CHAPATI|MILK|GAS|FOOD|BREAKFAST|CLOUD|TEA POWDER|STAFF RICE|STAFF CHICKEN|COLD DRINK|DMART|REDBULL|BISLER|EGG|DOSA|COFFEE/.test(
      p,
    )
  ) {
    return "kitchen";
  }
  return "ops";
}

export type ExpenseDesk =
  | "kitchen"
  | "rooms"
  | "flysky"
  | "ws"
  | "salary"
  | "utilities"
  | "office";

export const EXPENSE_DESKS: { id: ExpenseDesk; label: string }[] = [
  { id: "kitchen", label: "Kitchen" },
  { id: "rooms", label: "Rooms" },
  { id: "flysky", label: "Flysky" },
  { id: "ws", label: "WS" },
  { id: "salary", label: "Salary" },
  { id: "utilities", label: "Utilities" },
  { id: "office", label: "Office" },
];

export function expenseDesk(particular: string): ExpenseDesk {
  const p = particular.trim().toUpperCase();
  if (p.startsWith("FLYSKY") || p.startsWith("FLY SKY") || p.startsWith("FLY-SKY")) {
    return "flysky";
  }
  if (p === "WS" || p.startsWith("WS ") || p.startsWith("WS(") || p.startsWith("WS (")) {
    return "ws";
  }
  if (p.includes("SALARY") || p.includes("WAGES")) return "salary";
  if (/ELECTRIC|MSEB|MSEDCL|WATER|WIFI|BROADBAND|INTERNET|LIGHT BILL/.test(p)) {
    return "utilities";
  }
  if (
    /BEDSHEET|PILLOW|LINEN|TOWEL|TOILET|SOAP|ROOM|HOUSEKEEP|LAUNDRY|CURTAIN|MATTRESS|BLANKET|HANGER/.test(
      p,
    )
  ) {
    return "rooms";
  }
  if (
    /RATION|VEG|CHAPATI|MILK|GAS|FOOD|BREAKFAST|TEA|EGG|DAL|RICE|OIL|MASALA|KITCHEN|DMART|BISLER|COLD DRINK|COFFEE|SUGAR|CLOUD/.test(
      p,
    )
  ) {
    return "kitchen";
  }
  return "office";
}

export function sumByMode(rows: NamedAmount[]) {
  const out: Record<PayMode, number> = {
    CASH: 0,
    QRS: 0,
    QRPK: 0,
    ONLINE: 0,
    BALANCE: 0,
  };
  for (const r of rows) out[r.mode] += r.amount;
  return out;
}

export function sumByHead(rows: NamedAmount[]) {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.particular, (map.get(r.particular) ?? 0) + r.amount);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function sumByDay(rows: NamedAmount[]) {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.date, (map.get(r.date) ?? 0) + r.amount);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export function sumByBucket(rows: NamedAmount[]) {
  const out: Record<ExpBucket, number> = {
    flysky: 0,
    ws: 0,
    kitchen: 0,
    salary: 0,
    ops: 0,
  };
  for (const r of rows) out[expenseBucket(r.particular)] += r.amount;
  return out;
}
