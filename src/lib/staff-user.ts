import type { AppRole } from "./roles";

export type StaffUser = {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  role: AppRole;
  ownerId: string;
};

export function sameStaffUser(a: StaffUser | null, b: StaffUser | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.ownerId === b.ownerId &&
    a.role === b.role &&
    a.email === b.email
  );
}

export function authEventReloadsBooks(event: string) {
  return event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED";
}
