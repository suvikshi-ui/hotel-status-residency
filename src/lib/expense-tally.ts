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

export function sumByMode(rows: NamedAmount[]) {
  const out: Record<PayMode, number> = {
    CASH: 0, QRS: 0, QRPK: 0, ONLINE: 0, BALANCE: 0,
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
    flysky: 0, ws: 0, kitchen: 0, salary: 0, ops: 0,
  };
  for (const r of rows) out[expenseBucket(r.particular)] += r.amount;
  return out;
}
