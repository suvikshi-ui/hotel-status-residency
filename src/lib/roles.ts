export const APP_ROLES = ["admin", "supervisor", "staff", "housekeeping"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  staff: "Staff",
  housekeeping: "Housekeeping",
};

export const HOUSEKEEPING_PATHS = ["/complaints", "/inventory", "/profile", "/login"] as const;

export function parseAppRole(value: unknown): AppRole {
  if (value === "housekeeping") return "housekeeping";
  if (value === "supervisor") return "supervisor";
  if (value === "staff") return "staff";
  return "admin";
}

export function canOpenPath(role: AppRole, path: string) {
  if (path === "/login") return true;
  if (role === "housekeeping") {
    return (HOUSEKEEPING_PATHS as readonly string[]).includes(path);
  }
  return true;
}

export function homePath(role: AppRole) {
  return role === "housekeeping" ? "/complaints" : "/";
}

export function navFor(role: AppRole, items: readonly { to: string }[]) {
  return items.filter((item) => canOpenPath(role, item.to));
}

export function bottomNavPaths(role: AppRole): readonly string[] {
  if (role === "housekeeping") return ["/complaints", "/inventory"];
  if (role === "staff") return ["/", "/register", "/complaints", "/profile"];
  return ["/", "/register", "/balance", "/reports"];
}

export function canCountInventory(_role: AppRole) {
  return true;
}

export function canEditComplaints(_role: AppRole) {
  return true;
}

export function canManageCatalog(role: AppRole) {
  return role !== "housekeeping";
}

export function canAddUsers(role: AppRole) {
  return role !== "housekeeping";
}

export function roleAccess(role: AppRole) {
  if (role === "housekeeping") return "Complaints + Inventory";
  if (role === "staff") return "Register";
  return "Full books";
}
