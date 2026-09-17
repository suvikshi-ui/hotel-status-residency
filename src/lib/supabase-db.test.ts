import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  earlierDate,
  mergeRowsByDate,
  preferLocalOverCloud,
} from "./cloud-save.ts";
import { isMissingSchema, isSkippableSealError } from "./cloud-errors.ts";

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

  it("loads the cloud book when it is newer and as full", () => {
    assert.equal(
      preferLocalOverCloud({
        localSavedAt: 1_000,
        cloudUpdatedAt: 2_000,
        localScore: 40,
        cloudScore: 42,
      }),
      false,
    );
  });

  it("does not replace a restored JSON book with an empty account", () => {
    assert.equal(
      preferLocalOverCloud({
        localSavedAt: 1_000,
        cloudUpdatedAt: 9_000,
        localScore: 777,
        cloudScore: 0,
      }),
      true,
    );
  });

  it("does not drop a restored JSON book for a thinner newer account", () => {
    assert.equal(
      preferLocalOverCloud({
        localSavedAt: 1_000,
        cloudUpdatedAt: 9_000,
        localScore: 777,
        cloudScore: 80,
      }),
      true,
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

describe("optional sheet seals", () => {
  it("treats a missing sheet_seals table as skippable", () => {
    assert.equal(
      isMissingSchema({ code: "PGRST205", message: "Could not find the table" }),
      true,
    );
    assert.equal(
      isSkippableSealError({
        code: "PGRST205",
        message: "Could not find the table public.sheet_seals in the schema cache",
      }),
      true,
    );
  });

  it("does not fail register save when sheet_seals is permission denied", () => {
    assert.equal(
      isSkippableSealError({
        code: "42501",
        message: "permission denied for table sheet_seals",
      }),
      true,
    );
    assert.equal(
      isSkippableSealError({
        message: "new row violates row-level security policy for table \"sheet_seals\"",
      }),
      true,
    );
  });

  it("still fails a real guests permission error via the same helper only for seals", () => {
    assert.equal(
      isMissingSchema({ code: "42501", message: "permission denied for table guests" }),
      false,
    );
  });
});
