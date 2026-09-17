import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractRef,
  parseStatementText,
  reconcileBank,
} from "./bank-recon.ts";
import type { GuestEntry } from "./types.ts";

describe("bank recon", () => {
  it("keeps date, narration, ref and amounts, drops address and closing", () => {
    const csv = [
      "Hotel Status Residency, 12 MG Road, Mumbai",
      "Account No 123456789, IFSC SBIN000111",
      "Date,Narration,Ch./Ref. no.,Debit,Credit,Balance",
      "17/09/2026,TO TRANSFER UPI/DR/412345678901/RAMESH,412345678901,0,1800,20000",
      "18/09/2026,UPI hotel,,0,1500,21500",
      "30/09/2026,Closing Balance,,,,21500",
    ].join("\n");
    const bank = parseStatementText(csv, "2026-09");
    assert.equal(bank.length, 2);
    assert.deepEqual(bank[0]?.headers, [
      "Date",
      "Narration",
      "Ch./Ref. no.",
      "Withdrawal",
      "Deposit",
    ]);
    assert.equal(bank[0]?.dateRaw, "17/09/2026");
    assert.equal(bank[0]?.particular, "TO TRANSFER UPI/DR/412345678901/RAMESH");
    assert.equal(bank[0]?.ref, "412345678901");
    assert.equal(bank[0]?.credit, 1800);
    assert.equal(bank[0]?.cells.includes("20000"), false);
    assert.equal(bank.some((r) => /closing/i.test(r.particular)), false);
    assert.equal(bank.some((r) => /address|ifsc|account no/i.test(r.particular)), false);
  });

  it("matches office payment reference on the printed ref cell", () => {
    const bank = parseStatementText(
      "Date,Particulars,Credit,Ref\n17-09-2026,IMPS Flysky,2200,IMPS998877",
      "2026-09",
    );
    const guests: GuestEntry[] = [
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
    const lines = reconcileBank(bank, guests);
    assert.equal(lines[0]?.office?.name, "SITA");
    assert.equal(lines[0]?.bank.ref, "IMPS998877");
  });

  it("reads Withdrawal Amount and Deposit Amount headers", () => {
    const csv = [
      "Tran Date,Transaction Remarks,Chq/Ref No.,Withdrawal Amount,Deposit Amount,Balance",
      "17/09/2026,UPI-RAMESH,412345678901,0,1800,20000",
    ].join("\n");
    const bank = parseStatementText(csv, "2026-09");
    assert.equal(bank.length, 1);
    assert.equal(bank[0]?.particular, "UPI-RAMESH");
    assert.equal(bank[0]?.ref, "412345678901");
    assert.equal(bank[0]?.credit, 1800);
    assert.equal(bank[0]?.cells.includes("20000"), false);
  });

  it("pulls UPI/IMPS numbers out of narration", () => {
    assert.equal(extractRef("TO TRANSFER UPI/DR/412345678901/RAMESH/SBIN"), "412345678901");
  });
});
