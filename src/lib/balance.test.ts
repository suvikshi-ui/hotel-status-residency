import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  allocateStaysFifo,
  buildDueAccounts,
  splitStayNights,
  stayFromNights,
  type DueLine,
  type DueStay,
} from "./balance.ts";
import type { GuestEntry, NamedAmount } from "./types.ts";

function night(
  p: Partial<DueLine> & Pick<DueLine, "id" | "date" | "name">,
): DueLine {
  return {
    roomNo: "101",
    amount: 2000,
    source: "Flysky",
    stay: "continue",
    ...p,
  };
}

function guest(
  p: Partial<GuestEntry> & Pick<GuestEntry, "id" | "date" | "name">,
): GuestEntry {
  return {
    slNo: 1,
    roomNo: "101",
    mode: "BALANCE",
    amount: 2000,
    source: "Flysky",
    stay: "continue",
    ...p,
  };
}

function receipt(
  p: Partial<NamedAmount> & Pick<NamedAmount, "id" | "amount">,
): NamedAmount {
  return {
    date: "2026-09-05",
    particular: "Flysky",
    mode: "CASH",
    kind: "due",
    ...p,
  };
}

describe("stay grouping", () => {
  it("collapses consecutive nights into one stay", () => {
    const stays = splitStayNights([
      night({ id: "1", date: "2026-09-01", name: "RAMESH" }),
      night({ id: "2", date: "2026-09-02", name: "RAMESH" }),
      night({ id: "3", date: "2026-09-03", name: "RAMESH", stay: "out" }),
    ]);
    assert.equal(stays.length, 1);
    const row = stayFromNights(stays[0]!);
    assert.equal(row.days, 3);
    assert.equal(row.perDay, 2000);
    assert.equal(row.billed, 6000);
    assert.equal(row.checkIn, "2026-09-01");
    assert.equal(row.checkOut, "2026-09-04");
    assert.equal(row.inHouse, false);
  });

  it("counts nights from check-in 11:00 AM to checkout 11:00 AM", () => {
    const stays = splitStayNights([
      night({
        id: "1",
        date: "2026-09-06",
        name: "PRASAD",
        roomNo: "210",
        source: "MOT",
        checkIn: "2026-09-01",
      }),
      night({
        id: "2",
        date: "2026-09-07",
        name: "PRASAD",
        roomNo: "210",
        source: "MOT",
        checkIn: "2026-09-01",
      }),
      night({
        id: "3",
        date: "2026-09-08",
        name: "PRASAD",
        roomNo: "210",
        source: "MOT",
        checkIn: "2026-09-01",
      }),
      night({
        id: "4",
        date: "2026-09-09",
        name: "PRASAD",
        roomNo: "210",
        source: "MOT",
        checkIn: "2026-09-01",
        stay: "out",
      }),
    ]);
    assert.equal(stays.length, 1);
    const row = stayFromNights(stays[0]!);
    assert.equal(row.checkIn, "2026-09-01");
    assert.equal(row.checkOut, "2026-09-10");
    assert.equal(row.days, 9);
    assert.equal(row.perDay, 2000);
    assert.equal(row.billed, 8000);
  });

  it("keeps Continue until the next chart is made without ticking them", () => {
    const nights = [
      night({
        id: "1",
        date: "2026-09-08",
        name: "PANKAJ",
        checkIn: "2026-09-08",
      }),
      night({
        id: "2",
        date: "2026-09-09",
        name: "PANKAJ",
        checkIn: "2026-09-08",
      }),
    ];
    const open = stayFromNights(nights, "2026-09-09");
    assert.equal(open.checkOut, null);
    assert.equal(open.inHouse, true);
    assert.equal(open.days, 2);
    const left = stayFromNights(nights, "2026-09-10");
    assert.equal(left.checkOut, "2026-09-10");
    assert.equal(left.inHouse, false);
    assert.equal(left.days, 2);
  });

  it("splits a return visit after checkout", () => {
    const stays = splitStayNights([
      night({ id: "1", date: "2026-09-01", name: "RAMESH", stay: "out" }),
      night({ id: "2", date: "2026-09-10", name: "RAMESH" }),
    ]);
    assert.equal(stays.length, 2);
  });

  it("splits a calendar gap into two stays", () => {
    const stays = splitStayNights([
      night({ id: "1", date: "2026-09-01", name: "RAMESH" }),
      night({ id: "2", date: "2026-09-05", name: "RAMESH" }),
    ]);
    assert.equal(stays.length, 2);
  });
});

describe("FIFO paid tick", () => {
  it("ticks the oldest stay Paid first", () => {
    const stays: DueStay[] = [
      {
        id: "old",
        name: "A",
        roomNo: "101",
        checkIn: "2026-09-01",
        checkOut: "2026-09-02",
        inHouse: false,
        days: 2,
        perDay: 2000,
        billed: 4000,
        paid: 0,
        remaining: 4000,
        status: "open",
      },
      {
        id: "new",
        name: "B",
        roomNo: "102",
        checkIn: "2026-09-03",
        checkOut: null,
        inHouse: true,
        days: 1,
        perDay: 2000,
        billed: 2000,
        paid: 0,
        remaining: 2000,
        status: "open",
      },
    ];
    const out = allocateStaysFifo(stays, 4000);
    assert.equal(out[0]!.status, "paid");
    assert.equal(out[0]!.remaining, 0);
    assert.equal(out[1]!.status, "open");
    assert.equal(out[1]!.remaining, 2000);
  });

  it("marks a leftover as Partial", () => {
    const stays: DueStay[] = [
      {
        id: "only",
        name: "A",
        roomNo: "101",
        checkIn: "2026-09-01",
        checkOut: null,
        inHouse: true,
        days: 2,
        perDay: 1500,
        billed: 3000,
        paid: 0,
        remaining: 3000,
        status: "open",
      },
    ];
    const out = allocateStaysFifo(stays, 1000);
    assert.equal(out[0]!.status, "partial");
    assert.equal(out[0]!.paid, 1000);
    assert.equal(out[0]!.remaining, 2000);
  });
});

describe("buildDueAccounts stays", () => {
  it("puts Flysky guests under one source and ticks paid after collection", () => {
    const accounts = buildDueAccounts(
      [
        guest({ id: "a1", date: "2026-09-01", name: "RAMESH", stay: "out" }),
        guest({ id: "b1", date: "2026-09-02", name: "SITA" }),
        guest({
          id: "c1",
          date: "2026-09-02",
          name: "MOTOR MAN",
          source: "Motor",
        }),
      ],
      [receipt({ id: "r1", amount: 2000 })],
    );
    const fly = accounts.find((a) => a.key === "Flysky");
    const motor = accounts.find((a) => a.key === "Motor");
    assert.ok(fly);
    assert.ok(motor);
    assert.equal(fly!.stays.length, 2);
    assert.equal(fly!.stays[0]!.name, "RAMESH");
    assert.equal(fly!.stays[0]!.status, "paid");
    assert.equal(fly!.stays[1]!.status, "open");
    assert.equal(motor!.stays[0]!.status, "open");
    assert.equal(motor!.collected, 0);
  });
});
