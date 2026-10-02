export const APP_ROLES = ["admin", "supervisor", "staff", "housekeeping", "owner"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  staff: "Staff",
  housekeeping: "Housekeeping",
  owner: "Owner",
};

export const HOUSEKEEPING_PATHS = ["/complaints", "/inventory", "/login"] as const;

export const OWNER_PATHS = [
  "/",
  "/expenses",
  "/balance",
  "/bank-recon",
  "/staff",
  "/complaints",
  "/reminders",
  "/reports",
  "/login",
] as const;

export function parseAppRole(value: unknown): AppRole {
  if (value === "housekeeping") return "housekeeping";
  if (value === "supervisor") return "supervisor";
  if (value === "staff") return "staff";
  if (value === "owner") return "owner";
  return "admin";
}

export function canOpenPath(role: AppRole, path: string) {
  if (path === "/login") return true;
  if (role === "housekeeping") {
    return (HOUSEKEEPING_PATHS as readonly string[]).includes(path);
  }
  if (role === "owner") {
    return (OWNER_PATHS as readonly string[]).includes(path);
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
  if (role === "owner") return ["/", "/expenses", "/balance", "/reports"];
  if (role === "staff") return ["/", "/register", "/complaints", "/profile"];
  return ["/", "/register", "/balance", "/reports"];
}

export function canWrite(role: AppRole) {
  return role !== "owner";
}

export function canCountInventory(_role: AppRole) {
  return true;
}

export function canEditComplaints(role: AppRole) {
  return role !== "owner";
}

export function canManageCatalog(role: AppRole) {
  return role !== "housekeeping" && role !== "owner";
}

export function canAddUsers(role: AppRole) {
  return role !== "housekeeping" && role !== "owner";
}

export function roleAccess(role: AppRole) {
  if (role === "housekeeping") return "Complaints + inventory";
  if (role === "staff") return "Register";
  if (role === "owner") return "View only";
  return "Full books";
}