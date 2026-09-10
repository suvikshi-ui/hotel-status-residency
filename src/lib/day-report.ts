import type { GuestEntry, ModeAmount, PayMode } from "./types";

export interface SliceTake {
  rooms: number;
  food: number;
  ws: number;
}

export interface DayTake {
  cash: SliceTake;
  santosh: SliceTake;
  pk: SliceTake;
  online: SliceTake;
  due: SliceTake;
  roomsTotal: number;
  foodTotal: number;
  wsTotal: number;
  qrTotal: number;
  allIn: number;
  balanceRooms: string[];
}

function addMode(
  rows: { mode: PayMode; amount: number }[],
  mode: PayMode,
) {
  return rows.filter((r) => r.mode === mode).reduce((s, r) => s + r.amount, 0);
}

function slice(
  guests: GuestEntry[],
  food: ModeAmount[],
  ws: ModeAmount[],
  mode: PayMode,
): SliceTake {
  return {
    rooms: addMode(guests, mode),
    food: addMode(food, mode),
    ws: addMode(ws, mode),
  };
}

function tot(s: SliceTake) {
  return s.rooms + s.food + s.ws;
}

export function buildDayTake(
  guests: GuestEntry[],
  food: ModeAmount[],
  wholesale: ModeAmount[],
): DayTake {
  const cash = slice(guests, food, wholesale, "CASH");
  const santosh = slice(guests, food, wholesale, "QRS");
  const pk = slice(guests, food, wholesale, "QRPK");
  const online = slice(guests, food, wholesale, "ONLINE");
  const due = slice(guests, food, wholesale, "BALANCE");
  const roomsTotal =
    cash.rooms + santosh.rooms + pk.rooms + online.rooms + due.rooms;
  const foodTotal = cash.food + santosh.food + pk.food + online.food + due.food;
  const wsTotal = cash.ws + santosh.ws + pk.ws + online.ws + due.ws;
  return {
    cash,
    santosh,
    pk,
    online,
    due,
    roomsTotal,
    foodTotal,
    wsTotal,
    qrTotal: tot(santosh) + tot(pk),
    allIn: roomsTotal + foodTotal + wsTotal,
    balanceRooms: [
      ...new Set(
        guests.filter((g) => g.mode === "BALANCE").map((g) => g.roomNo),
      ),
    ],
  };
}
