export interface TravelAgent {
  id: string;
  name: string;
  person: string;
  phone: string;
  phone2: string;
  email: string;
  email2: string;
  gst: string;
  address: string;
  city: string;
  note: string;
}

function text(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
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
      person: text(r.person),
      phone: text(r.phone),
      phone2: text(r.phone2),
      email: text(r.email),
      email2: text(r.email2),
      gst: text(r.gst),
      address: text(r.address),
      city: text(r.city),
      note: text(r.note),
    });
  }
  return out;
}

export function agentsFromHotel(hotel: unknown): TravelAgent[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeAgents((hotel as { _agents?: unknown })._agents);
}

export function bookersFromHotel(hotel: unknown): TravelAgent[] {
  if (!hotel || typeof hotel !== "object") return [];
  return normalizeAgents((hotel as { _bookers?: unknown })._bookers);
}