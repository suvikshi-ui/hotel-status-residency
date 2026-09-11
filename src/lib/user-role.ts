import type { AppRole } from "./roles";

/** Role comes only from public.users.role — never auth.users metadata. */
export function roleFromUsersTable(value: unknown): AppRole {
  return value === "housekeeping" ? "housekeeping" : "admin";
}
