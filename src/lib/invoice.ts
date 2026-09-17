import type { GuestEntry } from "./types";

export function gstIdsFromHotel(hotel: unknown): string[] {
  if (!hotel || typeof hotel !== "object") return [];
  const raw = (hotel as { _gstGuestIds?: unknown })._gstGuestIds;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && Boolean(id));
}

export function gstIdsFromGuests(guests: GuestEntry[] | undefined): string[] {
  return (guests ?? []).filter((g) => g.gst).map((g) => g.id);
}

export function withGuestGst(
  guests: GuestEntry[],
  extraIds?: Iterable<string>,
): GuestEntry[] {
  const ids = extraIds ? new Set(extraIds) : null;
  return guests.map((g) => ({
    ...g,
    gst: Boolean(g.gst) || Boolean(ids?.has(g.id)),
  }));
}

export function mergeGuestGst(
  merged: GuestEntry[],
  local: GuestEntry[] | undefined,
  cloud: GuestEntry[] | undefined,
): GuestEntry[] {
  const localMap = new Map((local ?? []).map((g) => [g.id, Boolean(g.gst)]));
  const cloudMap = new Map((cloud ?? []).map((g) => [g.id, Boolean(g.gst)]));
  return merged.map((g) => ({
    ...g,
    gst: localMap.has(g.id)
      ? Boolean(localMap.get(g.id))
      : Boolean(cloudMap.get(g.id) ?? g.gst),
  }));
}
