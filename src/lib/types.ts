export type PayMode = "CASH" | "QRS" | "ONLINE" | "BALANCE" | "QRPK";

export interface GuestEntry {
  id: string;
  date: string;
  slNo: number;
  name: string;
  roomNo: string;
  mode: PayMode;
  amount: number;
  checkIn?: string | null;
  checkOut?: string | null;
  inTime?: string | null;
  outTime?: string | null;
  stay?: "continue" | "out" | null;
  ac?: string | null;
  time?: string | null;
  coDate?: string | null;
  source?: string | null;
}

export interface ModeAmount {
  id: string;
  date: string;
  mode: PayMode;
  amount: number;
}

export interface NamedAmount extends ModeAmount {
  particular: string;
  kind?: "due" | "ota" | "other";
}

export interface MixSlice {
  sale: number;
  food: number;
  ws: number;
}

export interface DayMix {
  cash: MixSlice;
  qr: MixSlice;
  online: MixSlice;
  balance: MixSlice;
  totals: MixSlice;
}

export interface CashBook {
  ob: number;
  sales: number;
  food: number;
  ws: number;
  balReceived: number;
  gross: number;
  exp: number;
  qr: number;
  online: number;
  balance: number;
  cb: number;
}

export interface QrLedger {
  ob: number;
  salesQr: number;
  foodQr: number;
  exp: number;
  other: number;
  cb: number;
}

export interface OutstandingLedger {
  ob: number;
  sales: number;
  balReceived: number;
  cb: number;
}

export interface OnlineLedger {
  ob: number;
  sales: number;
  balReceived: number;
  cb: number;
}

export interface DayBooks {
  date: string;
  mix: DayMix;
  cashBook: CashBook;
  santosh: QrLedger;
  pk: QrLedger;
  outstanding: OutstandingLedger;
  online: OnlineLedger;
}

export interface StaffRow {
  id: string;
  name: string;
  salary: number;
  role: string;
  days: string;
  absent: number;
  working: number;
  extra: number;
  advance: number;
  weekOff: number;
  total: number;
  status: string;
  month: string;
}

export interface AdvanceRow {
  id: string;
  name: string;
  cash: number;
  qrs: number;
  month: string;
}

export interface OtaRow {
  guest: string;
  source: string;
  checkIn: string;
  checkOut: string;
  roomRent: number;
  paidBy: string;
  commission: number;
  foodBill: number;
  pending: number;
  amount: number;
  status: string;
  notes: string;
}

export interface CreditGuest {
  name: string;
  source: string;
  daily: number[];
  total: number;
}

export interface RoomDef {
  no: string;
  floor: "Ground" | "First" | "Second" | "Third";
}

export interface HotelInfo {
  name: string;
  blessing: string;
  place: string;
  dailyTarget: number;
  month: string;
}

export interface OpeningBalances {
  cash: number;
  santosh: number;
  pk: number;
  online: number;
  outstanding: number;
}

export interface JanSale {
  date: string;
  sales: number;
}

export interface JanFood {
  date: string;
  food: number;
  ws: number;
}

export interface SeedData {
  hotel: HotelInfo;
  opening: OpeningBalances;
  rooms: RoomDef[];
  guests: GuestEntry[];
  food: ModeAmount[];
  wholesale: ModeAmount[];
  balReceived: NamedAmount[];
  expenses: NamedAmount[];
  days: DayBooks[];
  staff: StaffRow[];
  advances: AdvanceRow[];
  ota: OtaRow[];
  janSales: JanSale[];
  janFood: JanFood[];
  creditGuests: CreditGuest[];
}
