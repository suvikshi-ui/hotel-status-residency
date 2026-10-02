export interface CorporateCompany {
  id: string;
  name: string;
  gst: string;
  bookingAmount: number;
  address: string;
  person: string;
  phone: string;
  email: string;
  note: string;
}

export function normalizeCorporates(raw: unknown): CorporateCompany[] {
  if (!Array.isArray(raw)) return [];
  const out: CorporateCompany[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!id || !name) continue;
    const amount = Number(r.bookingAmount);
    out.push({
      id,
      name,
      gst: typeof r.gst === "string" ? r.gst.trim() : "",
      bookingAmount: Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0,
      address: typeof r.address === "string" ? r.address.trim() : "",
      person: typeof r.person === "string" ? r.person.trim() : "",
      phone: typeof r.phone === "string" ? r.phone.trim() : "",
      email: typeof r.email === "string" ? r.email.trim() : "",
      note: typeof r.note === "string" ? r.note.trim() : "",
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function corporatesFromHotel(hotel: unknown): CorporateCompany[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeCorporates((hotel as { _corporates?: unknown })._corporates);
}
