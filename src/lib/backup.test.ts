import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BACKUP_KIND,
  backupCounts,
  backupFilename,
  buildBackupFile,
  parseBackupFile,
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
});
