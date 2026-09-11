import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hotelForCloud,
  hotelFromCloud,
  isDayLocked,
  locksFromHotel,
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
    const packed = hotelForCloud(hotel, { "2026-09-12": true });
    assert.deepEqual(locksFromHotel(packed), { "2026-09-12": true });
    assert.equal(hotelFromCloud(packed, hotel).name, "HSR");
    assert.equal(locksFromHotel(hotelFromCloud(packed, hotel)), undefined);
    assert.equal(locksFromHotel({ name: "HSR" }), undefined);
    assert.deepEqual(parseLockedDates({ "2026-09-12": true, bad: 1 }), {
      "2026-09-12": true,
    });
  });
});
