import { parseAppRole, roleAccess, type AppRole } from "./roles.ts";
import { normalizeUsername } from "./hotel-login.ts";

export type HotelUserRow = {
  id: string;
  ownerId: string;
  name: string;
  username: string;
  role: AppRole;
  createdAt: string;
};

/** Quick-add names the hotel asked for. Kali (and the house logins) open Complaints + Inventory. */
export const HOUSE_STAFF_PRESETS: readonly {
  name: string;
  username: string;
  role: AppRole;
}[] = [
  { name: "Kali", username: "kali", role: "housekeeping" },
  { name: "House", username: "house", role: "housekeeping" },
  { name: "Housekeeping", username: "housekeeping", role: "housekeeping" },
];

export function hotelUserFromRow(r: Record<string, unknown>): HotelUserRow {
  return {
    id: String(r.id ?? ""),
    ownerId: String(r.owner_id ?? r.ownerId ?? ""),
    name: String(r.name ?? "").trim(),
    username: normalizeUsername(String(r.username ?? "")),
    role: parseAppRole(r.role),
    createdAt: String(r.created_at ?? r.createdAt ?? "").slice(0, 10),
  };
}

export function mergeHotelUserLists(
  fromUsers: HotelUserRow[],
  fromHotel: HotelUserRow[],
): HotelUserRow[] {
  const map = new Map<string, HotelUserRow>();
  for (const u of fromHotel) map.set(u.username || u.id, u);
  for (const u of fromUsers) map.set(u.username || u.id, u);
  return [...map.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.username.localeCompare(b.username),
  );
}

export function missingHouseStaff(users: { username: string }[]) {
  const have = new Set(users.map((u) => normalizeUsername(u.username)));
  return HOUSE_STAFF_PRESETS.filter((p) => !have.has(p.username));
}

export function accessForUser(role: AppRole) {
  return roleAccess(role);
}
