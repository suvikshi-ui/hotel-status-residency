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
import { applyStay } from "./stay";
import { closeAsPrev, computeBooks, openingAsPrev } from "./ledger";

const seed = seedJson as SeedData;
const BASE_OPENING = seed.opening;
const BASE_OPENING_DATE = seed.days[0]?.date ?? "2026-09-01";

export const LAST_SEEDED = "2026-09-01";
export const DEFAULT_DATE = LAST_SEEDED;
export const LEDGER_STORAGE_KEY = "status-ledger-v5";

function byDate<T extends { date: string }>(rows: T[], date: string) {
  return rows.filter((r) => r.date === date);
}

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
}

function seedState(): Omit<
  LedgerState,
  | "setDate"
  | "setOpening"
  | "setSecurityCode"
  | "addGuest"
  | "updateGuest"
  | "setStay"
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
    staff: (seed.staff as StaffRow[]).map((r, i) => ({
      ...r,
      id: r.id || `st-${i}`,
      extra: r.extra ?? 0,
    })),
    advances: (seed.advances as AdvanceRow[]).map((r, i) => ({
      ...r,
      id: r.id || `adv-${i}`,
    })),
    ota: seed.ota,
    janSales: seed.janSales,
    janFood: seed.janFood,
    creditGuests: seed.creditGuests,
    selectedDate: DEFAULT_DATE,
    dirty: {},
    openingDate: BASE_OPENING_DATE,
    securityCode: "",
  };
}

function rebuildFrom(
  state: LedgerState,
  fromDate: string,
): Pick<LedgerState, "days" | "dirty"> {
  const dates = new Set<string>([
    ...state.days.map((d) => d.date),
    ...state.guests.map((g) => g.date),
    fromDate,
    state.openingDate,
  ]);
  const ordered = [...dates].sort();
  const startIdx = ordered.indexOf(fromDate);
  const kept = state.days.filter((d) => d.date < fromDate);
  const epoch = state.openingDate || BASE_OPENING_DATE;
  let prev =
    kept.length > 0
      ? closeAsPrev(kept[kept.length - 1]!)
      : openingAsPrev(
          fromDate >= epoch ? state.opening : BASE_OPENING,
        );

  const rebuilt: DayBooks[] = [...kept];
  const dirty: Record<string, true> = { ...state.dirty };
  for (const date of ordered.slice(Math.max(0, startIdx))) {
    if (date === epoch) prev = openingAsPrev(state.opening);
    const books = computeBooks({
      date,
      guests: byDate(state.guests, date),
      food: byDate(state.food, date),
      wholesale: byDate(state.wholesale, date),
      expenses: byDate(state.expenses, date),
      balReceived: byDate(state.balReceived, date),
      prev,
    });
    rebuilt.push(books);
    dirty[date] = true;
    prev = closeAsPrev(books);
  }
  return { days: rebuilt, dirty };
}

export const useLedger = create<LedgerState>()(
  persist(
    (set, get) => ({
      ...seedState(),
      setDate: (date) => set({ selectedDate: date }),
      setOpening: (date, opening) => {
        const next = { ...get(), opening, openingDate: date, selectedDate: date };
        set({
          opening,
          openingDate: date,
          selectedDate: date,
          ...rebuildFrom(next, date),
        });
      },
      setSecurityCode: (hash) => set({ securityCode: hash }),
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
        set({ guests, ...rebuildFrom(next, date) });
      },
      updateGuest: (id, patch) => {
        const guests = get().guests.map((g) =>
          g.id === id ? { ...g, ...patch } : g,
        );
        const row = guests.find((g) => g.id === id);
        const next = { ...get(), guests };
        set({ guests, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      setStay: (id, stay) => {
        const row = get().guests.find((g) => g.id === id);
        const guests = applyStay(get().guests, id, stay);
        const next = { ...get(), guests };
        set({ guests, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      removeGuest: (id) => {
        const row = get().guests.find((g) => g.id === id);
        const guests = get().guests.filter((g) => g.id !== id);
        const next = { ...get(), guests };
        set({ guests, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      addFood: (row) => {
        const date = row.date ?? get().selectedDate;
        const food = [...get().food, { ...row, id: uid("f"), date }];
        const next = { ...get(), food };
        set({ food, ...rebuildFrom(next, date) });
      },
      removeFood: (id) => {
        const row = get().food.find((x) => x.id === id);
        const food = get().food.filter((x) => x.id !== id);
        const next = { ...get(), food };
        set({ food, ...rebuildFrom(next, row?.date ?? get().selectedDate) });
      },
      addWholesale: (row) => {
        const date = row.date ?? get().selectedDate;
        const wholesale = [...get().wholesale, { ...row, id: uid("w"), date }];
        const next = { ...get(), wholesale };
        set({ wholesale, ...rebuildFrom(next, date) });
      },
      removeWholesale: (id) => {
        const row = get().wholesale.find((x) => x.id === id);
        const wholesale = get().wholesale.filter((x) => x.id !== id);
        const next = { ...get(), wholesale };
        set({
          wholesale,
          ...rebuildFrom(next, row?.date ?? get().selectedDate),
        });
      },
      addExpense: (row) => {
        const date = row.date ?? get().selectedDate;
        const expenses = [...get().expenses, { ...row, id: uid("e"), date }];
        const next = { ...get(), expenses };
        set({ expenses, ...rebuildFrom(next, date) });
      },
      removeExpense: (id) => {
        const row = get().expenses.find((x) => x.id === id);
        const expenses = get().expenses.filter((x) => x.id !== id);
        const next = { ...get(), expenses };
        set({
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
        set({ balReceived, ...rebuildFrom(next, date) });
      },
      removeBalReceived: (id) => {
        const row = get().balReceived.find((x) => x.id === id);
        const balReceived = get().balReceived.filter((x) => x.id !== id);
        const next = { ...get(), balReceived };
        set({
          balReceived,
          ...rebuildFrom(next, row?.date ?? get().selectedDate),
        });
      },
      restoreSeed: () => {
        const s = seedState();
        set(s);
      },
      setStaff: (staff) => set({ staff }),
      setAdvances: (advances) => set({ advances }),
    }),
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
        opening: s.opening,
        openingDate: s.openingDate,
        securityCode: s.securityCode,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LedgerState>;
        const staff = (p.staff ?? current.staff).map((r, i) => ({
          ...r,
          id: r.id || `st-${i}`,
          extra: r.extra ?? 0,
        }));
        const advances = (p.advances ?? current.advances).map((r, i) => ({
          ...r,
          id: r.id || `adv-${i}`,
        }));
        return { ...current, ...p, staff, advances };
      },
    },
  ),
);

export async function setLedgerOwner(userId: string | null) {
  const name = userId
    ? `${LEDGER_STORAGE_KEY}:${userId}`
    : LEDGER_STORAGE_KEY;
  useLedger.setState(seedState());
  useLedger.persist.setOptions({ name });
  try {
    await useLedger.persist.rehydrate();
  } catch {
    /* keep seed if saved ledger cannot restore */
  }
}

export function useDayBooks(date: string): DayBooks | undefined {
  const days = useLedger((s) => s.days);
  return days.find((d) => d.date === date);
}

export function useDayGuests(date: string) {
  const guests = useLedger((s) => s.guests);
  return guests.filter((g) => g.date === date);
}
