export interface HotelContact {
  id: string;
  topic: string;
  name: string;
  phone: string;
  address: string;
}

export function normalizeContacts(raw: unknown): HotelContact[] {
  if (!Array.isArray(raw)) return [];
  const out: HotelContact[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const topic = typeof r.topic === "string" ? r.topic.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim() : "";
    const phone = typeof r.phone === "string" ? r.phone.trim() : "";
    const address = typeof r.address === "string" ? r.address.trim() : "";
    if (!id || !topic || !name || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, topic, name, phone, address });
  }
  return out;
}

export function contactsFromHotel(hotel: unknown): HotelContact[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeContacts((hotel as { _contacts?: unknown })._contacts);
}
