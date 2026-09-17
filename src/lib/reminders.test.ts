import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dueReminders, normalizeReminders, reminderIsDue } from "./reminders.ts";

const row = {
  id: "r1",
  note: "Pay licence",
  date: "2026-08-31",
  repeat: "monthly" as const,
};

describe("reminders", () => {
  it("fires monthly on the same day, and on month-end when the day is missing", () => {
    assert.equal(reminderIsDue(row, "2026-08-31"), true);
    assert.equal(reminderIsDue(row, "2026-09-30"), true);
    assert.equal(reminderIsDue(row, "2026-02-28"), false);
    assert.equal(reminderIsDue({ ...row, date: "2026-01-31" }, "2026-02-28"), true);
    assert.equal(reminderIsDue(row, "2026-08-30"), false);
    assert.equal(reminderIsDue(row, "2026-07-31"), false);
  });

  it("fires quarterly and half-year from the start date", () => {
    const q = { ...row, repeat: "quarterly" as const, date: "2026-09-17" };
    assert.equal(reminderIsDue(q, "2026-09-17"), true);
    assert.equal(reminderIsDue(q, "2026-12-17"), true);
    assert.equal(reminderIsDue(q, "2027-03-17"), true);
    assert.equal(reminderIsDue(q, "2026-10-17"), false);
    const half = { ...row, repeat: "half" as const, date: "2026-09-17" };
    assert.equal(reminderIsDue(half, "2026-09-17"), true);
    assert.equal(reminderIsDue(half, "2027-03-17"), true);
    assert.equal(reminderIsDue(half, "2026-12-17"), false);
  });

  it("fires yearly only on that month and day", () => {
    const yearly = { ...row, repeat: "yearly" as const, date: "2026-08-15" };
    assert.equal(reminderIsDue(yearly, "2026-08-15"), true);
    assert.equal(reminderIsDue(yearly, "2027-08-15"), true);
    assert.equal(reminderIsDue(yearly, "2026-09-15"), false);
    assert.equal(reminderIsDue(yearly, "2026-08-14"), false);
  });

  it("fires a manual reminder only on that one date", () => {
    const one = { ...row, repeat: "manual" as const, date: "2026-09-20" };
    assert.equal(reminderIsDue(one, "2026-09-20"), true);
    assert.equal(reminderIsDue(one, "2026-10-20"), false);
    assert.equal(reminderIsDue(one, "2027-09-20"), false);
  });

  it("keeps due rows for the popup", () => {
    const rows = normalizeReminders([
      row,
      { id: "r2", note: "GST", date: "2026-09-17", repeat: "yearly" },
      { id: "bad", note: "", date: "2026-09-17", repeat: "monthly" },
    ]);
    assert.equal(rows.length, 2);
    assert.equal(dueReminders(rows, "2026-09-17").length, 1);
    assert.equal(dueReminders(rows, "2026-09-17")[0]?.note, "GST");
  });
});
