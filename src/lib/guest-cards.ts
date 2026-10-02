export type GuestCard = {
  id: string;
  postingId: string;
  date: string;
  roomNo: string;
  fullName: string;
  phone: string;
  company: string;
  cameFrom: string;
  bookedBy: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeGuestCards(raw: unknown): GuestCard[] {
  if (!Array.isArray(raw)) return [];
  const out: GuestCard[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = text(r.id);
    const fullName = text(r.fullName);
    if (!id || !fullName || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      postingId: text(r.postingId),
      date: text(r.date).slice(0, 10),
      roomNo: text(r.roomNo),
      fullName,
      phone: text(r.phone),
      company: text(r.company),
      cameFrom: text(r.cameFrom),
      bookedBy: text(r.bookedBy),
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.fullName.localeCompare(b.fullName));
}

export function guestCardsFromHotel(hotel: unknown): GuestCard[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeGuestCards((hotel as { _guestCards?: unknown })._guestCards);
}
