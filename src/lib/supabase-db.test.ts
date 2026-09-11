import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  earlierDate,
  mergeRowsByDate,
  preferLocalOverCloud,
} from "./cloud-save.ts";

describe("cloud save", () => {
  it("keeps a just-saved local book instead of an older cloud copy", () => {
    assert.equal(
      preferLocalOverCloud({
        localSavedAt: 2_000,
        cloudUpdatedAt: 1_000,
        localScore: 10,
        cloudScore: 10,
      }),
      true,
    );
  });

  it("loads the cloud book when it is newer", () => {
    assert.equal(
      preferLocalOverCloud({
        localSavedAt: 1_000,
        cloudUpdatedAt: 2_000,
        localScore: 40,
        cloudScore: 10,
      }),
      false,
    );
  });

  it("keeps 1–5 Sep when 6–9 Sep is the current book", () => {
    const sixth = [{ id: "g6", date: "2026-09-06", name: "SEED" }];
    const first = [{ id: "g1", date: "2026-09-01", name: "OLD" }];
    const next = mergeRowsByDate(sixth, first);
    assert.equal(next.length, 2);
    assert.ok(next.some((r) => r.date === "2026-09-01"));
    assert.ok(next.some((r) => r.date === "2026-09-06"));
  });

  it("picks the earlier opening date", () => {
    assert.equal(earlierDate("2026-09-06", "2026-09-01"), "2026-09-01");
  });
});
