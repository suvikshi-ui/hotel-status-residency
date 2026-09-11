import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyYesterdayRoll,
  inHouseOnDate,
  stayKey,
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
      rows.map((r) => r.name),
      ["RAMESH"],
    );
  });

  it("ticks continue onto today and checks out the rest", () => {
    const guests = [
      g({ id: "a", date: "2026-09-10", name: "RAMESH", roomNo: "101" }),
      g({ id: "b", date: "2026-09-10", name: "SITA", roomNo: "102" }),
      g({ id: "c", date: "2026-09-10", name: "AJAY", roomNo: "103" }),
    ];
    const next = applyYesterdayRoll(guests, "2026-09-10", ["a", "c"]);
    const today = next.filter((x) => x.date === "2026-09-11");
    assert.equal(today.length, 2);
    assert.ok(stayOnDate(next, guests[0]!, "2026-09-11"));
    assert.ok(stayOnDate(next, guests[2]!, "2026-09-11"));
    assert.equal(stayOnDate(next, guests[1]!, "2026-09-11"), false);
    const sita = next.find((x) => x.id === "b");
    assert.equal(sita?.stay, "out");
    assert.equal(sita?.checkOut, "2026-09-10");
    const ramesh = next.find((x) => x.id === "a");
    assert.equal(ramesh?.stay, "continue");
  });

  it("unticked everyone checks out with no today copies", () => {
    const guests = [
      g({ id: "a", date: "2026-09-10", name: "RAMESH", roomNo: "101" }),
      g({ id: "b", date: "2026-09-10", name: "SITA", roomNo: "102" }),
    ];
    const next = applyYesterdayRoll(guests, "2026-09-10", []);
    assert.equal(next.filter((x) => x.date === "2026-09-11").length, 0);
    assert.ok(next.every((x) => x.date !== "2026-09-10" || x.stay === "out"));
  });

  it("does not duplicate a guest already posted today", () => {
    const ramesh = g({
      id: "a",
      date: "2026-09-10",
      name: "RAMESH",
      roomNo: "101",
    });
    const guests = [
      ramesh,
      g({
        id: "a2",
        date: "2026-09-11",
        name: "RAMESH",
        roomNo: "101",
        checkIn: "2026-09-10",
      }),
    ];
    const next = applyYesterdayRoll(guests, "2026-09-10", ["a"]);
    const today = next.filter(
      (x) => x.date === "2026-09-11" && stayKey(x) === stayKey(ramesh),
    );
    assert.equal(today.length, 1);
  });
});
