import type { PostgrestError } from "@supabase/supabase-js";
import { normalizeComplaints, packComplaintNote, type RoomComplaint } from "./complaints";
import {
  decodeInventoryFile,
  encodeInventoryFile,
  isInventoryFileId,
  normalizeInventory,
  normalizeInventoryFiles,
  mergeInventoryFiles,
  splitInventoryRows,
  type InventoryFile,
  type InventoryItem,
} from "./inventory";
import {
  bankRowsFromHotel,
  normalizeBankRows,
  type BankRow,
} from "./bank-recon";
import {
  gstBillsFromGuests,
  gstBillsFromHotel,
  gstIdsFromHotel,
  withGuestGst,
} from "./invoice";
import {
  normalizeReminders,
  remindersFromHotel,
  type HotelReminder,
} from "./reminders";
import { MODES, uid } from "./format";
import { getSupabase } from "./supabase";
import { isMissingSchema, isSkippableSealError } from "./cloud-errors";
import {
  hotelForCloud,
  hotelFromCloud,
  lockRevFromHotel,
  lockRevFromMeta,
  locksFromHotel,
  locksFromMeta,
  mergeLockState,
  parseLockedDates,
  parseLockRev,
} from "./register-lock";
import {
  mergeSealed,
  omitSealed,
  parseSealedIds,
  sealedFromHotel,
  deletedFromHotel,
  dropDeletedRows,
  sealKey,
  type SealedIds,
} from "./sheet-seal";
import type {
  AdvanceRow,
  CreditGuest,
  GuestEntry,
  HotelInfo,
  JanFood,
  JanSale,
  ModeAmount,
  NamedAmount,
  OpeningBalances,
  OtaRow,
  PayMode,
  RoomDef,
  StaffRow,
  StaffProfile,
} from "./types";
import { normalizeStaffProfiles } from "./types";
import { normalizePayrollFiles, type PayrollFile } from "./payroll-files";

export const LEDGER_TABLES = [
  "ledger_meta",
  "rooms",
  "staff",
  "expenses",
  "balance_received",
  "guests",
  "food",
  "wholesale",
  "advances",
  "complaints",
  "inventory",
] as const;

export const ANON_LEDGER_CLAIM_KEY = "status-ledger-v5:migrated";

export type LedgerSnapshot = {
  hotel: HotelInfo;
  opening: OpeningBalances;
  rooms: RoomDef[];
  guests: GuestEntry[];
  food: ModeAmount[];
  wholesale: ModeAmount[];
  expenses: NamedAmount[];
  balReceived: NamedAmount[];
  staff: StaffRow[];
  staffRegister?: StaffProfile[];
  payrollFiles?: PayrollFile[];
  advances: AdvanceRow[];
  ota: OtaRow[];
  janSales: JanSale[];
  janFood: JanFood[];
  creditGuests: CreditGuest[];
  selectedDate: string;
  openingDate: string;
  securityCode: string;
  lockedDates?: Record<string, true>;
  lockRev?: Record<string, number>;
  sealedIds?: SealedIds;
  deletedIds?: SealedIds;
  inventory?: InventoryItem[];
  inventoryFiles?: InventoryFile[];
  complaints?: RoomComplaint[];
  reminders?: HotelReminder[];
  bankRows?: BankRow[];
  savedAt?: number;
  cloudUpdatedAt?: string;
};

export type CloudPull =
  | { ok: true; kind: "empty" }
  | { ok: true; kind: "data"; snapshot: LedgerSnapshot }
  | { ok: false; missingSchema: true; message: string }
  | { ok: false; missingSchema: false; message: string };

const FLOORS: RoomDef["floor"][] = ["Ground", "First", "Second", "Third"];

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function dateStr(v: unknown, fallback = ""): string {
  if (typeof v === "string" && v) return v.slice(0, 10);
  return fallback;
}

function nullableDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "string") return v.slice(0, 10);
  return null;
}

function modeOf(v: unknown): PayMode {
  const m = str(v);
  return (MODES as string[]).includes(m) ? (m as PayMode) : "CASH";
}

function floorOf(v: unknown): RoomDef["floor"] {
  const f = str(v);
  return (FLOORS as string[]).includes(f) ? (f as RoomDef["floor"]) : "Ground";
}

export { isMissingSchema, isSkippableSealError } from "./cloud-errors";

function isMissingColumn(
  error: { code?: string; message?: string } | null,
  column: string,
): boolean {
  if (!error) return false;
  const m = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST204" ||
    (m.includes(column.toLowerCase()) &&
      (m.includes("column") || m.includes("schema cache") || m.includes("could not find")))
  );
}

function asError(error: PostgrestError | null): CloudPull {
  if (!error) return { ok: false, missingSchema: false, message: "Unknown error" };
  if (isMissingSchema(error)) {
    return { ok: false, missingSchema: true, message: error.message };
  }
  return { ok: false, missingSchema: false, message: error.message };
}

function staffOf(row: StaffRow, i: number): StaffRow {
  return {
    ...row,
    id: row.id || `st-${i}`,
    extra: row.extra ?? 0,
    salary: num(row.salary),
    absent: num(row.absent),
    working: num(row.working),
    advance: num(row.advance),
    weekOff: num(row.weekOff),
    total: num(row.total),
  };
}

function advanceOf(row: AdvanceRow, i: number): AdvanceRow {
  return {
    ...row,
    id: row.id || `adv-${i}`,
    cash: num(row.cash),
    qrs: num(row.qrs),
  };
}

export function snapshotFromUnknown(
  raw: unknown,
  fallback: LedgerSnapshot,
): LedgerSnapshot {
  const p = (raw ?? {}) as Partial<LedgerSnapshot> & { hotel?: unknown };
  const hotel = hotelFromCloud(p.hotel, fallback.hotel);
  const lockedDates =
    p.lockedDates !== undefined
      ? parseLockedDates(p.lockedDates)
      : locksFromHotel(p.hotel);
  const lockRev =
    p.lockRev !== undefined
      ? parseLockRev(p.lockRev)
      : lockRevFromHotel(p.hotel) ?? {};
  return {
    hotel,
    opening: {
      cash: num(p.opening?.cash ?? fallback.opening.cash),
      santosh: num(p.opening?.santosh ?? fallback.opening.santosh),
      pk: num(p.opening?.pk ?? fallback.opening.pk),
      online: num(p.opening?.online ?? fallback.opening.online),
      outstanding: num(p.opening?.outstanding ?? fallback.opening.outstanding),
    },
    rooms: (p.rooms?.length ? p.rooms : fallback.rooms).map((r) => ({
      no: str(r.no),
      floor: floorOf(r.floor),
    })),
    guests: withGuestGst(
      (p.guests ?? fallback.guests) as GuestEntry[],
      gstIdsFromHotel(p.hotel),
      gstBillsFromHotel(p.hotel),
    ),
    food: (p.food ?? fallback.food) as ModeAmount[],
    wholesale: (p.wholesale ?? fallback.wholesale) as ModeAmount[],
    expenses: (p.expenses ?? fallback.expenses) as NamedAmount[],
    balReceived: (p.balReceived ?? fallback.balReceived) as NamedAmount[],
    staff: (p.staff ?? fallback.staff).map(staffOf),
    staffRegister: normalizeStaffProfiles(
      (p as { staffRegister?: StaffProfile[] }).staffRegister ??
        fallback.staffRegister,
    ),
    payrollFiles: normalizePayrollFiles(
      (p as { payrollFiles?: PayrollFile[] }).payrollFiles ?? fallback.payrollFiles,
    ),
    advances: (p.advances ?? fallback.advances).map(advanceOf),
    ota: (p.ota ?? fallback.ota) as OtaRow[],
    janSales: (p.janSales ?? fallback.janSales) as JanSale[],
    janFood: (p.janFood ?? fallback.janFood) as JanFood[],
    creditGuests: (p.creditGuests ?? fallback.creditGuests) as CreditGuest[],
    selectedDate: dateStr(p.selectedDate, fallback.selectedDate),
    openingDate: dateStr(p.openingDate, fallback.openingDate),
    securityCode: str(p.securityCode ?? fallback.securityCode),
    lockedDates,
    lockRev,
    sealedIds: mergeSealed(sealedFromHotel(p.hotel), parseSealedIds(p.sealedIds)),
    deletedIds: parseSealedIds(
      (p as { deletedIds?: unknown }).deletedIds ?? deletedFromHotel(p.hotel),
    ),
    inventory: normalizeInventory(
      splitInventoryRows(
        (p as { inventory?: InventoryItem[] }).inventory ?? fallback.inventory,
      ).items,
    ),
    inventoryFiles: normalizeInventoryFiles(
      (p as { inventoryFiles?: InventoryFile[] }).inventoryFiles ??
        splitInventoryRows(
          (p as { inventory?: InventoryItem[] }).inventory ?? fallback.inventory,
        ).files,
    ),
    complaints: normalizeComplaints(
      (p as { complaints?: RoomComplaint[] }).complaints ?? fallback.complaints,
    ),
    reminders: Array.isArray((p as { reminders?: HotelReminder[] }).reminders)
      ? normalizeReminders((p as { reminders?: HotelReminder[] }).reminders)
      : remindersFromHotel(p.hotel).length
        ? remindersFromHotel(p.hotel)
        : normalizeReminders(fallback.reminders),
    bankRows: Array.isArray((p as { bankRows?: BankRow[] }).bankRows)
      ? normalizeBankRows((p as { bankRows?: BankRow[] }).bankRows)
      : bankRowsFromHotel(p.hotel).length
        ? bankRowsFromHotel(p.hotel)
        : normalizeBankRows(fallback.bankRows),
    savedAt: num((p as { savedAt?: unknown }).savedAt) || fallback.savedAt,
  };
}

export function ledgerActivityScore(s: Pick<
  LedgerSnapshot,
  | "guests"
  | "food"
  | "wholesale"
  | "expenses"
  | "balReceived"
  | "advances"
  | "securityCode"
  | "opening"
  | "staff"
>): number {
  const openingN = Object.values(s.opening).reduce((n, v) => n + Math.abs(num(v)), 0);
  const staffN = s.staff.reduce(
    (n, r) => n + Math.abs(num(r.working)) + Math.abs(num(r.advance)) + Math.abs(num(r.extra)),
    0,
  );
  return (
    s.guests.length +
    s.food.length +
    s.wholesale.length +
    s.expenses.length +
    s.balReceived.length +
    s.advances.length +
    (s.securityCode ? 1 : 0) +
    (openingN > 0 ? 1 : 0) +
    (staffN > 0 ? 1 : 0)
  );
}

export function readLocalLedger(key: string, fallback: LedgerSnapshot): LedgerSnapshot | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: unknown };
    const state = parsed.state ?? parsed;
    if (!state || typeof state !== "object") return null;
    return snapshotFromUnknown(state, fallback);
  } catch {
    return null;
  }
}

export function claimAnonymousLedger(userId: string) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(ANON_LEDGER_CLAIM_KEY, userId);
  } catch {
    /* ignore quota */
  }
}

export function anonymousLedgerUnclaimed(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return !localStorage.getItem(ANON_LEDGER_CLAIM_KEY);
  } catch {
    return false;
  }
}

function namedFromDb(row: Record<string, unknown>): NamedAmount {
  return {
    id: str(row.id),
    date: dateStr(row.date),
    mode: modeOf(row.mode),
    amount: num(row.amount),
    particular: str(row.particular),
    kind: row.kind == null || row.kind === "" ? undefined : (str(row.kind) as NamedAmount["kind"]),
    payRef: str(row.pay_ref) || str(row.payRef) || undefined,
  };
}

function modeFromDb(row: Record<string, unknown>): ModeAmount {
  return {
    id: str(row.id),
    date: dateStr(row.date),
    mode: modeOf(row.mode),
    amount: num(row.amount),
  };
}

export function booksFromHotel(hotel: unknown): Partial<LedgerSnapshot> | null {
  if (!hotel || typeof hotel !== "object") return null;
  const raw = (hotel as { _books?: unknown })._books;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const b = raw as Record<string, unknown>;
  const guests = Array.isArray(b.guests) ? (b.guests as GuestEntry[]) : [];
  const food = Array.isArray(b.food) ? (b.food as ModeAmount[]) : [];
  const wholesale = Array.isArray(b.wholesale) ? (b.wholesale as ModeAmount[]) : [];
  const expenses = Array.isArray(b.expenses) ? (b.expenses as NamedAmount[]) : [];
  const balReceived = Array.isArray(b.balReceived)
    ? (b.balReceived as NamedAmount[])
    : [];
  const staff = Array.isArray(b.staff) ? (b.staff as StaffRow[]) : [];
  const staffRegister = Array.isArray(b.staffRegister)
    ? (b.staffRegister as StaffProfile[])
    : [];
  const payrollFiles = Array.isArray(b.payrollFiles)
    ? (b.payrollFiles as PayrollFile[])
    : [];
  const inventoryFiles = Array.isArray(b.inventoryFiles)
    ? normalizeInventoryFiles(b.inventoryFiles as InventoryFile[])
    : [];
  const advances = Array.isArray(b.advances) ? (b.advances as AdvanceRow[]) : [];
  const rooms = Array.isArray(b.rooms) ? (b.rooms as RoomDef[]) : [];
  if (
    !guests.length &&
    !food.length &&
    !wholesale.length &&
    !expenses.length &&
    !balReceived.length &&
    !staffRegister.length &&
    !payrollFiles.length &&
    !inventoryFiles.length
  ) {
    return null;
  }
  return {
    guests,
    food,
    wholesale,
    expenses,
    balReceived,
    staff,
    staffRegister,
    payrollFiles,
    inventoryFiles,
    advances,
    rooms,
    savedAt: num(b.savedAt) || undefined,
  };
}

function overlayBooks(snapshot: LedgerSnapshot, hotelRaw: unknown): LedgerSnapshot {
  const books = booksFromHotel(hotelRaw);
  if (!books) return snapshot;
  const next = { ...snapshot };
  if ((books.guests?.length ?? 0) > 0 && snapshot.guests.length === 0) {
    next.guests = books.guests ?? snapshot.guests;
  }
  if ((books.food?.length ?? 0) > 0 && snapshot.food.length === 0) {
    next.food = books.food ?? snapshot.food;
  }
  if ((books.wholesale?.length ?? 0) > 0 && snapshot.wholesale.length === 0) {
    next.wholesale = books.wholesale ?? snapshot.wholesale;
  }
  if ((books.expenses?.length ?? 0) > 0 && snapshot.expenses.length === 0) {
    next.expenses = books.expenses ?? snapshot.expenses;
  }
  if ((books.balReceived?.length ?? 0) > 0 && snapshot.balReceived.length === 0) {
    next.balReceived = books.balReceived ?? snapshot.balReceived;
  } else if (books.balReceived?.length) {
    const extra = new Map(books.balReceived.map((r) => [r.id, r]));
    next.balReceived = snapshot.balReceived.map((r) => {
      const b = extra.get(r.id);
      if (!b?.payRef) return r;
      return { ...r, payRef: r.payRef || b.payRef };
    });
  }
  if ((books.staff?.length ?? 0) > 0 && snapshot.staff.length === 0) {
    next.staff = books.staff ?? snapshot.staff;
  }
  if ((books.staffRegister?.length ?? 0) > 0 && (snapshot.staffRegister?.length ?? 0) === 0) {
    next.staffRegister = books.staffRegister;
  }
  if ((books.payrollFiles?.length ?? 0) > 0 && (snapshot.payrollFiles?.length ?? 0) === 0) {
    next.payrollFiles = books.payrollFiles;
  }
  next.inventoryFiles = mergeInventoryFiles(
    snapshot.inventoryFiles,
    books.inventoryFiles,
  ).filter((file) => !snapshot.deletedIds?.[file.id]);
  if ((books.advances?.length ?? 0) > 0 && snapshot.advances.length === 0) {
    next.advances = books.advances ?? snapshot.advances;
  }
  if ((books.rooms?.length ?? 0) > 0 && snapshot.rooms.length === 0) {
    next.rooms = books.rooms ?? snapshot.rooms;
  }
  if ((books.savedAt ?? 0) > (snapshot.savedAt ?? 0)) next.savedAt = books.savedAt;
  return next;
}

function booksForHotel(snap: LedgerSnapshot) {
  return {
    guests: snap.guests,
    food: snap.food,
    wholesale: snap.wholesale,
    expenses: snap.expenses,
    balReceived: snap.balReceived,
    staff: snap.staff,
    staffRegister: snap.staffRegister ?? [],
    payrollFiles: snap.payrollFiles ?? [],
    inventoryFiles: snap.inventoryFiles ?? [],
    advances: snap.advances,
    rooms: snap.rooms,
    savedAt: snap.savedAt ?? Date.now(),
  };
}

async function resolveSharedHotelUserId(preferred: string): Promise<string> {
  const sb = getSupabase();
  const [metas, rows] = await Promise.all([
    sb.from("ledger_meta").select("user_id,hotel"),
    sb.from("inventory").select("user_id,id"),
  ]);
  const counts = new Map<string, number>();
  const bump = (id: string, n: number) => {
    if (!id || n <= 0) return;
    counts.set(id, (counts.get(id) ?? 0) + n);
  };
  for (const row of metas.data ?? []) {
    const rec = row as { user_id?: unknown; hotel?: unknown };
    bump(str(rec.user_id), booksFromHotel(rec.hotel)?.inventoryFiles?.length ?? 0);
  }
  for (const row of rows.data ?? []) {
    const rec = row as { user_id?: unknown; id?: unknown };
    if (isInventoryFileId(str(rec.id))) bump(str(rec.user_id), 1);
  }
  let best = preferred;
  let bestN = counts.get(preferred) ?? 0;
  for (const [id, n] of counts) {
    if (n > bestN) {
      best = id;
      bestN = n;
    }
  }
  return best;
}

export async function pullLedgerStamp(userId: string): Promise<string | null> {
  const sb = getSupabase();
  const ownerId = await resolveSharedHotelUserId(userId);
  const { data, error } = await sb
    .from("ledger_meta")
    .select("updated_at")
    .eq("user_id", ownerId)
    .maybeSingle();
  if (error || !data) return null;
  const stamp = str((data as { updated_at?: unknown }).updated_at);
  return stamp || null;
}

export async function pullLedger(userId: string): Promise<CloudPull> {
  const sb = getSupabase();
  const ownerId = await resolveSharedHotelUserId(userId);
  const meta = await sb
    .from("ledger_meta")
    .select("*")
    .eq("user_id", ownerId)
    .maybeSingle();

  if (meta.error) return asError(meta.error);
  if (!meta.data) return { ok: true, kind: "empty" };

  const [
    rooms,
    staff,
    expenses,
    balance,
    guests,
    food,
    wholesale,
    advances,
    complaints,
    inventory,
    seals,
  ] = await Promise.all([
    sb.from("rooms").select("no, floor, sort_index").eq("user_id", ownerId).order("sort_index"),
    sb.from("staff").select("*").eq("user_id", ownerId),
    sb.from("expenses").select("*").eq("user_id", ownerId),
    sb.from("balance_received").select("*").eq("user_id", ownerId),
    sb.from("guests").select("*").eq("user_id", ownerId),
    sb.from("food").select("*").eq("user_id", ownerId),
    sb.from("wholesale").select("*").eq("user_id", ownerId),
    sb.from("advances").select("*").eq("user_id", ownerId),
    sb.from("complaints").select("*").eq("user_id", ownerId),
    sb.from("inventory").select("*").eq("user_id", ownerId),
    sb.from("sheet_seals").select("id").eq("user_id", ownerId),
  ]);

  const firstErr =
    rooms.error ||
    staff.error ||
    expenses.error ||
    balance.error ||
    guests.error ||
    food.error ||
    wholesale.error ||
    advances.error;
  if (complaints.error && !isSkippableSealError(complaints.error)) {
    return asError(complaints.error);
  }
  if (inventory.error && !isSkippableSealError(inventory.error)) {
    return asError(inventory.error);
  }
  if (seals.error && !isSkippableSealError(seals.error)) {
    return asError(seals.error);
  }
  if (firstErr) return asError(firstErr);

  const row = meta.data as Record<string, unknown>;
  const hotelRaw = row.hotel;
  let snapshot: LedgerSnapshot = {
    hotel: hotelFromCloud(hotelRaw, {} as HotelInfo),
    opening: (row.opening ?? {}) as OpeningBalances,
    rooms: (rooms.data ?? []).map((r) => ({
      no: str((r as { no: unknown }).no),
      floor: floorOf((r as { floor: unknown }).floor),
    })),
    guests: (guests.data ?? []).map((g) => {
      const r = g as Record<string, unknown>;
      return {
        id: str(r.id),
        date: dateStr(r.date),
        slNo: num(r.sl_no),
        name: str(r.name),
        roomNo: str(r.room_no),
        mode: modeOf(r.mode),
        amount: num(r.amount),
        checkIn: nullableDate(r.check_in),
        checkOut: nullableDate(r.check_out),
        inTime: r.in_time == null ? null : str(r.in_time),
        outTime: r.out_time == null ? null : str(r.out_time),
        stay: r.stay == null || r.stay === "" ? null : (str(r.stay) as GuestEntry["stay"]),
        ac: r.ac == null ? null : str(r.ac),
        time: r.time == null ? null : str(r.time),
        coDate: nullableDate(r.co_date),
        source: r.source == null ? null : str(r.source),
        gst: false,
      };
    }),
    food: (food.data ?? []).map((r) => modeFromDb(r as Record<string, unknown>)),
    wholesale: (wholesale.data ?? []).map((r) => modeFromDb(r as Record<string, unknown>)),
    expenses: (expenses.data ?? []).map((r) => namedFromDb(r as Record<string, unknown>)),
    balReceived: (balance.data ?? []).map((r) => namedFromDb(r as Record<string, unknown>)),
    staff: (staff.data ?? []).map((r, i) => {
      const row = r as Record<string, unknown>;
      return staffOf(
        {
          id: str(row.id),
          name: str(row.name),
          salary: num(row.salary),
          role: str(row.role),
          days: str(row.days),
          absent: num(row.absent),
          working: num(row.working),
          extra: num(row.extra),
          advance: num(row.advance),
          weekOff: num(row.week_off),
          total: num(row.total),
          status: str(row.status),
          month: str(row.month),
        },
        i,
      );
    }),
    advances: (advances.data ?? []).map((r, i) => {
      const row = r as Record<string, unknown>;
      return advanceOf(
        {
          id: str(row.id),
          name: str(row.name),
          cash: num(row.cash),
          qrs: num(row.qrs),
          month: str(row.month),
        },
        i,
      );
    }),
    ota: (row.ota ?? []) as OtaRow[],
    janSales: (row.jan_sales ?? []) as JanSale[],
    janFood: (row.jan_food ?? []) as JanFood[],
    creditGuests: (row.credit_guests ?? []) as CreditGuest[],
    selectedDate: dateStr(row.selected_date),
    openingDate: dateStr(row.opening_date),
    securityCode: str(row.security_code),
    lockedDates: locksFromMeta(row),
    lockRev: lockRevFromMeta(row),
    sealedIds: mergeSealed(
      sealedFromHotel(hotelRaw),
      isSkippableSealError(seals.error)
        ? {}
        : parseSealedIds((seals.data ?? []).map((r) => str((r as { id?: unknown }).id))),
    ),
    cloudUpdatedAt: str(row.updated_at),
    complaints: isSkippableSealError(complaints.error)
      ? []
      : normalizeComplaints(
          (complaints.data ?? []).map((r) => {
            const row = r as Record<string, unknown>;
            return {
              id: str(row.id),
              roomNo: str(row.room_no),
              note: str(row.note),
              level: str(row.level) as RoomComplaint["level"],
              createdAt: str(row.created_at),
            };
          }),
        ),
    inventory: isSkippableSealError(inventory.error)
      ? []
      : normalizeInventory(
          splitInventoryRows(
            (inventory.data ?? []).map((r) => {
              const row = r as Record<string, unknown>;
              return {
                id: str(row.id),
                name: str(row.name),
                lastMonth: num(row.last_month),
                thisMonth: num(row.this_month),
                notes: str(row.notes),
              };
            }),
          ).items,
        ),
    inventoryFiles: isSkippableSealError(inventory.error)
      ? []
      : normalizeInventoryFiles(
          (inventory.data ?? [])
            .map((r) => {
              const row = r as Record<string, unknown>;
              return decodeInventoryFile({
                id: str(row.id),
                notes: str(row.notes),
              });
            })
            .filter((row): row is InventoryFile => Boolean(row)),
        ),
    savedAt: Date.parse(str(row.updated_at)) || 0,
    reminders: remindersFromHotel(hotelRaw),
    bankRows: bankRowsFromHotel(hotelRaw),
  };

  const deletedIds = mergeSealed(deletedFromHotel(hotelRaw), {});
  snapshot.deletedIds = deletedIds;
  snapshot.guests = dropDeletedRows(snapshot.guests, deletedIds, sealKey.guest);
  snapshot.food = dropDeletedRows(snapshot.food, deletedIds, sealKey.food);
  snapshot.wholesale = dropDeletedRows(snapshot.wholesale, deletedIds, sealKey.wholesale);
  snapshot.expenses = dropDeletedRows(snapshot.expenses, deletedIds, sealKey.expense);
  snapshot.balReceived = dropDeletedRows(snapshot.balReceived, deletedIds, sealKey.balance);
  snapshot.complaints = dropDeletedRows(
    snapshot.complaints ?? [],
    deletedIds,
    sealKey.complaint,
  );
  snapshot.guests = withGuestGst(
    snapshot.guests,
    gstIdsFromHotel(hotelRaw),
    gstBillsFromHotel(hotelRaw),
  );
  snapshot = overlayBooks(snapshot, hotelRaw);
  snapshot.guests = dropDeletedRows(snapshot.guests, deletedIds, sealKey.guest);
  snapshot.food = dropDeletedRows(snapshot.food, deletedIds, sealKey.food);
  snapshot.wholesale = dropDeletedRows(snapshot.wholesale, deletedIds, sealKey.wholesale);
  snapshot.expenses = dropDeletedRows(snapshot.expenses, deletedIds, sealKey.expense);
  snapshot.balReceived = dropDeletedRows(snapshot.balReceived, deletedIds, sealKey.balance);
  snapshot.complaints = dropDeletedRows(
    snapshot.complaints ?? [],
    deletedIds,
    sealKey.complaint,
  );
  snapshot.inventoryFiles = (snapshot.inventoryFiles ?? []).filter(
    (file) => !deletedIds[file.id],
  );
  snapshot.guests = withGuestGst(
    snapshot.guests,
    gstIdsFromHotel(hotelRaw),
    gstBillsFromHotel(hotelRaw),
  );

  return { ok: true, kind: "data", snapshot };
}

function skipRowWrite(table: string, error: PostgrestError | null) {
  if (!error) return true;
  if (table === "complaints" || table === "inventory") {
    return isMissingSchema(error);
  }
  return isSkippableSealError(error);
}

async function replaceRows(
  table: string,
  userId: string,
  idField: string,
  rows: Record<string, unknown>[],
  prune?: string[],
) {
  const sb = getSupabase();
  const { data: existing, error: selErr } = await sb
    .from(table)
    .select(idField)
    .eq("user_id", userId);
  if (selErr) {
    if (table === "complaints" || table === "inventory") {
      if (!isMissingSchema(selErr)) return selErr;
    } else if (!isSkippableSealError(selErr)) {
      return selErr;
    }
  }

  const keep = new Set(rows.map((r) => str(r[idField])));
  const extra =
    prune === undefined
      ? (existing ?? [])
          .map((r) => str((r as unknown as Record<string, unknown>)[idField]))
          .filter((id) => id && !keep.has(id))
      : prune.filter((id) => id && !keep.has(id));

  if (extra.length) {
    const chunk = 80;
    for (let i = 0; i < extra.length; i += chunk) {
      const { error } = await sb
        .from(table)
        .delete()
        .eq("user_id", userId)
        .in(idField, extra.slice(i, i + chunk));
      if (error && !skipRowWrite(table, error)) return error;
    }
  }

  if (!rows.length) {
    if (prune === undefined && (existing ?? []).length) {
      const { error } = await sb.from(table).delete().eq("user_id", userId);
      if (error && !skipRowWrite(table, error)) return error;
    }
    return null;
  }

  const payload = rows.map((r) => ({ ...r, user_id: userId }));
  const chunk = 200;
  for (let i = 0; i < payload.length; i += chunk) {
    const { error } = await sb
      .from(table)
      .upsert(payload.slice(i, i + chunk), { onConflict: `user_id,${idField}` });
    if (error && !skipRowWrite(table, error)) return error;
  }
  return null;
}

function goneIds(previous: string[] | undefined, next: string[]) {
  if (!previous) return undefined;
  const keep = new Set(next);
  return previous.filter((id) => id && !keep.has(id));
}

export type LedgerPrune = {
  rooms?: string[];
  staff?: string[];
  expenses?: string[];
  balance?: string[];
  guests?: string[];
  food?: string[];
  wholesale?: string[];
  advances?: string[];
  complaints?: string[];
  inventory?: string[];
};

export function pruneFromBase(
  base: LedgerSnapshot | null | undefined,
  snap: LedgerSnapshot,
): LedgerPrune | undefined {
  if (!base) return undefined;
  return {
    rooms: goneIds(
      base.rooms.map((r) => r.no),
      snap.rooms.map((r) => r.no),
    ),
    staff: goneIds(
      base.staff.map((r) => r.id),
      snap.staff.map((r) => r.id),
    ),
    expenses: goneIds(
      base.expenses.map((r) => r.id),
      snap.expenses.map((r) => r.id),
    ),
    balance: goneIds(
      base.balReceived.map((r) => r.id),
      snap.balReceived.map((r) => r.id),
    ),
    guests: goneIds(
      base.guests.map((r) => r.id),
      snap.guests.map((r) => r.id),
    ),
    food: goneIds(
      base.food.map((r) => r.id),
      snap.food.map((r) => r.id),
    ),
    wholesale: goneIds(
      base.wholesale.map((r) => r.id),
      snap.wholesale.map((r) => r.id),
    ),
    advances: goneIds(
      base.advances.map((r) => r.id),
      snap.advances.map((r) => r.id),
    ),
    complaints: goneIds(
      (base.complaints ?? []).map((r) => r.id),
      (snap.complaints ?? []).map((r) => r.id),
    ),
    inventory: (goneIds(
      [
        ...(base.inventory ?? []).map((r) => r.id),
        ...(base.inventoryFiles ?? []).map((r) => r.id),
      ],
      [
        ...(snap.inventory ?? []).map((r) => r.id),
        ...(snap.inventoryFiles ?? []).map((r) => r.id),
      ],
    ) ?? []).filter((id) => !isInventoryFileId(id) || Boolean(snap.deletedIds?.[id])),
  };
}

async function pushSheetSeals(
  userId: string,
  sealed: SealedIds | undefined,
): Promise<PostgrestError | null> {
  const ids = Object.keys(sealed ?? {});
  if (!ids.length) return null;
  const { error } = await getSupabase().from("sheet_seals").upsert(
    ids.map((id) => ({ user_id: userId, id })),
    { onConflict: "user_id,id" },
  );
  if (error && !isSkippableSealError(error)) return error;
  return null;
}

function idsForPrefix(deleted: SealedIds | undefined, prefix: string): string[] {
  return Object.keys(deleted ?? {})
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length))
    .filter(Boolean);
}

function tombstonePrune(snap: LedgerSnapshot): LedgerPrune {
  return {
    rooms: [],
    staff: [],
    expenses: idsForPrefix(snap.deletedIds, "exp:"),
    balance: idsForPrefix(snap.deletedIds, "bal:"),
    guests: idsForPrefix(snap.deletedIds, "guest:"),
    food: idsForPrefix(snap.deletedIds, "food:"),
    wholesale: idsForPrefix(snap.deletedIds, "ws:"),
    advances: [],
    complaints: idsForPrefix(snap.deletedIds, "c:"),
    inventory: Object.keys(snap.deletedIds ?? {}).filter((id) => isInventoryFileId(id)),
  };
}

function unionPrune(base: LedgerPrune | undefined, extra: LedgerPrune): LedgerPrune | undefined {
  if (!base) return undefined;
  const join = (a?: string[], b?: string[]) => [...new Set([...(a ?? []), ...(b ?? [])])];
  return {
    rooms: join(base.rooms, extra.rooms),
    staff: join(base.staff, extra.staff),
    expenses: join(base.expenses, extra.expenses),
    balance: join(base.balance, extra.balance),
    guests: join(base.guests, extra.guests),
    food: join(base.food, extra.food),
    wholesale: join(base.wholesale, extra.wholesale),
    advances: join(base.advances, extra.advances),
    complaints: join(base.complaints, extra.complaints),
    inventory: join(base.inventory, extra.inventory),
  };
}

export async function pushLedger(
  userId: string,
  snap: LedgerSnapshot,
  migratedFrom?: string,
  role?: string,
  prune?: LedgerPrune,
): Promise<{ ok: true } | { ok: false; missingSchema: boolean; message: string }> {
  const ownerId = await resolveSharedHotelUserId(userId);
  const tombs = tombstonePrune(snap);
  const writePrune =
    prune === undefined && ownerId !== userId ? tombs : unionPrune(prune, tombs);
  const rooms = snap.rooms.map((r, i) => ({
    no: r.no,
    floor: r.floor,
    sort_index: i,
  }));
  const staff = snap.staff.map((r) => ({
    id: r.id,
    name: r.name,
    salary: num(r.salary),
    role: r.role,
    days: r.days,
    absent: num(r.absent),
    working: num(r.working),
    extra: num(r.extra),
    advance: num(r.advance),
    week_off: num(r.weekOff),
    total: num(r.total),
    status: r.status,
    month: r.month,
  }));
  const expenses = snap.expenses.map((r) => ({
    id: r.id,
    date: r.date,
    mode: r.mode,
    amount: num(r.amount),
    particular: r.particular,
    kind: r.kind ?? null,
  }));
  const balance = snap.balReceived.map((r) => ({
    id: r.id,
    date: r.date,
    mode: r.mode,
    amount: num(r.amount),
    particular: r.particular,
    kind: r.kind ?? null,
  }));
  const guests = snap.guests.map((r) => ({
    id: r.id,
    date: r.date,
    sl_no: num(r.slNo),
    name: r.name,
    room_no: r.roomNo,
    mode: r.mode,
    amount: num(r.amount),
    check_in: r.checkIn ?? null,
    check_out: r.checkOut ?? null,
    in_time: r.inTime ?? null,
    out_time: r.outTime ?? null,
    stay: r.stay ?? null,
    ac: r.ac ?? null,
    time: r.time ?? null,
    co_date: r.coDate ?? null,
    source: r.source ?? null,
  }));
  const food = snap.food.map((r) => ({
    id: r.id,
    date: r.date,
    mode: r.mode,
    amount: num(r.amount),
  }));
  const wholesale = snap.wholesale.map((r) => ({
    id: r.id,
    date: r.date,
    mode: r.mode,
    amount: num(r.amount),
  }));
  const advances = snap.advances.map((r) => ({
    id: r.id,
    name: r.name,
    cash: num(r.cash),
    qrs: num(r.qrs),
    month: r.month,
  }));
  const complaints = (snap.complaints ?? []).map((r) => ({
    id: r.id,
    room_no: r.roomNo,
    note: packComplaintNote(r.note, r.by ?? ""),
    level: r.level,
    created_at: r.createdAt,
  }));
  const inventory = [
    ...(snap.inventory ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      last_month: num(r.lastMonth),
      this_month: num(r.thisMonth),
      notes: r.notes,
    })),
    ...(snap.inventoryFiles ?? []).map((file) => {
      const row = encodeInventoryFile(file);
      return {
        id: row.id,
        name: row.name,
        last_month: row.lastMonth,
        this_month: row.thisMonth,
        notes: row.notes,
      };
    }),
  ];

  const hkOnly = role === "housekeeping";
  const writes: Array<Promise<PostgrestError | null>> = hkOnly
    ? [
        replaceRows("complaints", ownerId, "id", complaints, writePrune?.complaints),
        replaceRows("inventory", ownerId, "id", inventory, writePrune?.inventory),
      ]
    : [
        replaceRows("rooms", ownerId, "no", rooms, writePrune?.rooms),
        replaceRows("staff", ownerId, "id", staff, writePrune?.staff),
        replaceRows("expenses", ownerId, "id", expenses, writePrune?.expenses),
        replaceRows("balance_received", ownerId, "id", balance, writePrune?.balance),
        replaceRows("guests", ownerId, "id", guests, writePrune?.guests),
        replaceRows("food", ownerId, "id", food, writePrune?.food),
        replaceRows("wholesale", ownerId, "id", wholesale, writePrune?.wholesale),
        replaceRows("advances", ownerId, "id", advances, writePrune?.advances),
        replaceRows("complaints", ownerId, "id", complaints, writePrune?.complaints),
        replaceRows("inventory", ownerId, "id", inventory, writePrune?.inventory),
      ];
  const results = await Promise.all(writes);
  const tableErr = results.find((e) => e && !isMissingSchema(e) && !isSkippableSealError(e));

  if (hkOnly) {
    await pushSheetSeals(ownerId, snap.sealedIds);
    await pushInventoryBooks(ownerId, snap.inventoryFiles ?? [], snap.deletedIds);
    if (tableErr) {
      const mapped = asError(tableErr);
      return mapped.ok
        ? { ok: false, missingSchema: false, message: "Unknown error" }
        : { ok: false, missingSchema: mapped.missingSchema, message: mapped.message };
    }
    return { ok: true };
  }

  const sb = getSupabase();
  const metaRow = {
    user_id: ownerId,
    hotel: {
      ...hotelForCloud(
        snap.hotel,
        snap.lockedDates ?? {},
        snap.lockRev ?? {},
        snap.sealedIds ?? {},
        snap.deletedIds ?? {},
        snap.reminders ?? [],
        gstBillsFromGuests(snap.guests),
        snap.bankRows ?? [],
      ),
      _books: booksForHotel(snap),
    },
    opening: snap.opening,
    opening_date: snap.openingDate,
    selected_date: snap.selectedDate,
    security_code: snap.securityCode,
    ota: snap.ota,
    jan_sales: snap.janSales,
    jan_food: snap.janFood,
    credit_guests: snap.creditGuests,
    locked_dates: snap.lockedDates ?? {},
    lock_rev: snap.lockRev ?? {},
    migrated_from: migratedFrom ?? "app",
    updated_at: new Date().toISOString(),
  };
  let metaErr = (
    await sb.from("ledger_meta").upsert(metaRow, { onConflict: "user_id" })
  ).error;
  if (metaErr && isMissingColumn(metaErr, "locked_dates")) {
    const { locked_dates: _d, lock_rev: _r, ...legacy } = metaRow;
    metaErr = (
      await sb.from("ledger_meta").upsert(legacy, { onConflict: "user_id" })
    ).error;
  }
  if (metaErr) {
    const mapped = asError(metaErr);
    if (mapped.ok) {
      return { ok: false, missingSchema: false, message: metaErr.message };
    }
    return {
      ok: false,
      missingSchema: mapped.missingSchema,
      message: mapped.message,
    };
  }
  await pushSheetSeals(ownerId, snap.sealedIds);
  await pushInventoryBooks(ownerId, snap.inventoryFiles ?? [], snap.deletedIds);
  return { ok: true };
}

async function pushInventoryBooks(
  userId: string,
  files: InventoryFile[],
  deleted?: SealedIds,
) {
  const sb = getSupabase();
  const ownerId = await resolveSharedHotelUserId(userId);
  const existingRows = await sb
    .from("inventory")
    .select("id,notes")
    .eq("user_id", ownerId);
  const cloudFiles = (existingRows.data ?? [])
    .map((row) => {
      const rec = row as { id?: unknown; notes?: unknown };
      return decodeInventoryFile({ id: str(rec.id), notes: str(rec.notes) });
    })
    .filter((row): row is InventoryFile => Boolean(row));
  const remoteDeleted = deletedFromHotel(
    ((await sb.from("ledger_meta").select("hotel").eq("user_id", ownerId).maybeSingle()).data as
      | { hotel?: unknown }
      | null)?.hotel,
  );
  const blocked = { ...(remoteDeleted ?? {}), ...(deleted ?? {}) };
  const gone = [
    ...new Set([
      ...cloudFiles.filter((file) => blocked[file.id]).map((file) => file.id),
      ...Object.keys(blocked).filter((id) => isInventoryFileId(id)),
    ]),
  ];
  if (gone.length) {
    await sb.from("inventory").delete().eq("user_id", ownerId).in("id", gone);
  }
  const merged = mergeInventoryFiles(files, cloudFiles).filter((file) => !blocked[file.id]);
  const shared = await sb.rpc("save_shared_inventory", { files: merged });
  if (!shared.error) return;
  const encoded = merged.map((file) => {
    const row = encodeInventoryFile(file);
    return {
      user_id: ownerId,
      id: row.id,
      name: row.name,
      last_month: row.lastMonth,
      this_month: row.thisMonth,
      notes: row.notes,
    };
  });
  if (encoded.length) {
    const { error: rowErr } = await sb
      .from("inventory")
      .upsert(encoded, { onConflict: "user_id,id" });
    if (rowErr && !isSkippableSealError(rowErr)) return;
  }
  const meta = await sb
    .from("ledger_meta")
    .select("hotel")
    .eq("user_id", ownerId)
    .maybeSingle();
  if (meta.error || !meta.data) return;
  const hotel = ((meta.data as { hotel?: unknown }).hotel ?? {}) as Record<string, unknown>;
  const rawBooks =
    hotel._books && typeof hotel._books === "object" && !Array.isArray(hotel._books)
      ? (hotel._books as Record<string, unknown>)
      : {};
  const existing = Array.isArray(rawBooks.inventoryFiles)
    ? (rawBooks.inventoryFiles as InventoryFile[])
    : [];
  const { error } = await sb
    .from("ledger_meta")
    .update({
      hotel: {
        ...hotel,
        _books: {
          ...rawBooks,
          inventoryFiles: mergeInventoryFiles(merged, existing).filter(
            (file) => !blocked[file.id],
          ),
        },
      },
    })
    .eq("user_id", ownerId);
  if (error && !isSkippableSealError(error)) return;
}

function withRowId<T extends { id: string }>(row: T, prefix: string, i: number): T {
  return { ...row, id: row.id || uid(prefix) + String(i) };
}

/** Insert or update backup rows. Never deletes rows that are not in the file. */
export async function upsertLedgerFromBackup(
  userId: string,
  snap: LedgerSnapshot,
  role?: string,
): Promise<{ ok: true } | { ok: false; missingSchema: boolean; message: string }> {
  const sb = getSupabase();
  const meta = await sb
    .from("ledger_meta")
    .select("hotel")
    .eq("user_id", userId)
    .maybeSingle();
  const hotelRaw = meta.data
    ? (meta.data as { hotel?: unknown }).hotel
    : undefined;
  const locks = mergeLockState(
    {
      locked: parseLockedDates(snap.lockedDates),
      rev: parseLockRev(snap.lockRev),
    },
    {
      locked: locksFromHotel(hotelRaw) ?? {},
      rev: lockRevFromHotel(hotelRaw) ?? {},
    },
  );
  const gone = omitSealed(
    mergeSealed(parseSealedIds(snap.deletedIds), deletedFromHotel(hotelRaw)),
    [
      ...snap.guests.map((row) => sealKey.guest(row.id)),
      ...snap.food.map((row) => sealKey.food(row.id)),
      ...snap.wholesale.map((row) => sealKey.wholesale(row.id)),
      ...snap.expenses.map((row) => sealKey.expense(row.id)),
      ...snap.balReceived.map((row) => sealKey.balance(row.id)),
    ],
  );
  const seals = mergeSealed(
    parseSealedIds(snap.sealedIds),
    sealedFromHotel(hotelRaw),
  );
  const keep: LedgerPrune = {
    rooms: [],
    staff: [],
    expenses: [],
    balance: [],
    guests: [],
    food: [],
    wholesale: [],
    advances: [],
    complaints: [],
    inventory: [],
  };
  return pushLedger(
    userId,
    {
      ...snap,
      guests: snap.guests.map((row, i) => withRowId(row, "g", i)),
      food: snap.food.map((row, i) => withRowId(row, "f", i)),
      wholesale: snap.wholesale.map((row, i) => withRowId(row, "w", i)),
      expenses: snap.expenses.map((row, i) => withRowId(row, "e", i)),
      balReceived: snap.balReceived.map((row, i) => withRowId(row, "b", i)),
      staff: snap.staff.map((row, i) => withRowId(row, "st", i)),
      advances: snap.advances.map((row, i) => withRowId(row, "adv", i)),
      complaints: (snap.complaints ?? []).map((row, i) => withRowId(row, "c", i)),
      inventory: (snap.inventory ?? []).map((row, i) => withRowId(row, "inv", i)),
      lockedDates: locks.locked,
      lockRev: locks.rev,
      sealedIds: seals,
      deletedIds: gone,
    },
    "backup-import",
    role,
    keep,
  );
}
