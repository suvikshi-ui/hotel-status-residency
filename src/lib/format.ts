import { format, parseISO, isValid } from "date-fns";
import type { PayMode } from "./types";

export const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const inrFull = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function money(n: number | null | undefined) {
  return inr.format(Math.round(n ?? 0));
}

export function moneyCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 100000) return `₹${(n / 100000).toFixed(abs >= 1000000 ? 1 : 2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return money(n);
}

export function signedMoney(n: number) {
  const v = money(Math.abs(n));
  if (n > 0) return `+ ${v}`;
  if (n < 0) return `− ${v}`;
  return v;
}

export function formatDay(iso: string) {
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return format(d, "EEE d MMM yyyy");
}

export function formatDayShort(iso: string) {
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return format(d, "d MMM");
}

/** Hotel cycle is always 11:00 AM → 11:00 AM. */
export const HOTEL_CLOCK = "11:00 AM";

export function stayStamp(iso: string) {
  return `${formatDayShort(iso)} · ${HOTEL_CLOCK}`;
}

export function weekday(iso: string) {
  const d = parseISO(iso);
  if (!isValid(d)) return "";
  return format(d, "EEE");
}

export const MODE_LABEL: Record<PayMode, string> = {
  CASH: "Cash",
  QRS: "Santosh QR",
  QRPK: "P.K. QR",
  ONLINE: "Online",
  BALANCE: "Balance",
};

export const MODE_SHORT: Record<PayMode, string> = {
  CASH: "Cash",
  QRS: "QR",
  QRPK: "PK",
  ONLINE: "OTA",
  BALANCE: "Due",
};

export function normRoom(n: string) {
  const t = (n ?? "").trim();
  if (/^\d+$/.test(t)) return String(parseInt(t, 10));
  return t;
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const MODES: PayMode[] = ["CASH", "QRS", "ONLINE", "BALANCE", "QRPK"];

export const PAY_MODES: PayMode[] = ["CASH", "QRS", "QRPK", "ONLINE"];

export const DUE_PAY_MODES: PayMode[] = ["CASH", "QRS", "QRPK"];

export const OTA_CHANNELS = ["Fab", "Bravistay"] as const;
