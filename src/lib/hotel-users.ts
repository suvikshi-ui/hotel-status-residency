import { type AppRole } from "./roles";
import {
  hashPassword,
  normalizeUsername,
  usernameToEmail,
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

  let hotelRow: HotelUser | null = null;
  const inserted = await sb
    .from("hotel_users")
    .insert({
      owner_id: ownerId,
      name,
      username,
      password_hash: hashPassword(input.password),
      role: input.role,
    })
    .select("id, owner_id, name, username, role, created_at")
    .single();

  if (inserted.error) {
    if (!isMissingSchema(inserted.error) && !isDuplicateName(inserted.error.message)) {
      throw new Error(inserted.error.message);
    }
  } else if (inserted.data) {
    hotelRow = rowOf(inserted.data as Record<string, unknown>);
  }

  const { data: signed, error: signErr } = await sb.auth.signUp({
    email: usernameToEmail(username),
    password: input.password,
    options: {
      data: {
        full_name: name,
        username,
        role: input.role,
        owner_id: ownerId,
      },
    },
  });

  let authId = signed?.user?.id ?? null;
  if (signErr) {
    const msg = signErr.message.toLowerCase();
    if (!msg.includes("already")) {
      await sb.auth.setSession(adminSession);
      throw new Error(signErr.message);
    }
    const { data: existing } = await sb.auth.signInWithPassword({
      email: usernameToEmail(username),
      password: input.password,
    });
    authId = existing.user?.id ?? authId;
  }
  await sb.auth.setSession(adminSession);

  if (authId) {
    const { error: usersErr } = await sb.from("users").upsert(
      {
        id: authId,
        owner_id: ownerId,
        name,
        username,
        role: input.role,
      },
      { onConflict: "id" },
    );
    if (usersErr) {
      if (isMissingSchema(usersErr)) {
        throw new Error(
          "Users table is off. Copy the SQL, run it in Supabase, then add the user again.",
        );
      }
      if (isDuplicateName(usersErr.message)) {
        throw new Error("That username is already taken");
      }
      throw new Error(usersErr.message);
    }
    return {
      id: authId,
      ownerId,
      name,
      username,
      role: input.role,
      createdAt: new Date().toISOString().slice(0, 10),
    };
  }

  if (hotelRow) return hotelRow;
  throw new Error("Could not create the login. Try a different username.");
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
