import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BACKUP_KIND,
  backupCounts,
  backupFilename,
  buildBackupFile,
  mergeMonthBooks,
  monthsInTables,
  parseBackupFile,
  sliceBackupTables,
} from "./backup.ts";

describe("ledger backup", () => {
  it("round-trips every table through JSON", () => {
    const tables = {
      guests: [
        {
          id: "g1",
          date: "2026-09-01",
          slNo: 1,
          name: "RAMESH",
          roomNo: "101",
          mode: "CASH",
          amount: 1800,
        },
      ],
      food: [{ id: "f1", date: "2026-09-01", mode: "CASH", amount: 200 }],
      expenses: [
        {
          id: "e1",
          date: "2026-09-01",
          mode: "CASH",
          amount: 50,
          particular: "milk",
        },
      ],
      rooms: [{ no: "101", floor: "First" }],
    };
    const file = buildBackupFile(tables);
    const parsed = parseBackupFile(JSON.parse(JSON.stringify(file)));
    assert.equal(parsed.kind, BACKUP_KIND);
    assert.equal((parsed.tables.guests?.[0] as { name: string }).name, "RAMESH");
    const counts = backupCounts(parsed.tables);
    assert.equal(counts.guests, 1);
    assert.deepEqual(counts.dates, ["2026-09-01"]);
  });

  it("rejects junk", () => {
    assert.throws(() => parseBackupFile("hello"), /backup/i);
    assert.throws(() => parseBackupFile({ foo: 1 }), /backup/i);
  });

  it("names the file with the day", () => {
    assert.equal(
      backupFilename(new Date("2026-09-12T00:00:00.000Z")),
      "HSR-backup-2026-09-12.json",
    );
  });

  it("keeps save-cube seals and locks in the file", () => {
    const file = buildBackupFile({
      guests: [
        {
          id: "g1",
          date: "2026-09-12",
          slNo: 1,
          name: "RAMESH",
          roomNo: "101",
          mode: "CASH",
          amount: 1800,
        },
      ],
      rooms: [{ no: "101", floor: "First" }],
      lockedDates: { "2026-09-12": true },
      lockRev: { "2026-09-12": 9 },
      sealedIds: { "guest:g1": true, "inv:2026-09": true },
      hotel: {
        name: "Status Residency",
        _lockedDates: { "2026-09-12": true },
        _sealedIds: { "guest:g1": true },
      },
    });
    const parsed = parseBackupFile(JSON.parse(JSON.stringify(file)));
    assert.deepEqual(parsed.tables.sealedIds, {
      "guest:g1": true,
      "inv:2026-09": true,
    });
    assert.deepEqual(parsed.tables.lockedDates, { "2026-09-12": true });
    const hotel = parsed.tables.hotel as {
      _lockedDates: Record<string, true>;
      _sealedIds: Record<string, true>;
    };
    assert.equal(hotel._lockedDates["2026-09-12"], true);
    assert.equal(hotel._sealedIds["guest:g1"], true);
  });

  it("keeps staff, payroll and inventory files", () => {
    const file = buildBackupFile({
      guests: [],
      rooms: [{ no: "101", floor: "First" }],
      staffRegister: [{ id: "s1", name: "Raju" }],
      payrollFiles: [{ id: "pay-2026-09", kind: "salary" }],
      inventoryFiles: [{ id: "ifile:ws:2026-09-24", kind: "ws" }],
      bankRows: [{ id: "b1" }],
      deletedIds: { "ifile:ws:2026-09-01": true },
    });
    const parsed = parseBackupFile(JSON.parse(JSON.stringify(file)));
    assert.equal(parsed.tables.staffRegister?.length, 1);
    assert.equal(parsed.tables.payrollFiles?.length, 1);
    assert.equal(parsed.tables.inventoryFiles?.length, 1);
    assert.equal(parsed.tables.bankRows?.length, 1);
    const counts = backupCounts(parsed.tables);
    assert.equal(counts.inventoryFiles, 1);
    assert.equal(counts.payrollFiles, 1);
    assert.equal(counts.staffRegister, 1);
  });
});

describe("monthly backup", () => {
  const both = {
    guests: [
      { id: "s1", date: "2026-09-02", slNo: 4, name: "SEPT" },
      { id: "o1", date: "2026-10-01", slNo: 9, name: "OCT" },
    ],
    food: [{ id: "f9", date: "2026-09-02", amount: 100 }],
    expenses: [{ id: "e10", date: "2026-10-03", amount: 50 }],
    bankRows: [
      { id: "b9", month: "2026-09", date: "2026-09-02", particular: "sept" },
      { id: "b10", month: "2026-10", date: "2026-10-01", particular: "oct" },
    ],
    monthOpenings: [
      { month: "2026-09", cash: 25000, santosh: 0, pk: 0 },
      { month: "2026-10", cash: 9000, santosh: 100, pk: 0 },
    ],
    monthArchives: [
      { month: "2026-09", guests: [{ id: "s1" }] },
      { month: "2026-10", guests: [{ id: "o1" }] },
    ],
    lockedDates: { "2026-09-02": true, "2026-10-01": true },
    lockRev: { "2026-09-02": 2, "2026-10-01": 1 },
    openMonths: ["2026-10"],
    rooms: [{ no: "101", floor: "First" }],
    inventoryFiles: [
      { id: "ifile:ws:2026-09-02", period: "2026-09-02", kind: "ws" },
      { id: "ifile:ws:2026-10-01", period: "2026-10-01", kind: "ws" },
    ],
  };

  it("lists both months and slices only September", () => {
    assert.deepEqual(monthsInTables(both), ["2026-09", "2026-10"]);
    const sliced = sliceBackupTables(both, "2026-09");
    assert.deepEqual(
      (sliced.guests as { id: string }[]).map((row) => row.id),
      ["s1"],
    );
    assert.equal((sliced.guests as { slNo: number }[])[0].slNo, 4);
    assert.equal((sliced.expenses as unknown[]).length, 0);
    assert.equal((sliced.bankRows as { id: string }[])[0].id, "b9");
    assert.equal((sliced.monthOpenings as { month: string }[])[0].month, "2026-09");
    assert.deepEqual(sliced.lockedDates, { "2026-09-02": true });
    assert.deepEqual(sliced.openMonths, []);
    assert.equal((sliced.rooms as { no: string }[])[0].no, "101");
    assert.equal((sliced.inventoryFiles as unknown[]).length, 1);
    const file = buildBackupFile(sliced, "2026-09");
    assert.equal(file.month, "2026-09");
    assert.equal(backupFilename("2026-09"), "HSR-backup-2026-09.json");
    const parsed = parseBackupFile(JSON.parse(JSON.stringify(file)));
    assert.equal(parsed.month, "2026-09");
  });

  it("imports October into empty books, then September, without wiping either", () => {
    const empty = {
      guests: [] as { id: string; date: string; slNo: number; name: string }[],
      bankRows: [] as { id: string; month: string }[],
      monthOpenings: [] as { month: string; cash: number }[],
      lockedDates: {} as Record<string, true>,
      openMonths: [] as string[],
      opening: { cash: 0, santosh: 0, pk: 0, online: 0, outstanding: 0 },
    };
    const october = sliceBackupTables(both, "2026-10");
    const withOct = mergeMonthBooks(empty, october as never, "2026-10", true);
    assert.deepEqual(
      withOct.guests.map((row) => row.id),
      ["o1"],
    );
    assert.equal(withOct.guests[0].slNo, 9);
    assert.equal(withOct.bankRows.length, 1);
    assert.equal(withOct.monthOpenings[0].cash, 9000);

    const september = sliceBackupTables(both, "2026-09");
    const withBoth = mergeMonthBooks(withOct, september as never, "2026-09", false);
    assert.deepEqual(
      withBoth.guests.map((row) => row.id).sort(),
      ["o1", "s1"],
    );
    assert.equal(withBoth.guests.find((row) => row.id === "o1")?.slNo, 9);
    assert.equal(withBoth.guests.find((row) => row.id === "s1")?.slNo, 4);
    assert.equal(withBoth.bankRows.length, 2);
    assert.equal(withBoth.monthOpenings.length, 2);
    assert.equal(withBoth.lockedDates["2026-10-01"], true);
    assert.equal(withBoth.lockedDates["2026-09-02"], true);
    assert.deepEqual(withBoth.openMonths, ["2026-10"]);
  });

  it("replaces only the chosen month and tombstones a dropped guest", () => {
    const base = {
      guests: [
        { id: "s1", date: "2026-09-02", slNo: 4 },
        { id: "s2", date: "2026-09-03", slNo: 5 },
        { id: "o1", date: "2026-10-01", slNo: 9 },
      ],
      deletedIds: {} as Record<string, true>,
      openMonths: ["2026-09", "2026-10"],
      opening: { cash: 25000, santosh: 0, pk: 0, online: 0, outstanding: 0 },
    };
    const next = mergeMonthBooks(
      base,
      { guests: [{ id: "s2", date: "2026-09-03", slNo: 5 }] },
      "2026-09",
      true,
    );
    assert.deepEqual(
      next.guests.map((row) => row.id).sort(),
      ["o1", "s2"],
    );
    assert.equal(next.guests.find((row) => row.id === "o1")?.slNo, 9);
    assert.equal(next.deletedIds?.["guest:s1"], true);
    assert.equal(next.deletedIds?.["guest:o1"], undefined);
    assert.equal(next.opening?.cash, 25000);
  });
});
