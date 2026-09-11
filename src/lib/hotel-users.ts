import { parseAppRole, type AppRole } from "./roles";
import {
  hashPassword,
  normalizeUsername,
  usernameToEmail,
} from "./hotel-login";
import { isSupabaseConfigured } from "./supabase-config";
import { getSupabase } from "./supabase";
import { isMissingSchema } from "./supabase-db";

export interface HotelUser {
  id: string;
  ownerId: string;
  name: string;
  username: string;
  role: AppRole;
  createdAt: string;
}

function rowOf(r: Record<string, unknown>): HotelUser {
  return {
    id: String(r.id ?? ""),
    ownerId: String(r.owner_id ?? r.ownerId ?? ""),
    name: String(r.name ?? "").trim(),
    username: normalizeUsername(String(r.username ?? "")),
    role: parseAppRole(r.role),
    createdAt: String(r.created_at ?? r.createdAt ?? "").slice(0, 10),
  };
}

export async function fetchPublicUser(userId: string, username?: string | null) {
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

  const uname = username ? normalizeUsername(username) : "";
  if (!uname) return null;

  const byName = await sb
    .from("users")
    .select("id, owner_id, name, username, role")
    .ilike("username", uname)
    .maybeSingle();
  if (byName.data) return rowOf(byName.data as Record<string, unknown>);

  const hotel = await sb
    .from("hotel_users")
    .select("id, owner_id, name, username, role, created_at")
    .ilike("username", uname)
    .maybeSingle();
  if (hotel.data) return rowOf(hotel.data as Record<string, unknown>);
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

export async function listHotelUsers(): Promise<HotelUser[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabase();
  const fromUsers = await sb
    .from("users")
    .select("id, owner_id, name, username, role")
    .order("name");
  if (!fromUsers.error && fromUsers.data?.length) {
    return fromUsers.data.map((r) => rowOf(r as Record<string, unknown>));
  }
  const { data, error } = await sb
    .from("hotel_users")
    .select("id, owner_id, name, username, role, created_at")
    .order("name");
  if (error) {
    if (isMissingSchema(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => rowOf(r as Record<string, unknown>));
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

  const { data: inserted, error: insertErr } = await sb
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

  if (insertErr) {
    if (isMissingSchema(insertErr)) {
      throw new Error("User table is missing. Run the latest SQL in Supabase, then retry.");
    }
    const msg = insertErr.message.toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      throw new Error("That username is already taken");
    }
    throw new Error(insertErr.message);
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
  await sb.auth.setSession(adminSession);
  if (signErr) {
    const msg = signErr.message.toLowerCase();
    if (!msg.includes("already")) {
      throw new Error(signErr.message);
    }
  }

  const authId = signed?.user?.id;
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
    if (usersErr && !isMissingSchema(usersErr)) {
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

  return rowOf((inserted ?? {}) as Record<string, unknown>);
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
