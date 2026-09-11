import { create } from "zustand";
import { persist } from "zustand/middleware";
import seedJson from "@/data/seed.json";
import type {
  AdvanceRow,
  CreditGuest,
  DayBooks,
  GuestEntry,
  HotelInfo,
  JanFood,
  JanSale,
  ModeAmount,
  NamedAmount,
  OpeningBalances,
  OtaRow,
  RoomDef,
  SeedData,
  StaffRow,
} from "./types";
import { uid } from "./format";
import { applyGuestPatch, applyStay, applyYesterdayRoll } from "./stay";
import { rebuildDayBooks } from "./ledger";
import { fillAllSeedDates } from "./seed-fill";
import { earlierDate, mergeRowsByDate } from "./cloud-save";
import { parseAppRole, type AppRole } from "./roles";
import { isDayLocked, withLocked, withoutLocked, pickLockedDates, parseLockedDates, readStoredLocks, writeStoredLocks, hotelFromCloud } from "./register-lock";
import {
  normalizeInventory,
  seedInventory,
  type InventoryItem,
} from "./inventory";
import { demoComplaints, normalizeComplaints, type RoomComplaint } from "./complaints";

function afterSave() {
  void import("./supabase-sync").then((m) => m.requestCloudSave());
}

const seed = seedJson as SeedData;
const BASE_OPENING_DATE = seed.days[0]?.date ?? "2026-09-01";

export const LAST_SEEDED = "2026-09-09";
export const DEFAULT_DATE = "2026-09-09";
export const LEDGER_STORAGE_KEY = "status-ledger-v6";
const LEGACY_STORAGE_KEYS = ["status-ledger-v5", "status-ledger-v4"];

export interface LedgerState {
  hotel: HotelInfo;
  opening: OpeningBalances;
  rooms: RoomDef[];
  guests: GuestEntry[];
  food: ModeAmount[];
  wholesale: ModeAmount[];
  expenses: NamedAmount[];
  balReceived: NamedAmount[];
  days: DayBooks[];
  staff: StaffRow[];
  advances: AdvanceRow[];
  ota: OtaRow[];
  janSales: JanSale[];
  janFood: JanFood[];
  creditGuests: CreditGuest[];
  inventory: InventoryItem[];
  complaints: RoomComplaint[];
  selectedDate: string;
  dirty: Record<string, true>;
  openingDate: string;
  securityCode: string;
  appRole: AppRole;
  lockedDates: Record<string, true>;
  savedAt: number;
  setDate: (date: string) => void;
  setOpening: (date: string, opening: OpeningBalances) => void;
  setSecurityCode: (hash: string) => void;
  setAppRole: (role: AppRole) => void;
  lockRegister: (date: string) => void;
  unlockRegister: (date: string) => void;
  addGuest: (g: Omit<GuestEntry, "id" | "slNo" | "date"> & { date?: string }) => void;
  updateGuest: (id: string, patch: Partial<GuestEntry>) => void;
  setStay: (id: string, stay: "continue" | "out") => void;
  rollYesterday: (fromDate: string, continueIds: string[]) => void;
  removeGuest: (id: string) => void;
  addFood: (row: Omit<ModeAmount, "id" | "date"> & { date?: string }) => void;
  removeFood: (id: string) => void;
  addWholesale: (row: Omit<ModeAmount, "id" | "date"> & { date?: string }) => void;
  removeWholesale: (id: string) => void;
  addExpense: (row: Omit<NamedAmount, "id" | "date"> & { date?: string }) => void;
  removeExpense: (id: string) => void;
  addBalReceived: (row: Omit<NamedAmount, "id" | "date"> & { date?: string }) => void;
  removeBalReceived: (id: string) => void;
  restoreSeed: () => void;
  setStaff: (staff: StaffRow[]) => void;
  setAdvances: (advances: AdvanceRow[]) => void;
  setInventory: (inventory: InventoryItem[]) => void;
  setComplaints: (complaints: RoomComplaint[]) => void;
  applySnapshot: (p: Partial<LedgerState>) => void;
  replaceSnapshot: (p: Partial<LedgerState>) => void;
}

function seedState(): Omit<
  LedgerState,
  | "setDate"
  | "setOpening"
  | "setSecurityCode"
  | "setAppRole"
  | "lockRegister"
  | "unlockRegister"
  | "addGuest"
  | "updateGuest"
  | "setStay"
  | "rollYesterday"
  | "removeGuest"
  | "addFood"
  | "removeFood"
  | "addWholesale"
  | "removeWholesale"
  | "addExpense"
  | "removeExpense"
  | "addBalReceived"
  | "removeBalReceived"
  | "restoreSeed"
  | "setStaff"
  | "setAdvances"
  | "setInventory"
  | "setComplaints"
  | "applySnapshot"
  | "replaceSnapshot"
> {
  return {
    hotel: seed.hotel,
    opening: seed.opening,
    rooms: seed.rooms as RoomDef[],
    guests: seed.guests as GuestEntry[],
    food: seed.food as ModeAmount[],
    wholesale: seed.wholesale as ModeAmount[],
    expenses: seed.expenses as NamedAmount[],
    balReceived: seed.balReceived as NamedAmount[],
    days: seed.days as DayBooks[],
    staff: normalizeStaff(seed.staff as StaffRow[]),
    advances: normalizeAdvances(seed.advances as AdvanceRow[]),
    ota: seed.ota,
    janSales: seed.janSales,
    janFood: seed.janFood,
    creditGuests: seed.creditGuests,
    inventory: seedInventory(),
    complaints: demoComplaints(),
    selectedDate: DEFAULT_DATE,
    dirty: {},
    openingDate: BASE_OPENING_DATE,
    securityCode: "",
    appRole: "admin",
    lockedDates: {},
    savedAt: 0,
  };
}

function normalizeStaff(rows: StaffRow[]): StaffRow[] {
  return rows.map((r, i) => ({
    ...r,
    id: r.id || `st-${i}`,
    extra: r.extra ?? 0,
  }));
}

function normalizeAdvances(rows: AdvanceRow[]): AdvanceRow[] {
  return rows.map((r, i) => ({
    ...r,
    id: r.id || `adv-${i}`,
  }));
}

function mergeSnapshot(
  persisted: Partial<LedgerState>,
  current: LedgerState,
  opts?: { skipSeedFill?: boolean; replace?: boolean },
): LedgerState {
  const staff = normalizeStaff(persisted.staff ?? current.staff);
  const advances = normalizeAdvances(persisted.advances ?? current.advances);
  const rooms = (persisted.rooms?.length ? persisted.rooms : current.rooms) as RoomDef[];
  const inventory = normalizeInventory(persisted.inventory ?? current.inventory);
  const complaints = normalizeComplaints(persisted.complaints ?? current.complaints);
  const appRole = parseAppRole(persisted.appRole ?? current.appRole);
  const fromHotel = hotelFromCloud(persisted.hotel, current.hotel);
  const lockedDates = pickLockedDates(
    persisted.lockedDates !== undefined
      ? parseLockedDates(persisted.lockedDates)
      : undefined,
    current.lockedDates,
  );
  const guests = opts?.replace
    ? (persisted.guests ?? [])
    : opts?.skipSeedFill
      ? mergeRowsByDate(persisted.guests, current.guests)
      : fillAllSeedDates(
          mergeRowsByDate(persisted.guests, current.guests),
          (seed.guests as GuestEntry[]) ?? current.guests,
        );
  const food = opts?.replace
    ? (persisted.food ?? [])
    : opts?.skipSeedFill
      ? mergeRowsByDate(persisted.food, current.food)
      : fillAllSeedDates(
          mergeRowsByDate(persisted.food, current.food),
          (seed.food as ModeAmount[]) ?? current.food,
        );
  const wholesale = opts?.replace
    ? (persisted.wholesale ?? [])
    : opts?.skipSeedFill
      ? mergeRowsByDate(persisted.wholesale, current.wholesale)
      : fillAllSeedDates(
          mergeRowsByDate(persisted.wholesale, current.wholesale),
          (seed.wholesale as ModeAmount[]) ?? current.wholesale,
        );
  const expenses = opts?.replace
    ? (persisted.expenses ?? [])
    : opts?.skipSeedFill
      ? mergeRowsByDate(persisted.expenses, current.expenses)
      : fillAllSeedDates(
          mergeRowsByDate(persisted.expenses, current.expenses),
          (seed.expenses as NamedAmount[]) ?? current.expenses,
        );
  const balReceived = opts?.replace
    ? (persisted.balReceived ?? [])
    : mergeRowsByDate(persisted.balReceived, current.balReceived);
  let selectedDate = persisted.selectedDate ?? current.selectedDate ?? DEFAULT_DATE;
  const openingDate = opts?.replace
    ? persisted.openingDate || current.openingDate
    : earlierDate(persisted.openingDate, current.openingDate) ||
      current.openingDate;
  return {
    ...current,
    ...persisted,
    staff,
    advances,
    rooms,
    inventory,
    complaints,
    guests,
    food,
    wholesale,
    expenses,
    balReceived,
    selectedDate,
    openingDate,
    appRole,
    lockedDates,
    hotel: fromHotel.name ? fromHotel : current.hotel,
  };
}

function dayIsLocked(state: { lockedDates?: Record<string, true> }, date: string) {
  return isDayLocked(state.lockedDates, date);
}

function rebuildFrom(
  state: LedgerState,
  fromDate: string,
): Pick<LedgerState, "days" | "dirty"> {
  const days = rebuildDayBooks({
    openingDate: state.openingDate || BASE_OPENING_DATE,
    opening: state.opening,
    guests: state.guests,
    food: state.food,
    wholesale: state.wholesale,
    expenses: state.expenses,
    balReceived: state.balReceived,
    throughDates: [fromDate, state.selectedDate, state.openingDate],
  });
  const dirty: Record<string, true> = { ...state.dirty };
  for (const d of days) {
    if (d.date >= fromDate) dirty[d.date] = true;
  }
  return { days, dirty };
}

function withBooks(state: LedgerState): LedgerState {
  return { ...state, ...rebuildFrom(state, state.openingDate || BASE_OPENING_DATE) };
}

export const useLedger = create<LedgerState>()(
  persist(
    (set, get) => {
      const save: typeof set = ((...args: Parameters<typeof set>) => {
        set(...args);
        set({ savedAt: Date.now() });
        afterSave();
      }) as typeof set;
      return {
      ...seedState(),
      setDate: (date) => {
        const next = { ...get(), selectedDate: date };
        save({ selectedDate: date, ...rebuildFrom(next, date) });
      },
      setOpening: (date, opening) => {
        const next = { ...get(), opening, openingDate: date, selectedDate: date };
        save({
          opening,
          openingDate: date,
          selectedDate: date,
          ...rebuildFrom(next, date),
        });
      },
      setSecurityCode: (hash) => save({ securityCode: hash }),
      setAppRole: (role) => save({ appRole: parseAppRole(role) }),
      lockRegister: (date) => {
        const lockedDates = withLocked(get().lockedDates ?? {}, date);
        writeStoredLocks(ledgerOwnerKey(), lockedDates);
        save({ lockedDates });
      },
      unlockRegister: (date) => {
        const lockedDates = withoutLocked(get().lockedDates ?? {}, date);
        writeStoredLocks(ledgerOwnerKey(), lockedDates);
        save({ lockedDates });
      },
      addGuest: (g) => {
        const date = g.date ?? get().selectedDate;
        if (dayIsLocked(get(), date)) return;
        const existing = get().guests.filter((x) => x.date === date);
        const slNo = existing.reduce((m, x) => Math.max(m, x.slNo), 0) + 1;
        const guests = [
          ...get().guests,
          {
            ...g,
            id: uid("g"),
            date,
            slNo,
            checkIn: g.checkIn ?? date,
            stay: g.stay ?? "continue",
          } as GuestEntry,
        ];
        const next = { ...get(), guests };
        save({ guests, ...rebuildFrom(next, date) });
      },
      updateGuest: (id, patch) => {
        const current = get().guests.find((g) => g.id === id);
        if (current && dayIsLocked(get(), current.date)) return;
        const guests = applyGuestPatch(get().guests, id, patch);
        const row = guests.find((g) => g.id === id);
        const next = { ...get(), guests };
        save({ guests, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      setStay: (id, stay) => {
        const row = get().guests.find((g) => g.id === id);
        if (row && dayIsLocked(get(), row.date)) return;
        const guests = applyStay(get().guests, id, stay);
        const next = { ...get(), guests };
        save({ guests, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      rollYesterday: (fromDate, continueIds) => {
        const onto = /* today is selectedDate */ get().selectedDate;
        if (dayIsLocked(get(), onto)) return;
        const guests = applyYesterdayRoll(get().guests, fromDate, continueIds);
        const next = { ...get(), guests };
        save({ guests, ...rebuildFrom(next, fromDate) });
      },
      removeGuest: (id) => {
        const row = get().guests.find((g) => g.id === id);
        if (row && dayIsLocked(get(), row.date)) return;
        const guests = get().guests.filter((g) => g.id !== id);
        const next = { ...get(), guests };
        save({ guests, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      addFood: (row) => {
        const date = row.date ?? get().selectedDate;
        if (dayIsLocked(get(), date)) return;
        const food = [...get().food, { ...row, id: uid("f"), date }];
        const next = { ...get(), food };
        save({ food, ...rebuildFrom(next, date) });
      },
      removeFood: (id) => {
        const row = get().food.find((x) => x.id === id);
        if (row && dayIsLocked(get(), row.date)) return;
        const food = get().food.filter((x) => x.id !== id);
        const next = { ...get(), food };
        save({ food, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      addWholesale: (row) => {
        const date = row.date ?? get().selectedDate;
        if (dayIsLocked(get(), date)) return;
        const wholesale = [...get().wholesale, { ...row, id: uid("w"), date }];
        const next = { ...get(), wholesale };
        save({ wholesale, ...rebuildFrom(next, date) });
      },
      removeWholesale: (id) => {
        const row = get().wholesale.find((x) => x.id === id);
        if (row && dayIsLocked(get(), row.date)) return;
        const wholesale = get().wholesale.filter((x) => x.id !== id);
        const next = { ...get(), wholesale };
        save({
          wholesale,
          ...rebuildFrom(next, row?.date ?? get().selectedDate),
        });
      },
      addExpense: (row) => {
        const date = row.date ?? get().selectedDate;
        if (dayIsLocked(get(), date)) return;
        const expenses = [...get().expenses, { ...row, id: uid("e"), date }];
        const next = { ...get(), expenses };
        save({ expenses, ...rebuildFrom(next, date) });
      },
      removeExpense: (id) => {
        const row = get().expenses.find((x) => x.id === id);
        if (row && dayIsLocked(get(), row.date)) return;
        const expenses = get().expenses.filter((x) => x.id !== id);
        const next = { ...get(), expenses };
        save({
          expenses,
          ...rebuildFrom(next, row?.date ?? get().selectedDate),
        });
      },
      addBalReceived: (row) => {
        const date = row.date ?? get().selectedDate;
        if (dayIsLocked(get(), date)) return;
        const balReceived = [
          ...get().balReceived,
          { ...row, id: uid("b"), date },
        ];
        const next = { ...get(), balReceived };
        save({ balReceived, ...rebuildFrom(next, date) });
      },
      removeBalReceived: (id) => {
        const row = get().balReceived.find((x) => x.id === id);
        if (row && dayIsLocked(get(), row.date)) return;
        const balReceived = get().balReceived.filter((x) => x.id !== id);
        const next = { ...get(), balReceived };
        save({
          balReceived,
          ...rebuildFrom(next, row?.date ?? get().selectedDate),
        });
      },
      restoreSeed: () => {
        const s = seedState();
        save(s);
      },
      setStaff: (staff) => save({ staff: normalizeStaff(staff) }),
      setAdvances: (advances) => save({ advances: normalizeAdvances(advances) }),
      setInventory: (inventory) => save({ inventory: normalizeInventory(inventory) }),
      setComplaints: (complaints) =>
        save({ complaints: normalizeComplaints(complaints) }),
      applySnapshot: (p) => {
        const merged = mergeSnapshot(p, get(), { skipSeedFill: true });
        writeStoredLocks(ledgerOwnerKey(), merged.lockedDates ?? {});
        set({
          ...merged,
          ...rebuildFrom(merged, merged.openingDate || BASE_OPENING_DATE),
          savedAt: p.savedAt ?? merged.savedAt ?? Date.now(),
        });
      },
      replaceSnapshot: (p) => {
        const merged = mergeSnapshot(
          { ...p, appRole: get().appRole },
          get(),
          { skipSeedFill: true, replace: true },
        );
        writeStoredLocks(ledgerOwnerKey(), merged.lockedDates ?? {});
        set({
          ...merged,
          ...rebuildFrom(merged, merged.openingDate || BASE_OPENING_DATE),
          savedAt: Date.now(),
        });
        afterSave();
      },
    };
    },
    {
      name: LEDGER_STORAGE_KEY,
      skipHydration: true,
      partialize: (s) => ({
        guests: s.guests,
        food: s.food,
        wholesale: s.wholesale,
        expenses: s.expenses,
        balReceived: s.balReceived,
        days: s.days,
        selectedDate: s.selectedDate,
        dirty: s.dirty,
        advances: s.advances,
        staff: s.staff,
        rooms: s.rooms,
        opening: s.opening,
        openingDate: s.openingDate,
        securityCode: s.securityCode,
        inventory: s.inventory,
        complaints: s.complaints,
        appRole: s.appRole,
        lockedDates: s.lockedDates,
        savedAt: s.savedAt,
      }),
      merge: (persisted, current) =>
        withBooks(mergeSnapshot((persisted ?? {}) as Partial<LedgerState>, current)),
    },
  ),
);

function persistKey(version: string, userId: string | null) {
  return userId ? `${version}:${userId}` : version;
}

function persistState(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    const state = (parsed.state ?? parsed) as Record<string, unknown>;
    return state && typeof state === "object" ? state : null;
  } catch {
    return null;
  }
}

function datesOf(state: Record<string, unknown> | null) {
  const guests = (state?.guests as { date?: string }[] | undefined) ?? [];
  return guests.map((g) => (g.date ?? "").slice(0, 10)).filter(Boolean);
}

/** Bring 1–5 Sep (and any other missing days) back from the previous save key. */
export function adoptLegacyLedger(userId: string | null): boolean {
  if (typeof localStorage === "undefined") return false;
  const v6key = persistKey(LEDGER_STORAGE_KEY, userId);
  let v6raw = localStorage.getItem(v6key);
  const legacyKeys = [
    persistKey("status-ledger-v5", userId),
    persistKey("status-ledger-v4", userId),
    ...(!userId ? [] : LEGACY_STORAGE_KEYS),
    LEDGER_STORAGE_KEY,
  ];
  let donor: Record<string, unknown> | null = null;
  for (const key of legacyKeys) {
    if (key === v6key) continue;
    const state = persistState(localStorage.getItem(key));
    if (!state) continue;
    const early = datesOf(state).some((d) => d && d < "2026-09-06");
    if (early) {
      donor = state;
      break;
    }
    if (!donor) donor = state;
  }
  if (!donor) return false;
  const v6 = persistState(v6raw);
  if (!v6) {
    const wrap = JSON.stringify({ state: donor, version: 0 });
    localStorage.setItem(v6key, wrap);
    return true;
  }
  const v6early = datesOf(v6).some((d) => d && d < "2026-09-06");
  const donorEarly = datesOf(donor).some((d) => d && d < "2026-09-06");
  if (v6early || !donorEarly) return false;
  const guests = mergeRowsByDate(
    (v6.guests as { date: string }[]) ?? [],
    (donor.guests as { date: string }[]) ?? [],
  );
  const food = mergeRowsByDate(
    (v6.food as { date: string }[]) ?? [],
    (donor.food as { date: string }[]) ?? [],
  );
  const wholesale = mergeRowsByDate(
    (v6.wholesale as { date: string }[]) ?? [],
    (donor.wholesale as { date: string }[]) ?? [],
  );
  const expenses = mergeRowsByDate(
    (v6.expenses as { date: string }[]) ?? [],
    (donor.expenses as { date: string }[]) ?? [],
  );
  const balReceived = mergeRowsByDate(
    (v6.balReceived as { date: string }[]) ?? [],
    (donor.balReceived as { date: string }[]) ?? [],
  );
  const next = {
    ...v6,
    guests,
    food,
    wholesale,
    expenses,
    balReceived,
    openingDate: earlierDate(String(v6.openingDate ?? ""), String(donor.openingDate ?? "")) || "2026-09-01",
  };
  localStorage.setItem(v6key, JSON.stringify({ state: next, version: 0 }));
  return true;
}

let persistName = LEDGER_STORAGE_KEY;

export function ledgerOwnerKey() {
  const prefix = `${LEDGER_STORAGE_KEY}:`;
  if (persistName.startsWith(prefix)) return persistName.slice(prefix.length);
  return "anon";
}

function restoreStoredLocks(userId: string | null) {
  const disk = readStoredLocks(userId ?? "anon");
  if (!disk) return;
  useLedger.setState({ lockedDates: disk });
}

export async function setLedgerOwner(userId: string | null) {
  const name = userId
    ? `${LEDGER_STORAGE_KEY}:${userId}`
    : LEDGER_STORAGE_KEY;
  const adopted = adoptLegacyLedger(userId) || (userId ? adoptLegacyLedger(null) : false);
  if (persistName === name && useLedger.persist.hasHydrated()) {
    if (adopted) {
      try {
        await useLedger.persist.rehydrate();
      } catch {
        /* keep current */
      }
      const s = useLedger.getState();
      useLedger.setState(rebuildFrom(s, s.openingDate || BASE_OPENING_DATE));
    }
    restoreStoredLocks(userId);
    return;
  }
  persistName = name;
  useLedger.persist.setOptions({ name });
  try {
    await useLedger.persist.rehydrate();
  } catch {
    useLedger.setState(seedState());
  }
  restoreStoredLocks(userId);
  const s = useLedger.getState();
  useLedger.setState(rebuildFrom(s, s.openingDate || BASE_OPENING_DATE));
}

export function pickDayBooks(state: LedgerState, date: string): DayBooks | undefined {
  const hit = state.days.find((d) => d.date === date);
  if (hit) return hit;
  return rebuildDayBooks({
    openingDate: state.openingDate || BASE_OPENING_DATE,
    opening: state.opening,
    guests: state.guests,
    food: state.food,
    wholesale: state.wholesale,
    expenses: state.expenses,
    balReceived: state.balReceived,
    throughDates: [date, state.selectedDate],
  }).find((d) => d.date === date);
}

export function useDayBooks(date: string): DayBooks | undefined {
  return useLedger((s) => pickDayBooks(s, date));
}
