import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyGuestPatch,
  applyStay,
  applyYesterdayRoll,
  findDuplicateOnDate,
  inHouseOnDate,
  stayOnDate,
} from "./stay.ts";
import type { GuestEntry } from "./types.ts";

function g(
  p: Partial<GuestEntry> & Pick<GuestEntry, "id" | "date" | "name" | "roomNo">,
): GuestEntry {
  return {
    slNo: 1,
    mode: "CASH",
    amount: 1500,
    stay: "continue",
    source: null,
    ...p,
  };
}

describe("yesterday roll", () => {
  it("lists only in-house yesterday guests", () => {
    const guests = [
      g({ id: "a", date: "2026-09-10", name: "RAMESH", roomNo: "101" }),
      g({
        id: "b",
        date: "2026-09-10",
        name: "SITA",
        roomNo: "102",
        stay: "out",
      }),
      g({ id: "c", date: "2026-09-11", name: "NEW", roomNo: "103" }),
    ];
    const rows = inHouseOnDate(guests, "2026-09-10");
    assert.deepEqual(
      rows.map((r) => r.id),
      ["a"],
    );
  });

  it("ticks continue onto today and checks out the rest", () => {
    const guests = [
      g({ id: "a", date: "2026-09-10", name: "RAMESH", roomNo: "101" }),
      g({ id: "b", date: "2026-09-10", name: "SITA", roomNo: "102" }),
    ];
    const next = applyYesterdayRoll(guests, "2026-09-10", ["a"]);
    assert.equal(next.find((x) => x.id === "a")?.stay, "continue");
    assert.equal(next.find((x) => x.id === "b")?.stay, "out");
    assert.ok(next.some((x) => x.date === "2026-09-11" && x.name === "RAMESH"));
    assert.equal(
      next.filter((x) => x.date === "2026-09-11" && x.name === "SITA").length,
      0,
    );
  });

  it("unticked everyone checks out with no today copies", () => {
    const guests = [
      g({ id: "a", date: "2026-09-10", name: "RAMESH", roomNo: "101" }),
    ];
    const next = applyYesterdayRoll(guests, "2026-09-10", []);
    assert.equal(next.find((x) => x.id === "a")?.stay, "out");
    assert.equal(next.filter((x) => x.date === "2026-09-11").length, 0);
  });

  it("does not duplicate a guest already posted today", () => {
    const guests = [
      g({ id: "a", date: "2026-09-10", name: "RAMESH", roomNo: "101" }),
      g({ id: "a2", date: "2026-09-11", name: "RAMESH", roomNo: "101" }),
    ];
    const next = applyYesterdayRoll(guests, "2026-09-10", ["a"]);
    assert.equal(
      next.filter((x) => x.date === "2026-09-11" && x.name === "RAMESH").length,
      1,
    );
  });
});

describe("duplicate posting key", () => {
  it("matches name, room and mode on the same date", () => {
    const guests = [
      g({ id: "a", date: "2026-09-09", name: "RAMESH", roomNo: "101", mode: "CASH" }),
    ];
    const hit = findDuplicateOnDate(guests, "2026-09-09", {
      name: "RAMESH",
      roomNo: "101",
      mode: "CASH",
    });
    assert.equal(hit?.id, "a");
  });

  it("does not match a different mode or another day", () => {
    const guests = [
      g({ id: "a", date: "2026-09-09", name: "RAMESH", roomNo: "101", mode: "CASH" }),
    ];
    assert.equal(
      findDuplicateOnDate(guests, "2026-09-09", {
        name: "RAMESH",
        roomNo: "101",
        mode: "QRS",
      }),
      null,
    );
    assert.equal(
      findDuplicateOnDate(guests, "2026-09-10", {
        name: "RAMESH",
        roomNo: "101",
        mode: "CASH",
      }),
      null,
    );
  });

  it("skips the row being edited", () => {
    const guests = [
      g({ id: "a", date: "2026-09-09", name: "RAMESH", roomNo: "101" }),
    ];
    assert.equal(
      findDuplicateOnDate(
        guests,
        "2026-09-09",
        { name: "RAMESH", roomNo: "101", mode: "CASH" },
        "a",
      ),
      null,
    );
  });
});

describe("undo checkout", () => {
  it("puts a mistaken checkout back on continue and opens the next night", () => {
    const guests = [
      g({
        id: "a",
        date: "2026-09-09",
        name: "PRASAD",
        roomNo: "210",
        mode: "BALANCE",
        source: "MOT",
        checkIn: "2026-09-01",
        stay: "out",
        checkOut: "2026-09-10",
      }),
    ];
    const next = applyStay(guests, "a", "continue");
    const row = next.find((x) => x.id === "a");
    assert.equal(row?.stay, "continue");
    assert.equal(row?.checkOut ?? null, null);
    assert.ok(next.some((x) => x.date === "2026-09-10" && x.name === "PRASAD"));
  });

  it("lets yesterday roll re-tick a guest who was checked out by mistake", () => {
    const guests = [
      g({
        id: "a",
        date: "2026-09-09",
        name: "PANKAJ",
        roomNo: "105",
        stay: "out",
        checkOut: "2026-09-10",
      }),
    ];
    const next = applyYesterdayRoll(guests, "2026-09-09", ["a"]);
    assert.equal(next.find((x) => x.id === "a")?.stay, "continue");
    assert.ok(next.some((x) => x.date === "2026-09-10" && x.name === "PANKAJ"));
  });
});

describe("guest save", () => {
  it("copies source onto every night of the stay", () => {
    const guests = [
      g({
        id: "a1",
        date: "2026-09-08",
        name: "PRASAD",
        roomNo: "210",
        mode: "BALANCE",
        source: "MOT",
        checkIn: "2026-09-01",
      }),
      g({
        id: "a2",
        date: "2026-09-09",
        name: "PRASAD",
        roomNo: "210",
        mode: "BALANCE",
        source: "MOT",
        checkIn: "2026-09-01",
      }),
    ];
    const next = applyGuestPatch(guests, "a2", { source: "MOTWANI" });
    assert.equal(next.find((x) => x.id === "a1")?.source, "MOTWANI");
    assert.equal(next.find((x) => x.id === "a2")?.source, "MOTWANI");
  });
});
