import type { GuestEntry } from "./types";

export type GstBillMeta = {
  id: string;
  invoiceNo: string;
  payRef: string;
};

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export function gstIdsFromHotel(hotel: unknown): string[] {
  if (!hotel || typeof hotel !== "object") return [];
  const raw = hotel as { _gstGuestIds?: unknown; _gstBills?: unknown };
  const fromIds = Array.isArray(raw._gstGuestIds)
    ? raw._gstGuestIds.filter((id): id is string => typeof id === "string" && Boolean(id))
    : [];
  const fromBills = gstBillsFromHotel(hotel).map((b) => b.id);
  return [...new Set([...fromIds, ...fromBills])];
}

export function gstBillsFromHotel(hotel: unknown): GstBillMeta[] {
  if (!hotel || typeof hotel !== "object") return [];
  const raw = (hotel as { _gstBills?: unknown })._gstBills;
  if (!Array.isArray(raw)) return [];
  const out: GstBillMeta[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = str(r.id);
    if (!id) continue;
    out.push({ id, invoiceNo: str(r.invoiceNo), payRef: str(r.payRef) });
  }
  return out;
}

export function gstIdsFromGuests(guests: GuestEntry[] | undefined): string[] {
  return (guests ?? []).filter((g) => g.gst).map((g) => g.id);
}

export function gstBillsFromGuests(guests: GuestEntry[] | undefined): GstBillMeta[] {
  return (guests ?? [])
    .filter((g) => g.gst)
    .map((g) => ({
      id: g.id,
      invoiceNo: g.gstInvoiceNo?.trim() || "",
      payRef: g.payRefNo?.trim() || "",
    }));
}

export function withGuestGst(
  guests: GuestEntry[],
  extraIds?: Iterable<string>,
  bills?: GstBillMeta[],
): GuestEntry[] {
  const ids = extraIds ? new Set(extraIds) : new Set<string>();
  const billMap = new Map((bills ?? []).map((b) => [b.id, b]));
  return guests.map((g) => {
    const bill = billMap.get(g.id);
    return {
      ...g,
      gst: Boolean(g.gst) || ids.has(g.id) || Boolean(bill),
      gstInvoiceNo: g.gstInvoiceNo || bill?.invoiceNo || null,
      payRefNo: g.payRefNo || bill?.payRef || null,
    };
  });
}

type GstBits = {
  gst: boolean;
  gstInvoiceNo: string | null;
  payRefNo: string | null;
};

function bitsOf(g: GuestEntry): GstBits {
  return {
    gst: Boolean(g.gst),
    gstInvoiceNo: g.gstInvoiceNo?.trim() || null,
    payRefNo: g.payRefNo?.trim() || null,
  };
}

export function mergeGuestGst(
  merged: GuestEntry[],
  local: GuestEntry[] | undefined,
  cloud: GuestEntry[] | undefined,
): GuestEntry[] {
  const localMap = new Map((local ?? []).map((g) => [g.id, bitsOf(g)]));
  const cloudMap = new Map((cloud ?? []).map((g) => [g.id, bitsOf(g)]));
  return merged.map((g) => {
    const bits = localMap.get(g.id) ?? cloudMap.get(g.id) ?? bitsOf(g);
    return { ...g, ...bits };
  });
}
