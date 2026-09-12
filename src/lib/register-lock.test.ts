import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bumpLockRev,
  hotelForCloud,
  hotelFromCloud,
  isDayLocked,
  locksEqual,
  locksFromHotel,
  lockRevFromHotel,
  lockRevFromMeta,
  locksFromMeta,
  mergeLockState,
  parseLockedDates,
  pickLockedDates,
  withLocked,
  withoutLocked,
} from "./register-lock.ts";

const hotel = {
  name: "HSR",
  blessing: "x",
  place: "Siliguri",
  dailyTarget: 60000,
  month: "2026-09",
};

describe("per-day register lock", () => {
  it("locks and unlocks one date without touching another", () => {
    const one = withLocked({}, "2026-09-11");
    assert.equal(isDayLocked(one, "2026-09-11"), true);
    assert.equal(isDayLocked(one, "2026-09-12"), false);
    const two = withLocked(one, "2026-09-12");
    assert.equal(isDayLocked(withoutLocked(two, "2026-09-11"), "2026-09-11"), false);
    assert.equal(isDayLocked(withoutLocked(two, "2026-09-11"), "2026-09-12"), true);
  });

  it("keeps a lock across logout unless the incoming snapshot names locks", () => {
    const current = { "2026-09-12": true as const };
    assert.deepEqual(pickLockedDates(undefined, current), current);
    assert.deepEqual(pickLockedDates({}, current), {});
    assert.deepEqual(
      pickLockedDates({ "2026-09-11": true as const }, current),
      { "2026-09-11": true },
    );
  });

  it("round-trips locks inside hotel json for the account", () => {
    const packed = hotelForCloud(hotel, { "2026-09-12": true }, { "2026-09-12": 42 });
    assert.deepEqual(locksFromHotel(packed), { "2026-09-12": true });
    assert.deepEqual(lockRevFromHotel(packed), { "2026-09-12": 42 });
    assert.equal(hotelFromCloud(packed, hotel).name, "HSR");
    assert.equal(locksFromHotel(hotelFromCloud(packed, hotel)), undefined);
    assert.equal(locksFromHotel({ name: "HSR" }), undefined);
    assert.deepEqual(parseLockedDates({ "2026-09-12": true, bad: 1 }), {
      "2026-09-12": true,
    });
  });

  it("reads hotel json _lockedDates even if locked_dates column is empty", () => {
    assert.deepEqual(
      locksFromMeta({
        locked_dates: {},
        hotel: { _lockedDates: { "2026-09-12": true } },
      }),
      { "2026-09-12": true },
    );
    assert.deepEqual(
      lockRevFromMeta({
        lock_rev: {},
        hotel: { _lockRev: { "2026-09-12": 9 } },
      }),
      { "2026-09-12": 9 },
    );
    assert.deepEqual(
      locksFromMeta({ hotel: { _lockedDates: { "2026-09-01": true } } }),
      { "2026-09-01": true },
    );
    assert.equal(locksFromMeta({ hotel: { name: "HSR" } }), undefined);
  });

  it("treats the same dates as equal regardless of key order", () => {
    assert.equal(
      locksEqual({ "2026-09-11": true, "2026-09-12": true }, {
        "2026-09-12": true,
        "2026-09-11": true,
      }),
      true,
    );
    assert.equal(locksEqual({ "2026-09-11": true }, {}), false);
  });

  it("bumps lock revision so unlock on one desk beats an older lock", () => {
    const rev = bumpLockRev({ "2026-09-12": 10 }, "2026-09-12", 9);
    assert.equal(rev["2026-09-12"], 11);
    const unlocked = mergeLockState(
      { locked: {}, rev: bumpLockRev({ "2026-09-12": 10 }, "2026-09-12", 50) },
      { locked: { "2026-09-12": true }, rev: { "2026-09-12": 10 } },
    );
    assert.equal(unlocked.locked["2026-09-12"], undefined);
  });
});
