import { type AppRole } from "./roles";
import {
  hashPassword,
  normalizeUsername,
} from "./hotel-login";
import {
  hotelUserFromRow,
  mergeHotelUserLists,
  type HotelUserRow,
} from "./hotel-user-table";
import { isSupabaseConfigured } from "./supabase-config";
import { getSupabase } from "./supabase";
import { isMissingSchema } from "./supabase-db";

export type HotelUser = HotelUserRow;
export {
  HOUSE_STAFF_PRESETS,
  mergeHotelUserLists,
  missingHouseStaff,
  accessForUser,
} from "./hotel-user-table";

function rowOf(r: Record<string, unknown>): HotelUser {
  return hotelUserFromRow(r);
}

export async function fetchPublicUser(userId: string) {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabase();
  const byId = await sb
    .from("users")
    .select("id, owner_id, name, username, role")
    .eq("id", userId)
    .maybeSingle();
  if (byId.error) {
    if (isMissingSchema(byId.error)) return null;
    throw new Error(byId.error.message);
  }
  if (byId.data) return rowOf(byId.data as Record<string, unknown>);
  return null;
}

export async function ensurePublicUser(input: {
  id: string;
  ownerId: string;
  name: string;
  username: string | null;
  role: AppRole;
}) {
  if (!isSupabaseConfigured()) return;
  const { error } = await getSupabase().from("users").upsert(
    {
      id: input.id,
      owner_id: input.ownerId,
      name: input.name,
      username: input.username ? normalizeUsername(input.username) : null,
      role: input.role,
    },
    { onConflict: "id" },
  );
  if (error && !isMissingSchema(error)) throw new Error(error.message);
}

export type HotelUsersLoad = {
  users: HotelUser[];
  usersTableOn: boolean;
  hotelUsersTableOn: boolean;
};

export async function loadHotelUsers(): Promise<HotelUsersLoad> {
  if (!isSupabaseConfigured()) {
    return { users: [], usersTableOn: false, hotelUsersTableOn: false };
  }
  const sb = getSupabase();
  const fromUsers = await sb
    .from("users")
    .select("id, owner_id, name, username, role, created_at")
    .order("name");
  const fromHotel = await sb
    .from("hotel_users")
    .select("id, owner_id, name, username, role, created_at")
    .order("name");

  const usersMissing = Boolean(fromUsers.error && isMissingSchema(fromUsers.error));
  const hotelMissing = Boolean(fromHotel.error && isMissingSchema(fromHotel.error));
  if (fromUsers.error && !usersMissing) throw new Error(fromUsers.error.message);
  if (fromHotel.error && !hotelMissing) throw new Error(fromHotel.error.message);

  const a = !fromUsers.error && fromUsers.data
    ? fromUsers.data.map((r) => rowOf(r as Record<string, unknown>))
    : [];
  const b = !fromHotel.error && fromHotel.data
    ? fromHotel.data.map((r) => rowOf(r as Record<string, unknown>))
    : [];

  return {
    users: mergeHotelUserLists(a, b),
    usersTableOn: !usersMissing,
    hotelUsersTableOn: !hotelMissing,
  };
}

export async function listHotelUsers(): Promise<HotelUser[]> {
  return (await loadHotelUsers()).users;
}

function isDuplicateName(message: string) {
  const msg = message.toLowerCase();
  return msg.includes("duplicate") || msg.includes("unique");
}

export async function createHotelUser(input: {
  name: string;
  username: string;
  password: string;
  role: AppRole;
}): Promise<HotelUser> {
  const name = input.name.trim();
  const username = normalizeUsername(input.username);
  if (!name) throw new Error("Enter a name");
  if (username.length < 3) throw new Error("Username must be at least 3 letters");
  if (input.password.length < 6) throw new Error("Password must be at least 6 characters");

  if (!isSupabaseConfigured()) {
    throw new Error("Cloud is not connected, so the account cannot be saved yet.");
  }

  const sb = getSupabase();
  const { data: sessionData, error: sessionErr } = await sb.auth.getSession();
  if (sessionErr) throw new Error(sessionErr.message);
  const adminSession = sessionData.session;
  const ownerId = adminSession?.user.id;
  if (!ownerId || !adminSession) throw new Error("Sign in as Admin first");

  const viaRpc = await sb.rpc("create_staff_login", {
    p_name: name,
    p_username: username,
    p_password: input.password,
    p_hash: hashPassword(input.password),
    p_role: input.role,
  });
  if (!viaRpc.error && viaRpc.data) {
    const row = rowOf(
      (typeof viaRpc.data === "object" && viaRpc.data
        ? viaRpc.data
        : {}) as Record<string, unknown>,
    );
    if (row.id && row.username) return row;
  }
  if (viaRpc.error && !isMissingSchema(viaRpc.error)) {
    const msg = viaRpc.error.message.toLowerCase();
    if (!msg.includes("could not find the function") && !msg.includes("schema cache")) {
      throw new Error(viaRpc.error.message);
    }
  }

  throw new Error(
    "Staff login SQL is not in the account yet. Copy Users SQL, Run it in Supabase, then Save this user again. No email is sent.",
  );
}

export async function deleteHotelUser(input: {
  id: string;
  username: string;
  selfId?: string | null;
}): Promise<void> {
  const username = normalizeUsername(input.username);
  if (!username && !input.id) throw new Error("Pick a user to delete");
  if (input.selfId && input.id && input.id === input.selfId) {
    throw new Error("Cannot delete your own login");
  }
  if (!isSupabaseConfigured()) {
    throw new Error("Cloud is not connected, so the account cannot be saved yet.");
  }
  const sb = getSupabase();
  const { data: sessionData, error: sessionErr } = await sb.auth.getSession();
  if (sessionErr) throw new Error(sessionErr.message);
  if (!sessionData.session) throw new Error("Sign in as Admin first");

  const viaRpc = await sb.rpc("delete_staff_login", {
    p_id: input.id || null,
    p_username: username,
  });
  if (!viaRpc.error) return;
  if (!isMissingSchema(viaRpc.error)) {
    const msg = viaRpc.error.message.toLowerCase();
    if (!msg.includes("could not find the function") && !msg.includes("schema cache")) {
      throw new Error(viaRpc.error.message);
    }
  }

  const ownerId = sessionData.session.user.id;
  if (input.id) {
    const fromUsers = await sb.from("users").delete().eq("id", input.id).neq("id", ownerId);
    if (fromUsers.error && !isMissingSchema(fromUsers.error)) {
      throw new Error(fromUsers.error.message);
    }
  }
  if (username) {
    const fromHotel = await sb
      .from("hotel_users")
      .delete()
      .eq("owner_id", ownerId)
      .eq("username", username);
    if (fromHotel.error && !isMissingSchema(fromHotel.error)) {
      throw new Error(fromHotel.error.message);
    }
    const fromName = await sb
      .from("users")
      .delete()
      .eq("username", username)
      .neq("id", ownerId);
    if (fromName.error && !isMissingSchema(fromName.error)) {
      throw new Error(fromName.error.message);
    }
  }
}

export async function loginHotelUser(
  username: string,
  password: string,
): Promise<HotelUser | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabase().rpc("login_hotel_user", {
    p_username: normalizeUsername(username),
    p_hash: hashPassword(password),
  });
  if (error) {
    if (isMissingSchema(error)) return null;
    throw new Error(error.message);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return rowOf(row as Record<string, unknown>);
}
