export const BACKUP_KIND = "hotel-status-residency-backup";
export const BACKUP_VERSION = 1;

export type BackupTables = {
  hotel?: unknown;
  opening?: unknown;
  rooms?: unknown[];
  guests?: unknown[];
  food?: unknown[];
  wholesale?: unknown[];
  expenses?: unknown[];
  balReceived?: unknown[];
  staff?: unknown[];
  advances?: unknown[];
  ota?: unknown[];
  janSales?: unknown[];
  janFood?: unknown[];
  creditGuests?: unknown[];
  selectedDate?: string;
  openingDate?: string;
  securityCode?: string;
  lockedDates?: unknown;
  inventory?: unknown[];
  complaints?: unknown[];
  savedAt?: number;
};

export type LedgerBackupFile = {
  kind: typeof BACKUP_KIND;
  version: number;
  savedAt: string;
  tables: BackupTables;
};

export function buildBackupFile(tables: BackupTables): LedgerBackupFile {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    savedAt: new Date().toISOString(),
    tables,
  };
}

export function backupFilename(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return `HSR-backup-${day}.json`;
}

export function parseBackupFile(raw: unknown): LedgerBackupFile {
  if (!raw || typeof raw !== "object") {
    throw new Error("Not a hotel backup file");
  }
  const p = raw as Record<string, unknown>;
  const wrapped = p.kind === BACKUP_KIND && p.tables && typeof p.tables === "object";
  const tables = (wrapped ? p.tables : p) as BackupTables;
  const guests = tables.guests;
  const rooms = tables.rooms;
  if (!Array.isArray(guests) && !Array.isArray(rooms)) {
    throw new Error("Not a hotel backup file");
  }
  return {
    kind: BACKUP_KIND,
    version: Number(p.version) || BACKUP_VERSION,
    savedAt: typeof p.savedAt === "string" ? p.savedAt : new Date().toISOString(),
    tables,
  };
}

export function backupCounts(s: {
  guests?: unknown[];
  food?: unknown[];
  wholesale?: unknown[];
  expenses?: unknown[];
  balReceived?: unknown[];
  staff?: unknown[];
  rooms?: unknown[];
  inventory?: unknown[];
  complaints?: unknown[];
}) {
  const dated = [
    ...(s.guests ?? []),
    ...(s.food ?? []),
    ...(s.wholesale ?? []),
    ...(s.expenses ?? []),
    ...(s.balReceived ?? []),
  ] as { date?: string }[];
  return {
    guests: s.guests?.length ?? 0,
    food: s.food?.length ?? 0,
    wholesale: s.wholesale?.length ?? 0,
    expenses: s.expenses?.length ?? 0,
    balReceived: s.balReceived?.length ?? 0,
    staff: s.staff?.length ?? 0,
    rooms: s.rooms?.length ?? 0,
    inventory: s.inventory?.length ?? 0,
    complaints: s.complaints?.length ?? 0,
    dates: [
      ...new Set(dated.map((r) => (r.date ?? "").slice(0, 10)).filter(Boolean)),
    ].sort(),
  };
}

export function downloadBackupJson(file: LedgerBackupFile, filename: string) {
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
