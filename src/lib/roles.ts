export const APP_ROLES = ["admin", "supervisor", "staff", "housekeeping"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  staff: "Staff",
  housekeeping: "Housekeeping",
};

const HOUSEKEEPING_PATHS = new Set(["/complaints"]);

const STAFF_PATHS = new Set([
  "/",
  "/register",
  "/rooms",
  "/complaints",
  "/profile",
]);

export function parseAppRole(value: unknown): AppRole {
  if (value === "housekeeping") return "housekeeping";
  if (value === "supervisor") return "supervisor";
  if (value === "staff") return "staff";
  return "admin";
}

export function canOpenPath(role: AppRole, path: string) {
  if (role === "admin" || role === "supervisor") return true;
  if (path === "/login") return true;
  if (role === "staff") return STAFF_PATHS.has(path);
  return HOUSEKEEPING_PATHS.has(path);
}

export function homePath(role: AppRole) {
  if (role === "housekeeping") return "/complaints";
  if (role === "staff") return "/register";
  return "/";
}

export function navFor(role: AppRole, items: readonly { to: string }[]) {
  return items.filter((item) => canOpenPath(role, item.to));
}

export function canCountInventory(role: AppRole) {
  return role === "admin" || role === "supervisor";
}

export function canEditComplaints(role: AppRole) {
  return role === "admin" || role === "supervisor" || role === "housekeeping" || role === "staff";
}

export function canManageCatalog(role: AppRole) {
  return role === "admin" || role === "supervisor";
}

export function canAddUsers(role: AppRole) {
  return role === "admin";
}
