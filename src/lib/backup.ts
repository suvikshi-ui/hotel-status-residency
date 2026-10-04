import { omitSealed, parseSealedIds, sealKey, withSealed, type SealedIds } from "./sheet-seal.ts";

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
  staffRegister?: unknown[];
  payrollFiles?: unknown[];
  advances?: unknown[];
  ota?: unknown[];
  janSales?: unknown[];
  janFood?: unknown[];
  creditGuests?: unknown[];
  selectedDate?: string;
  openingDate?: string;
  securityCode?: string;
  lockedDates?: unknown;
  lockRev?: unknown;
  inventory?: unknown[];
  inventoryFiles?: unknown[];
  complaints?: unknown[];
  reminders?: unknown[];
  contacts?: unknown[];
  corporates?: unknown[];
  agents?: unknown[];
  guestCards?: unknown[];
  monthDraws?: unknown[];
  monthOpenings?: unknown[];
  monthArchives?: unknown[];
  openMonths?: string[];
  bankRows?: unknown[];
  sealedIds?: unknown;
  deletedIds?: unknown;
  savedAt?: number;
};

export type LedgerBackupFile = {
  kind: typeof BACKUP_KIND;
  version: number;
  savedAt: string;
  /** Set on a one-month file. Old full files omit this. */
  month?: string;
  tables: BackupTables;
};

export function buildBackupFile(tables: BackupTables, month?: string): LedgerBackupFile {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    savedAt: new Date().toISOString(),
    ...(month && /^\d{4}-\d{2}$/.test(month) ? { month } : {}),
    tables,
  };
}

export function backupFilename(monthOrNow: string | Date = new Date()) {
  if (typeof monthOrNow === "string" && /^\d{4}-\d{2}$/.test(monthOrNow)) {
    return `HSR-backup-${monthOrNow}.json`;
  }
  const now = monthOrNow instanceof Date ? monthOrNow : new Date();
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
    month: typeof p.month === "string" && /^\d{4}-\d{2}$/.test(p.month) ? p.month : undefined,
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
  staffRegister?: unknown[];
  payrollFiles?: unknown[];
  rooms?: unknown[];
  inventory?: unknown[];
  inventoryFiles?: unknown[];
  complaints?: unknown[];
  reminders?: unknown[];
  contacts?: unknown[];
  corporates?: unknown[];
  agents?: unknown[];
  guestCards?: unknown[];
  bankRows?: unknown[];
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
    staffRegister: s.staffRegister?.length ?? 0,
    payrollFiles: s.payrollFiles?.length ?? 0,
    rooms: s.rooms?.length ?? 0,
    inventory: s.inventory?.length ?? 0,
    inventoryFiles: s.inventoryFiles?.length ?? 0,
    complaints: s.complaints?.length ?? 0,
    reminders: s.reminders?.length ?? 0,
    contacts: s.contacts?.length ?? 0,
    corporates: s.corporates?.length ?? 0,
    agents: s.agents?.length ?? 0,
    guestCards: s.guestCards?.length ?? 0,
    bankRows: s.bankRows?.length ?? 0,
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

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(month: string) {
  const [year, m] = month.split("-");
  const name = MONTH_NAMES[Number(m) - 1] ?? month;
  return `${name} ${year ?? ""}`.trim();
}

function monthToken(value: unknown): string {
  if (typeof value !== "string") return "";
  const hit = value.match(/(\d{4}-\d{2})/);
  return hit?.[1] ?? "";
}

function rowMonth(row: unknown): string {
  if (!row || typeof row !== "object") return "";
  const rec = row as Record<string, unknown>;
  return (
    monthToken(rec.month) ||
    monthToken(rec.period) ||
    monthToken(rec.date) ||
    monthToken(rec.checkIn) ||
    monthToken(rec.createdAt)
  );
}

function hotelBag(tables: BackupTables): Record<string, unknown> {
  const hotel = tables.hotel;
  if (!hotel || typeof hotel !== "object" || Array.isArray(hotel)) return {};
  return hotel as Record<string, unknown>;
}

function booksBag(hotel: Record<string, unknown>): Record<string, unknown> {
  const books = hotel._books;
  if (!books || typeof books !== "object" || Array.isArray(books)) return {};
  return books as Record<string, unknown>;
}

function listFrom(tables: BackupTables, key: keyof BackupTables, embedded?: string): unknown[] {
  const primary = tables[key];
  if (Array.isArray(primary)) return primary;
  const hotel = hotelBag(tables);
  const books = booksBag(hotel);
  if (Array.isArray(books[key])) return books[key] as unknown[];
  if (embedded && Array.isArray(hotel[embedded])) return hotel[embedded] as unknown[];
  return [];
}

function recordFrom(
  tables: BackupTables,
  key: keyof BackupTables,
  embedded?: string,
): Record<string, unknown> {
  const primary = tables[key];
  if (primary && typeof primary === "object" && !Array.isArray(primary)) {
    return primary as Record<string, unknown>;
  }
  const hotel = hotelBag(tables);
  if (embedded && hotel[embedded] && typeof hotel[embedded] === "object" && !Array.isArray(hotel[embedded])) {
    return hotel[embedded] as Record<string, unknown>;
  }
  return {};
}

function openList(tables: BackupTables): string[] {
  if (Array.isArray(tables.openMonths)) {
    return tables.openMonths.filter((month): month is string => typeof month === "string");
  }
  const raw = hotelBag(tables)._openMonths;
  return Array.isArray(raw) ? raw.filter((month): month is string => typeof month === "string") : [];
}

function thinHotel(hotel: unknown) {
  if (!hotel || typeof hotel !== "object" || Array.isArray(hotel)) return hotel;
  const row = hotel as Record<string, unknown>;
  return {
    name: row.name,
    blessing: row.blessing,
    place: row.place,
    dailyTarget: row.dailyTarget,
    month: row.month,
  };
}

function filterMonth(rows: unknown[], month: string) {
  return rows.filter((row) => rowMonth(row) === month);
}

function filterKeys(record: Record<string, unknown>, month: string) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith(month)) out[key] = value;
  }
  return out;
}

/** Months that actually have rows, locks, or an opening in this file. */
export function monthsInTables(tables: BackupTables): string[] {
  const found = new Set<string>();
  const lists: unknown[][] = [
    listFrom(tables, "guests"),
    listFrom(tables, "food"),
    listFrom(tables, "wholesale"),
    listFrom(tables, "expenses"),
    listFrom(tables, "balReceived"),
    listFrom(tables, "staff"),
    listFrom(tables, "advances"),
    listFrom(tables, "payrollFiles"),
    listFrom(tables, "inventoryFiles"),
    listFrom(tables, "bankRows", "_bankRows"),
    listFrom(tables, "guestCards", "_guestCards"),
    listFrom(tables, "complaints"),
    listFrom(tables, "monthOpenings", "_monthOpenings"),
    listFrom(tables, "monthDraws", "_monthDraws"),
    listFrom(tables, "monthArchives", "_monthArchives"),
    listFrom(tables, "janSales"),
    listFrom(tables, "janFood"),
    listFrom(tables, "ota"),
  ];
  for (const rows of lists) {
    for (const row of rows) {
      const month = rowMonth(row);
      if (month) found.add(month);
    }
  }
  for (const key of Object.keys(recordFrom(tables, "lockedDates", "_lockedDates"))) {
    const month = monthToken(key);
    if (month) found.add(month);
  }
  for (const month of openList(tables)) {
    if (/^\d{4}-\d{2}$/.test(month)) found.add(month);
  }
  return [...found].sort();
}

/** One month of books, plus the master lists (rooms, contacts) so an empty desk can still open. */
export function sliceBackupTables(tables: BackupTables, month: string): BackupTables {
  const locks = recordFrom(tables, "lockedDates", "_lockedDates");
  const rev = recordFrom(tables, "lockRev", "_lockRev");
  const open = openList(tables);
  return {
    hotel: thinHotel(tables.hotel),
    opening: tables.opening,
    rooms: listFrom(tables, "rooms"),
    guests: filterMonth(listFrom(tables, "guests"), month),
    food: filterMonth(listFrom(tables, "food"), month),
    wholesale: filterMonth(listFrom(tables, "wholesale"), month),
    expenses: filterMonth(listFrom(tables, "expenses"), month),
    balReceived: filterMonth(listFrom(tables, "balReceived"), month),
    staff: filterMonth(listFrom(tables, "staff"), month),
    staffRegister: listFrom(tables, "staffRegister"),
    payrollFiles: filterMonth(listFrom(tables, "payrollFiles"), month),
    advances: filterMonth(listFrom(tables, "advances"), month),
    ota: filterMonth(listFrom(tables, "ota"), month),
    janSales: filterMonth(listFrom(tables, "janSales"), month),
    janFood: filterMonth(listFrom(tables, "janFood"), month),
    creditGuests: listFrom(tables, "creditGuests"),
    selectedDate: `${month}-01`,
    openingDate: tables.openingDate,
    securityCode: tables.securityCode,
    lockedDates: filterKeys(locks, month),
    lockRev: filterKeys(rev, month),
    inventory: listFrom(tables, "inventory"),
    inventoryFiles: filterMonth(listFrom(tables, "inventoryFiles"), month),
    complaints: filterMonth(listFrom(tables, "complaints"), month),
    reminders: listFrom(tables, "reminders", "_reminders"),
    contacts: listFrom(tables, "contacts", "_contacts"),
    corporates: listFrom(tables, "corporates", "_corporates"),
    agents: listFrom(tables, "agents", "_agents"),
    guestCards: filterMonth(listFrom(tables, "guestCards", "_guestCards"), month),
    monthDraws: filterMonth(listFrom(tables, "monthDraws", "_monthDraws"), month),
    monthOpenings: filterMonth(listFrom(tables, "monthOpenings", "_monthOpenings"), month),
    monthArchives: filterMonth(listFrom(tables, "monthArchives", "_monthArchives"), month),
    openMonths: open.includes(month) ? [month] : [],
    bankRows: filterMonth(listFrom(tables, "bankRows", "_bankRows"), month),
    sealedIds: tables.sealedIds,
    deletedIds: tables.deletedIds,
    savedAt: tables.savedAt,
  };
}

type IdRow = {
  id?: string;
  date?: string;
  month?: string;
  period?: string;
  createdAt?: string;
  no?: string;
  slNo?: number;
};

export type MonthBookShape = {
  guests?: IdRow[];
  food?: IdRow[];
  wholesale?: IdRow[];
  expenses?: IdRow[];
  balReceived?: IdRow[];
  staff?: IdRow[];
  advances?: IdRow[];
  payrollFiles?: IdRow[];
  inventoryFiles?: IdRow[];
  complaints?: IdRow[];
  guestCards?: IdRow[];
  bankRows?: IdRow[];
  monthDraws?: IdRow[];
  monthOpenings?: IdRow[];
  monthArchives?: { month?: string }[];
  janSales?: { date?: string }[];
  janFood?: { date?: string }[];
  ota?: { checkIn?: string; checkOut?: string }[];
  rooms?: { no: string }[];
  staffRegister?: IdRow[];
  inventory?: IdRow[];
  reminders?: IdRow[];
  contacts?: IdRow[];
  corporates?: IdRow[];
  agents?: IdRow[];
  creditGuests?: unknown[];
  lockedDates?: Record<string, true>;
  lockRev?: Record<string, number>;
  openMonths?: string[];
  deletedIds?: SealedIds;
  sealedIds?: SealedIds;
  opening?: { cash?: number; santosh?: number; pk?: number; online?: number; outstanding?: number };
  securityCode?: string;
  selectedDate?: string;
};

function replaceMonthRows<T>(base: T[] | undefined, incoming: T[] | undefined, month: string): T[] {
  const kept = (base ?? []).filter((row) => rowMonth(row) !== month);
  const add = (incoming ?? []).filter((row) => rowMonth(row) === month);
  return [...kept, ...add];
}

function replaceMonthRecord<T>(
  base: Record<string, T> | undefined,
  incoming: Record<string, T> | undefined,
  month: string,
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(base ?? {})) {
    if (!key.startsWith(month)) out[key] = value as T;
  }
  for (const [key, value] of Object.entries(incoming ?? {})) {
    if (key.startsWith(month)) out[key] = value as T;
  }
  return out;
}

function unionBy<T extends object>(base: T[] | undefined, incoming: T[] | undefined, keyOf: (row: T) => string): T[] {
  const next = new Map<string, T>();
  const order: string[] = [];
  for (const row of [...(base ?? []), ...(incoming ?? [])]) {
    const id = keyOf(row);
    if (!id) continue;
    if (!next.has(id)) order.push(id);
    next.set(id, row);
  }
  return order.map((id) => next.get(id)!);
}

function rowKey(row: IdRow) {
  return row.id ?? "";
}

function money(opening: MonthBookShape["opening"]) {
  if (!opening) return false;
  return [opening.cash, opening.santosh, opening.pk, opening.online, opening.outstanding].some(
    (n) => Math.abs(Number(n) || 0) > 0,
  );
}

function idsOf(rows: IdRow[] | undefined) {
  return new Set((rows ?? []).map(rowKey).filter(Boolean));
}

function sealList(rows: IdRow[] | undefined, kind: "guest" | "food" | "wholesale" | "expense" | "balance" | "complaint") {
  const keyOf =
    kind === "guest"
      ? sealKey.guest
      : kind === "food"
        ? sealKey.food
        : kind === "wholesale"
          ? sealKey.wholesale
          : kind === "expense"
            ? sealKey.expense
            : kind === "balance"
              ? sealKey.balance
              : sealKey.complaint;
  return (rows ?? []).map(rowKey).filter(Boolean).map((id) => keyOf(id));
}

/**
 * Put `incoming` month into `base`. Every other month stays.
 * Rows of `month` that are not in the file are removed. Nothing else is deleted.
 */
export function mergeMonthBooks<T extends MonthBookShape>(
  base: T,
  incoming: MonthBookShape,
  month: string,
  monthOpen: boolean,
): T {
  const guests = replaceMonthRows(base.guests, incoming.guests, month);
  const food = replaceMonthRows(base.food, incoming.food, month);
  const wholesale = replaceMonthRows(base.wholesale, incoming.wholesale, month);
  const expenses = replaceMonthRows(base.expenses, incoming.expenses, month);
  const balReceived = replaceMonthRows(base.balReceived, incoming.balReceived, month);
  const staff = replaceMonthRows(base.staff, incoming.staff, month);
  const advances = replaceMonthRows(base.advances, incoming.advances, month);
  const payrollFiles = replaceMonthRows(base.payrollFiles, incoming.payrollFiles, month);
  const inventoryFiles = replaceMonthRows(base.inventoryFiles, incoming.inventoryFiles, month);
  const complaints = replaceMonthRows(base.complaints, incoming.complaints, month);
  const guestCards = replaceMonthRows(base.guestCards, incoming.guestCards, month);
  const bankRows = replaceMonthRows(base.bankRows, incoming.bankRows, month);
  const monthDraws = replaceMonthRows(base.monthDraws, incoming.monthDraws, month);
  const monthOpenings = replaceMonthRows(base.monthOpenings, incoming.monthOpenings, month);
  const monthArchives = replaceMonthRows(base.monthArchives, incoming.monthArchives, month);
  const janSales = replaceMonthRows(base.janSales, incoming.janSales, month);
  const janFood = replaceMonthRows(base.janFood, incoming.janFood, month);
  const ota = replaceMonthRows(base.ota, incoming.ota, month);

  const removedGuests = (base.guests ?? []).filter(
    (row) => rowMonth(row) === month && !idsOf(guests).has(row.id ?? ""),
  );
  const removedFood = (base.food ?? []).filter(
    (row) => rowMonth(row) === month && !idsOf(food).has(row.id ?? ""),
  );
  const removedWs = (base.wholesale ?? []).filter(
    (row) => rowMonth(row) === month && !idsOf(wholesale).has(row.id ?? ""),
  );
  const removedExp = (base.expenses ?? []).filter(
    (row) => rowMonth(row) === month && !idsOf(expenses).has(row.id ?? ""),
  );
  const removedBal = (base.balReceived ?? []).filter(
    (row) => rowMonth(row) === month && !idsOf(balReceived).has(row.id ?? ""),
  );
  const removedComplaints = (base.complaints ?? []).filter(
    (row) => rowMonth(row) === month && !idsOf(complaints).has(row.id ?? ""),
  );
  const removedFiles = (base.inventoryFiles ?? []).filter(
    (row) => rowMonth(row) === month && !idsOf(inventoryFiles).has(row.id ?? ""),
  );

  const present = [
    ...sealList(guests, "guest"),
    ...sealList(food, "food"),
    ...sealList(wholesale, "wholesale"),
    ...sealList(expenses, "expense"),
    ...sealList(balReceived, "balance"),
    ...sealList(complaints, "complaint"),
    ...(inventoryFiles ?? []).map(rowKey).filter(Boolean),
  ];
  const removed = [
    ...sealList(removedGuests, "guest"),
    ...sealList(removedFood, "food"),
    ...sealList(removedWs, "wholesale"),
    ...sealList(removedExp, "expense"),
    ...sealList(removedBal, "balance"),
    ...sealList(removedComplaints, "complaint"),
    ...removedFiles.map(rowKey).filter(Boolean),
  ];
  const deletedIds = omitSealed(
    withSealed(
      withSealed(parseSealedIds(base.deletedIds), Object.keys(parseSealedIds(incoming.deletedIds))),
      removed,
    ),
    present,
  );

  const open = new Set((base.openMonths ?? []).filter((item) => item !== month));
  if (monthOpen) open.add(month);

  const opening = money(base.opening) ? base.opening : incoming.opening ?? base.opening;
  const securityCode = base.securityCode?.trim() ? base.securityCode : incoming.securityCode ?? base.securityCode;

  return {
    ...base,
    guests,
    food,
    wholesale,
    expenses,
    balReceived,
    staff,
    advances,
    payrollFiles,
    inventoryFiles,
    complaints,
    guestCards,
    bankRows,
    monthDraws,
    monthOpenings,
    monthArchives,
    janSales,
    janFood,
    ota,
    rooms: unionBy(base.rooms, incoming.rooms, (row) => row.no),
    staffRegister: unionBy(base.staffRegister, incoming.staffRegister, rowKey),
    inventory: unionBy(base.inventory, incoming.inventory, rowKey),
    reminders: unionBy(base.reminders, incoming.reminders, rowKey),
    contacts: unionBy(base.contacts, incoming.contacts, rowKey),
    corporates: unionBy(base.corporates, incoming.corporates, rowKey),
    agents: unionBy(base.agents, incoming.agents, rowKey),
    creditGuests: (base.creditGuests?.length ? base.creditGuests : incoming.creditGuests) ?? [],
    lockedDates: replaceMonthRecord(base.lockedDates, incoming.lockedDates, month),
    lockRev: replaceMonthRecord(base.lockRev, incoming.lockRev, month),
    openMonths: [...open].sort(),
    deletedIds,
    sealedIds: { ...(base.sealedIds ?? {}), ...(incoming.sealedIds ?? {}) },
    opening,
    securityCode,
    selectedDate: base.selectedDate || incoming.selectedDate,
  };
}

