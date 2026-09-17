import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseStatementText,
  reconcileBank,
  type BankRow,
} from "./bank-recon.ts";
import type { GuestEntry } from "./types.ts";

describe("bank recon", () => {
  it("reads a monthly csv and matches office payment reference", () => {
    const csv = [
      "Date,Narration,Amount,Reference",
      "17/09/2026,UPI/HDFC Hotel,1500,UPI1234567890",
      "18/09/2026,NEFT salary,0,SKIP",
      "18/09/2026,IMPS Flysky,2200,IMPS998877",
    ].join("\n");
    const bank = parseStatementText(csv);
    assert.equal(bank.length, 2);
    assert.equal(bank[0]?.date, "2026-09-17");
    assert.equal(bank[0]?.ref, "UPI1234567890");
    const guests: GuestEntry[] = [
      {
        id: "g1",
        date: "2026-09-16",
        slNo: 1,
        name: "RAMESH",
        roomNo: "101",
        mode: "ONLINE",
        amount: 1500,
        payRefNo: "upi-1234567890",
        gst: true,
      },
      {
        id: "g2",
        date: "2026-09-18",
        slNo: 2,
        name: "SITA",
        roomNo: "102",
        mode: "QRS",
        amount: 2200,
        payRefNo: "IMPS998877",
        gst: true,
      },
    ];
    const lines = reconcileBank(bank as BankRow[], guests);
    assert.equal(lines[0]?.office?.name, "RAMESH");
    assert.equal(lines[0]?.office?.date, "2026-09-16");
    assert.equal(lines[1]?.office?.name, "SITA");
  });

  it("leaves unmatched bank rows empty on the office side", () => {
    const bank = parseStatementText(
      "Date,Particulars,Credit,Ref\n17-09-2026,Unknown credit,900,XYZ99999999",
    );
    const lines = reconcileBank(bank, []);
    assert.equal(lines.length, 1);
    assert.equal(lines[0]?.office, null);
  });
});
