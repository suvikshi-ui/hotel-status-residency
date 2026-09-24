import { normalizeInventoryFiles, type InventoryFile } from "./inventory";

const PREFIX = "hsr-house-files:";

export function writeHouseFiles(ownerId: string, files: InventoryFile[]) {
  if (typeof localStorage === "undefined") return;
  if (!ownerId || ownerId === "anon") return;
  localStorage.setItem(PREFIX + ownerId, JSON.stringify(normalizeInventoryFiles(files)));
}

export function readHouseFiles(ownerId: string): InventoryFile[] {
  if (typeof localStorage === "undefined") return [];
  if (!ownerId || ownerId === "anon") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(PREFIX + ownerId) || "[]");
    return normalizeInventoryFiles(Array.isArray(raw) ? raw : []);
  } catch {
    return [];
  }
}
