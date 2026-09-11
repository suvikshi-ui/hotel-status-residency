import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isDayLocked, withLocked, withoutLocked } from "./register-lock.ts";

describe("per-day register lock", () => {
  it("locks and unlocks one date without touching another", () => {
    const one = withLocked({}, "2026-09-11");
    assert.equal(isDayLocked(one, "2026-09-11"), true);
    assert.equal(isDayLocked(one, "2026-09-12"), false);
    const two = withLocked(one, "2026-09-12");
    assert.equal(isDayLocked(withoutLocked(two, "2026-09-11"), "2026-09-11"), false);
    assert.equal(isDayLocked(withoutLocked(two, "2026-09-11"), "2026-09-12"), true);
  });
});
