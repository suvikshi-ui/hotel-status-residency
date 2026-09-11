export const APP_ROLES = ["admin", "housekeeping"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  housekeeping: "Housekeeping",
};

const HOUSEKEEPING_PATHS = new Set([
  "/complaints",
  "/inventory",
  "/profile",
]);

export function parseAppRole(value: unknown): AppRole {
  return value === "housekeeping" ? "housekeeping" : "admin";
}

export function canOpenPath(role: AppRole, path: string) {
  if (role === "admin") return true;
  if (path === "/login") return true;
  return HOUSEKEEPING_PATHS.has(path);
}

export function homePath(role: AppRole) {
  return role === "housekeeping" ? "/complaints" : "/";
}

export function navFor(role: AppRole, items: readonly { to: string }[]) {
  return items.filter((item) => canOpenPath(role, item.to));
}

export function canCountInventory(role: AppRole) {
  return role === "admin" || role === "housekeeping";
}

export function canEditComplaints(role: AppRole) {
  return role === "admin" || role === "housekeeping";
}

export function canManageCatalog(role: AppRole) {
  return role === "admin";
}
