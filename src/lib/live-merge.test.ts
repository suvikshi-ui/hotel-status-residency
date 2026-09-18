import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeByKey, mergeLiveSnapshot, mergeRowsById, pick3 } from "./live-merge.ts";
import { mergeLockState } from "./register-lock.ts";
import type { LedgerSnapshot } from "./supabase-db.ts";

const hotel = {
  name: "HSR",
  blessing: "x",
  place: "Siliguri",
  dailyTarget: 60000,
  month: "2026-09",
};

function snap(partial: Partial<LedgerSnapshot>): LedgerSnapshot {
  return {
    hotel,
    opening: { cash: 0, santosh: 0, pk: 0, online: 0, outstanding: 0 },
    rooms: [],
    guests: [],
    food: [],
    wholesale: [],
    expenses: [],
    balReceived: [],
    staff: [],
    advances: [],
    ota: [],
    janSales: [],
    janFood: [],
    creditGuests: [],
    selectedDate: "2026-09-12",
    openingDate: "2026-09-01",
    securityCode: "",
    lockedDates: {},
    lockRev: {},
    inventory: [],
    complaints: [],
    savedAt: 0,
    ...partial,
  };
}

describe("live merge across desks", () => {
  it("keeps same-day guests from both computers by id", () => {
    const next = mergeRowsById(
      [{ id: "a", date: "2026-09-12", name: "Desk A" }],
      [{ id: "b", date: "2026-09-12", name: "Desk B" }],
    );
    assert.equal(next.length, 2);
    assert.ok(next.some((r) => r.id === "a"));
    assert.ok(next.some((r) => r.id === "b"));
  });

  it("does not restore a guest this desk deleted even if the account still has it", () => {
    const gone = {
      id: "g6",
      date: "2026-09-06",
      slNo: 1,
      name: "SIXTH",
      roomNo: "101",
      mode: "CASH" as const,
      amount: 1,
    };
    const next = mergeLiveSnapshot(
      snap({ guests: [gone], deletedIds: {} }),
      snap({ guests: [], deletedIds: { "guest:g6": true } }),
      snap({ guests: [gone], deletedIds: {} }),
    );
    assert.equal(next.guests.length, 0);
    assert.equal(next.deletedIds?.["guest:g6"], true);
  });

  it("keeps a guest this desk added and one the other desk added", () => {
    const base = [{ id: "old", date: "2026-09-11" }];
    const local = [
      { id: "old", date: "2026-09-11" },
      { id: "mine", date: "2026-09-12" },
    ];
    const cloud = [
      { id: "old", date: "2026-09-11" },
      { id: "theirs", date: "2026-09-12" },
    ];
    const next = mergeByKey((r) => r.id, base, local, cloud);
    assert.deepEqual(
      next.map((r) => r.id).sort(),
      ["mine", "old", "theirs"],
    );
  });

  it("honours a newer unlock over an older lock", () => {
    const next = mergeLockState(
      { locked: {}, rev: { "2026-09-12": 200 } },
      { locked: { "2026-09-12": true }, rev: { "2026-09-12": 100 } },
    );
    assert.equal(next.locked["2026-09-12"], undefined);
    assert.equal(next.rev["2026-09-12"], 200);
  });

  it("lets a lock on one desk win against a stale unlocked copy", () => {
    const next = mergeLockState(
      { locked: {}, rev: {} },
      { locked: { "2026-09-12": true }, rev: {} },
    );
    assert.equal(next.locked["2026-09-12"], true);
  });

  it("merges lock plus new guest into one live snapshot", () => {
    const base = snap({
      guests: [{ id: "g1", date: "2026-09-12", slNo: 1, name: "Old", roomNo: "1", mode: "CASH", amount: 1 }],
    });
    const local = snap({
      guests: [
        ...base.guests,
        { id: "g2", date: "2026-09-12", slNo: 2, name: "New here", roomNo: "2", mode: "CASH", amount: 2 },
      ],
      lockedDates: { "2026-09-12": true },
      lockRev: { "2026-09-12": 9 },
      selectedDate: "2026-09-11",
    });
    const cloud = snap({
      guests: base.guests,
      lockedDates: {},
      savedAt: 50,
    });
    const merged = mergeLiveSnapshot(base, local, cloud);
    assert.equal(merged.guests.length, 2);
    assert.equal(merged.lockedDates?.["2026-09-12"], true);
    assert.equal(merged.selectedDate, "2026-09-11");
  });

  it("takes the other desk's full locked day instead of this desk's thinner copy", () => {
    const local = snap({
      guests: [
        { id: "g1", date: "2026-09-09", slNo: 1, name: "Thin", roomNo: "1", mode: "CASH", amount: 1 },
      ],
      selectedDate: "2026-09-09",
    });
    const cloud = snap({
      guests: [
        { id: "g1", date: "2026-09-09", slNo: 1, name: "RAM", roomNo: "101", mode: "CASH", amount: 2000 },
        { id: "g2", date: "2026-09-09", slNo: 2, name: "SHYAM", roomNo: "102", mode: "BALANCE", amount: 2500 },
      ],
      lockedDates: { "2026-09-09": true },
      lockRev: { "2026-09-09": 4 },
      savedAt: 50,
    });
    const merged = mergeLiveSnapshot(local, local, cloud);
    assert.equal(merged.guests.length, 2);
    assert.equal(merged.guests.find((g) => g.id === "g1")?.name, "RAM");
    assert.ok(merged.guests.some((g) => g.id === "g2"));
    assert.equal(merged.lockedDates?.["2026-09-09"], true);
  });

  it("picks cloud scalar when local did not change", () => {
    assert.equal(pick3("a", "a", "b"), "b");
    assert.equal(pick3("a", "c", "a"), "c");
  });
});
