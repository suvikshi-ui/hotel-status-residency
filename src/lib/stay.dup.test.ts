import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findDuplicateOnDate, postingKey } from "./stay.ts";
import type { GuestEntry } from "./types.ts";

function g(
  p: Partial<GuestEntry> & Pick<GuestEntry, "id" | "date" | "name" | "roomNo">,
): GuestEntry {
  return {
    slNo: 1,
    mode: "CASH",
    amount: 1500,
    stay: "continue",
    source: "Flysky",
    ...p,
  };
}

describe("register duplicate", () => {
  it("matches name + room + mode on the same date", () => {
    const guests = [
      g({
        id: "a",
        date: "2026-09-11",
        name: "RAMESH",
        roomNo: "101",
        checkIn: "2026-09-10",
      }),
    ];
    const hit = findDuplicateOnDate(guests, "2026-09-11", {
      name: "ramesh",
      roomNo: "101",
      mode: "CASH",
    });
    assert.equal(hit?.id, "a");
  });

  it("treats 0101 and 101 as the same room", () => {
    assert.equal(
      postingKey({ name: "RAMESH", roomNo: "0101", mode: "CASH" }),
      postingKey({ name: "RAMESH", roomNo: "101", mode: "CASH" }),
    );
  });

  it("does not match a different payment mode", () => {
    const guests = [
      g({ id: "a", date: "2026-09-11", name: "RAMESH", roomNo: "101" }),
    ];
    assert.equal(
      findDuplicateOnDate(guests, "2026-09-11", {
        name: "RAMESH",
        roomNo: "101",
        mode: "QRS",
      }),
      null,
    );
  });

  it("ignores the same row when editing", () => {
    const guests = [
      g({ id: "a", date: "2026-09-11", name: "RAMESH", roomNo: "101" }),
    ];
    assert.equal(
      findDuplicateOnDate(
        guests,
        "2026-09-11",
        { name: "RAMESH", roomNo: "101", mode: "CASH" },
        "a",
      ),
      null,
    );
  });
});
