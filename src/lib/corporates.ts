export interface CorporateCompany {
  id: string;
  name: string;
  gst: string;
  bookingAmount: number;
  address: string;
  city: string;
  person: string;
  phone: string;
  phone2: string;
  email: string;
  email2: string;
  note: string;
}

function text(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export function normalizeCorporates(raw: unknown): CorporateCompany[] {
  if (!Array.isArray(raw)) return [];
  const out: CorporateCompany[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    const amount = Number(r.bookingAmount);
    out.push({
      id,
      name,
      gst: text(r.gst),
      bookingAmount: Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0,
      address: text(r.address),
      city: text(r.city),
      person: text(r.person),
      phone: text(r.phone),
      phone2: text(r.phone2),
      email: text(r.email),
      email2: text(r.email2),
      note: text(r.note),
    });
  }
  return out;
}

export function corporatesFromHotel(hotel: unknown): CorporateCompany[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeCorporates((hotel as { _corporates?: unknown })._corporates);
}
