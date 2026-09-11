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
import { fillAllSeedDates, SEEDED_DATES } from "./seed-fill";
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
  setDate: (date: string) => void;
  setOpening: (date: string, opening: OpeningBalances) => void;
  setSecurityCode: (hash: string) => void;
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
}

function seedState(): Omit<
  LedgerState,
  | "setDate"
  | "setOpening"
  | "setSecurityCode"
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
): LedgerState {
  const staff = normalizeStaff(persisted.staff ?? current.staff);
  const advances = normalizeAdvances(persisted.advances ?? current.advances);
  const rooms = (persisted.rooms?.length ? persisted.rooms : current.rooms) as RoomDef[];
  const inventory = normalizeInventory(persisted.inventory ?? current.inventory);
  const complaints = normalizeComplaints(persisted.complaints ?? current.complaints);
  const guests = fillAllSeedDates(
    persisted.guests,
    (seed.guests as GuestEntry[]) ?? current.guests,
  );
  const food = fillAllSeedDates(
    persisted.food,
    (seed.food as ModeAmount[]) ?? current.food,
  );
  const wholesale = fillAllSeedDates(
    persisted.wholesale,
    (seed.wholesale as ModeAmount[]) ?? current.wholesale,
  );
  const expenses = fillAllSeedDates(
    persisted.expenses,
    (seed.expenses as NamedAmount[]) ?? current.expenses,
  );
  let selectedDate = persisted.selectedDate ?? current.selectedDate;
  const latest = SEEDED_DATES[SEEDED_DATES.length - 1];
  selectedDate = latest;
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
    selectedDate,
  };
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
      addGuest: (g) => {
        const date = g.date ?? get().selectedDate;
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
        const guests = applyGuestPatch(get().guests, id, patch);
        const row = guests.find((g) => g.id === id);
        const next = { ...get(), guests };
        save({ guests, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      setStay: (id, stay) => {
        const row = get().guests.find((g) => g.id === id);
        const guests = applyStay(get().guests, id, stay);
        const next = { ...get(), guests };
        save({ guests, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      rollYesterday: (fromDate, continueIds) => {
        const guests = applyYesterdayRoll(get().guests, fromDate, continueIds);
        const next = { ...get(), guests };
        save({ guests, ...rebuildFrom(next, fromDate) });
      },
      removeGuest: (id) => {
        const row = get().guests.find((g) => g.id === id);
        const guests = get().guests.filter((g) => g.id !== id);
        const next = { ...get(), guests };
        save({ guests, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      addFood: (row) => {
        const date = row.date ?? get().selectedDate;
        const food = [...get().food, { ...row, id: uid("f"), date }];
        const next = { ...get(), food };
        save({ food, ...rebuildFrom(next, date) });
      },
      removeFood: (id) => {
        const row = get().food.find((x) => x.id === id);
        const food = get().food.filter((x) => x.id !== id);
        const next = { ...get(), food };
        save({ food, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      addWholesale: (row) => {
        const date = row.date ?? get().selectedDate;
        const wholesale = [...get().wholesale, { ...row, id: uid("w"), date }];
        const next = { ...get(), wholesale };
        save({ wholesale, ...rebuildFrom(next, date) });
      },
      removeWholesale: (id) => {
        const row = get().wholesale.find((x) => x.id === id);
        const wholesale = get().wholesale.filter((x) => x.id !== id);
        const next = { ...get(), wholesale };
        save({
          wholesale,
          ...rebuildFrom(next, row?.date ?? get().selectedDate),
        });
      },
      addExpense: (row) => {
        const date = row.date ?? get().selectedDate;
        const expenses = [...get().expenses, { ...row, id: uid("e"), date }];
        const next = { ...get(), expenses };
        save({ expenses, ...rebuildFrom(next, date) });
      },
      removeExpense: (id) => {
        const row = get().expenses.find((x) => x.id === id);
        const expenses = get().expenses.filter((x) => x.id !== id);
        const next = { ...get(), expenses };
        save({
          expenses,
          ...rebuildFrom(next, row?.date ?? get().selectedDate),
        });
      },
      addBalReceived: (row) => {
        const date = row.date ?? get().selectedDate;
        const balReceived = [
          ...get().balReceived,
          { ...row, id: uid("b"), date },
        ];
        const next = { ...get(), balReceived };
        save({ balReceived, ...rebuildFrom(next, date) });
      },
      removeBalReceived: (id) => {
        const row = get().balReceived.find((x) => x.id === id);
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
        const merged = mergeSnapshot(p, get());
        save({
          ...merged,
          ...rebuildFrom(merged, merged.openingDate || BASE_OPENING_DATE),
        });
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
      }),
      merge: (persisted, current) =>
        withBooks(mergeSnapshot((persisted ?? {}) as Partial<LedgerState>, current)),
    },
  ),
);

export async function setLedgerOwner(userId: string | null) {
  const name = userId
    ? `${LEDGER_STORAGE_KEY}:${userId}`
    : LEDGER_STORAGE_KEY;
  useLedger.persist.setOptions({ name });
  useLedger.setState(seedState());
  try {
    await useLedger.persist.rehydrate();
  } catch {
    /* keep seed if saved ledger cannot restore */
  }
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
