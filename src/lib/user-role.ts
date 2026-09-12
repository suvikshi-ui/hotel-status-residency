import { parseAppRole, type AppRole } from "./roles.ts";

/** Role comes only from public.users.role — never auth.users metadata. */
export function roleFromUsersTable(value: unknown): AppRole {
  return parseAppRole(value);
}
