import type { PostgrestError } from "@supabase/supabase-js";
import { MODES } from "./format";
import { getSupabase } from "./supabase";
import {
  hotelForCloud,
  hotelFromCloud,
  locksFromHotel,
  parseLockedDates,
} from "./register-lock";
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
} from "./types";

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
  advances: AdvanceRow[];
  ota: OtaRow[];
  janSales: JanSale[];
  janFood: JanFood[];
  creditGuests: CreditGuest[];
  selectedDate: string;
  openingDate: string;
  securityCode: string;
  lockedDates?: Record<string, true>;
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

export function isMissingSchema(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  const m = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    m.includes("schema cache") ||
    (m.includes("could not find the table") && m.includes("public."))
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
    guests: (p.guests ?? fallback.guests) as GuestEntry[],
    food: (p.food ?? fallback.food) as ModeAmount[],
    wholesale: (p.wholesale ?? fallback.wholesale) as ModeAmount[],
    expenses: (p.expenses ?? fallback.expenses) as NamedAmount[],
    balReceived: (p.balReceived ?? fallback.balReceived) as NamedAmount[],
    staff: (p.staff ?? fallback.staff).map(staffOf),
    advances: (p.advances ?? fallback.advances).map(advanceOf),
    ota: (p.ota ?? fallback.ota) as OtaRow[],
    janSales: (p.janSales ?? fallback.janSales) as JanSale[],
    janFood: (p.janFood ?? fallback.janFood) as JanFood[],
    creditGuests: (p.creditGuests ?? fallback.creditGuests) as CreditGuest[],
    selectedDate: dateStr(p.selectedDate, fallback.selectedDate),
    openingDate: dateStr(p.openingDate, fallback.openingDate),
    securityCode: str(p.securityCode ?? fallback.securityCode),
    lockedDates,
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

export async function pullLedger(userId: string): Promise<CloudPull> {
  const sb = getSupabase();
  const meta = await sb
    .from("ledger_meta")
    .select(
      "hotel, opening, opening_date, selected_date, security_code, ota, jan_sales, jan_food, credit_guests, migrated_from",
    )
    .eq("user_id", userId)
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
  ] = await Promise.all([
    sb.from("rooms").select("no, floor, sort_index").eq("user_id", userId).order("sort_index"),
    sb.from("staff").select("*").eq("user_id", userId),
    sb.from("expenses").select("*").eq("user_id", userId),
    sb.from("balance_received").select("*").eq("user_id", userId),
    sb.from("guests").select("*").eq("user_id", userId),
    sb.from("food").select("*").eq("user_id", userId),
    sb.from("wholesale").select("*").eq("user_id", userId),
    sb.from("advances").select("*").eq("user_id", userId),
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
  if (firstErr) return asError(firstErr);

  const row = meta.data as Record<string, unknown>;
  const hotelRaw = row.hotel;
  const snapshot: LedgerSnapshot = {
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
    lockedDates: locksFromHotel(hotelRaw),
  };

  return { ok: true, kind: "data", snapshot };
}

async function replaceRows(
  table: string,
  userId: string,
  idField: string,
  rows: Record<string, unknown>[],
) {
  const sb = getSupabase();
  const { data: existing, error: selErr } = await sb
    .from(table)
    .select(idField)
    .eq("user_id", userId);
  if (selErr) return selErr;

  const keep = new Set(rows.map((r) => str(r[idField])));
  const extra = (existing ?? [])
    .map((r) => str((r as unknown as Record<string, unknown>)[idField]))
    .filter((id) => id && !keep.has(id));

  if (extra.length) {
    const { error } = await sb
      .from(table)
      .delete()
      .eq("user_id", userId)
      .in(idField, extra);
    if (error) return error;
  }

  if (!rows.length) {
    if ((existing ?? []).length) {
      const { error } = await sb.from(table).delete().eq("user_id", userId);
      if (error) return error;
    }
    return null;
  }

  const payload = rows.map((r) => ({ ...r, user_id: userId }));
  const chunk = 200;
  for (let i = 0; i < payload.length; i += chunk) {
    const { error } = await sb
      .from(table)
      .upsert(payload.slice(i, i + chunk), { onConflict: `user_id,${idField}` });
    if (error) return error;
  }
  return null;
}

export async function pushLedger(
  userId: string,
  snap: LedgerSnapshot,
  migratedFrom?: string,
): Promise<{ ok: true } | { ok: false; missingSchema: boolean; message: string }> {
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

  const writes: Array<Promise<PostgrestError | null>> = [
    replaceRows("rooms", userId, "no", rooms),
    replaceRows("staff", userId, "id", staff),
    replaceRows("expenses", userId, "id", expenses),
    replaceRows("balance_received", userId, "id", balance),
    replaceRows("guests", userId, "id", guests),
    replaceRows("food", userId, "id", food),
    replaceRows("wholesale", userId, "id", wholesale),
    replaceRows("advances", userId, "id", advances),
  ];
  const results = await Promise.all(writes);
  const err = results.find(Boolean);
  if (err) {
    const mapped = asError(err);
    if (mapped.ok) {
      return { ok: false, missingSchema: false, message: "Unknown error" };
    }
    return {
      ok: false,
      missingSchema: mapped.missingSchema,
      message: mapped.message,
    };
  }

  const sb = getSupabase();
  const { error: metaErr } = await sb.from("ledger_meta").upsert(
    {
      user_id: userId,
      hotel: hotelForCloud(snap.hotel, snap.lockedDates ?? {}),
      opening: snap.opening,
      opening_date: snap.openingDate,
      selected_date: snap.selectedDate,
      security_code: snap.securityCode,
      ota: snap.ota,
      jan_sales: snap.janSales,
      jan_food: snap.janFood,
      credit_guests: snap.creditGuests,
      migrated_from: migratedFrom ?? "app",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
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
  return { ok: true };
}
