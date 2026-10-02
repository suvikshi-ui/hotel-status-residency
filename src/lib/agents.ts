export interface TravelAgent {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  note: string;
}

export function normalizeAgents(raw: unknown): TravelAgent[] {
  if (!Array.isArray(raw)) return [];
  const out: TravelAgent[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      name,
      phone: typeof r.phone === "string" ? r.phone.trim() : "",
      email: typeof r.email === "string" ? r.email.trim() : "",
      address: typeof r.address === "string" ? r.address.trim() : "",
      city: typeof r.city === "string" ? r.city.trim() : "",
      note: typeof r.note === "string" ? r.note.trim() : "",
    });
  }
  return out;
}

export function agentsFromHotel(hotel: unknown): TravelAgent[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeAgents((hotel as { _agents?: unknown })._agents);
}
