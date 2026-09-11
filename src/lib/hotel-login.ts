import { hashCode } from "./pin";

export const USER_EMAIL_DOMAIN = "status-residency.local";

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

export function usernameToEmail(username: string) {
  return `${normalizeUsername(username)}@${USER_EMAIL_DOMAIN}`;
}

export function hashPassword(password: string) {
  return hashCode(`user:${password}`);
}

export function loginIsEmail(value: string) {
  return value.trim().includes("@");
}
