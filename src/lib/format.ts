import { format, parseISO, isValid } from "date-fns";
import type { PayMode } from "./types";

export const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function money(n: number | null | undefined) {
  return inr.format(Math.round(n ?? 0));
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

export const MODE_LABEL: Record<PayMode, string> = {
  CASH: "Cash",
  QRS: "Santosh QR",
  QRPK: "P.K. QR",
  ONLINE: "Online",
  BALANCE: "Balance",
};

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const MODES: PayMode[] = ["CASH", "QRS", "ONLINE", "BALANCE", "QRPK"];
export const PAY_MODES: PayMode[] = ["CASH", "QRS", "QRPK", "ONLINE"];
export const DUE_PAY_MODES: PayMode[] = ["CASH", "QRS", "QRPK"];
export const OTA_CHANNELS = ["Fab", "Bravistay"] as const;
