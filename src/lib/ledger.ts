import type {
  CashBook,
  DayBooks,
  DayMix,
  GuestEntry,
  MixSlice,
  ModeAmount,
  NamedAmount,
  OnlineLedger,
  OpeningBalances,
  OutstandingLedger,
  PayMode,
  QrLedger,
} from "./types";

function emptySlice(): MixSlice {
  return { sale: 0, food: 0, ws: 0 };
}

function emptyMix(): DayMix {
  return {
    cash: emptySlice(),
    qr: emptySlice(),
    online: emptySlice(),
    balance: emptySlice(),
    totals: emptySlice(),
  };
}

function add(slice: MixSlice, key: keyof MixSlice, n: number) {
  slice[key] += n;
}

function bucket(mode: PayMode): keyof Omit<DayMix, "totals"> {
  if (mode === "CASH") return "cash";
  if (mode === "QRS") return "qr";
  if (mode === "BALANCE") return "balance";
  return "online";
}

function sumAmt(rows: NamedAmount[]) {
  return rows.reduce((s, e) => s + e.amount, 0);
}

export function computeMix(
  guests: GuestEntry[],
  food: ModeAmount[],
  wholesale: ModeAmount[],
): DayMix {
  const mix = emptyMix();
  for (const g of guests) add(mix[bucket(g.mode)], "sale", g.amount);
  for (const f of food) add(mix[bucket(f.mode)], "food", f.amount);
  for (const w of wholesale) add(mix[bucket(w.mode)], "ws", w.amount);
  for (const k of ["sale", "food", "ws"] as const) {
    mix.totals[k] =
      mix.cash[k] + mix.qr[k] + mix.online[k] + mix.balance[k];
  }
  return mix;
}

export interface PrevClose {
  cash: number;
  santosh: number;
  pk: number;
  online: number;
  outstanding: number;
}

export function computeBooks(input: {
  date: string;
  guests: GuestEntry[];
  food: ModeAmount[];
  wholesale: ModeAmount[];
  expenses: NamedAmount[];
  balReceived: NamedAmount[];
  prev: PrevClose;
}): DayBooks {
  const mix = computeMix(input.guests, input.food, input.wholesale);
  const cashExp = input.expenses
    .filter((e) => e.mode === "CASH")
    .reduce((s, e) => s + e.amount, 0);
  const qrExp = input.expenses
    .filter((e) => e.mode === "QRS")
    .reduce((s, e) => s + e.amount, 0);
  const pkExp = input.expenses
    .filter((e) => e.mode === "QRPK")
    .reduce((s, e) => s + e.amount, 0);

  const due = input.balReceived.filter((e) => e.kind !== "ota");
  const ota = input.balReceived.filter((e) => e.kind === "ota");
  const dueCash = sumAmt(due.filter((e) => e.mode === "CASH"));
  const dueQr = sumAmt(due.filter((e) => e.mode === "QRS"));
  const duePk = sumAmt(
    due.filter((e) => e.mode === "QRPK" || e.mode === "ONLINE"),
  );
  const otaIn = sumAmt(ota);

  const qrOut = mix.qr.sale + mix.qr.food + mix.qr.ws;
  const onlineOut = mix.online.sale + mix.online.food + mix.online.ws;

  const cashBook: CashBook = {
    ob: input.prev.cash,
    sales: mix.totals.sale,
    food: mix.totals.food,
    ws: mix.totals.ws,
    balReceived: dueCash,
    gross: 0,
    exp: cashExp,
    qr: qrOut,
    online: onlineOut,
    balance: mix.balance.sale,
    cb: 0,
  };
  cashBook.gross =
    cashBook.ob +
    cashBook.sales +
    cashBook.food +
    cashBook.ws +
    cashBook.balReceived;
  cashBook.cb =
    cashBook.gross -
    cashBook.exp -
    cashBook.qr -
    cashBook.online -
    cashBook.balance;

  const santosh: QrLedger = {
    ob: input.prev.santosh,
    salesQr: mix.qr.sale,
    foodQr: mix.qr.food + mix.qr.ws,
    exp: qrExp,
    other: dueQr,
    cb: 0,
  };
  santosh.cb =
    santosh.ob + santosh.salesQr + santosh.foodQr + santosh.other - santosh.exp;

  const qrpkSale = input.guests
    .filter((g) => g.mode === "QRPK")
    .reduce((s, g) => s + g.amount, 0);
  const qrpkFoodWs =
    input.food.filter((f) => f.mode === "QRPK").reduce((s, f) => s + f.amount, 0) +
    input.wholesale
      .filter((w) => w.mode === "QRPK")
      .reduce((s, w) => s + w.amount, 0);

  const pk: QrLedger = {
    ob: input.prev.pk,
    salesQr: qrpkSale,
    foodQr: qrpkFoodWs,
    exp: pkExp,
    other: duePk + otaIn,
    cb: 0,
  };
  pk.cb = pk.ob + pk.salesQr + pk.foodQr + pk.other - pk.exp;

  const onlineSale = input.guests
    .filter((g) => g.mode === "ONLINE")
    .reduce((s, g) => s + g.amount, 0);
  const online: OnlineLedger = {
    ob: input.prev.online,
    sales: onlineSale,
    balReceived: otaIn,
    cb: 0,
  };
  online.cb = online.ob + online.sales - online.balReceived;

  const outstanding: OutstandingLedger = {
    ob: input.prev.outstanding,
    sales: mix.balance.sale,
    balReceived: dueCash + dueQr + duePk,
    cb: 0,
  };
  outstanding.cb = outstanding.ob - outstanding.balReceived + outstanding.sales;

  return {
    date: input.date,
    mix,
    cashBook,
    santosh,
    pk,
    outstanding,
    online,
  };
}

export function openingAsPrev(o: OpeningBalances): PrevClose {
  return {
    cash: o.cash,
    santosh: o.santosh,
    pk: o.pk,
    online: o.online,
    outstanding: o.outstanding,
  };
}

export function closeAsPrev(d: DayBooks): PrevClose {
  return {
    cash: d.cashBook.cb,
    santosh: d.santosh.cb,
    pk: d.pk.cb,
    online: d.online.cb,
    outstanding: d.outstanding.cb,
  };
}
