import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractRef, parseStatementText, reconcileBank } from "./bank-recon.ts";
import type { GuestEntry } from "./types.ts";

describe("bank recon", () => {
  it("keeps debit and credit, skips closing balance", () => {
    const csv = [
      "Date,Narration,Debit,Credit,Balance,Reference",
      "17/09/2026,UPI/HDFC Hotel,0,1500,45000,UPI1234567890",
      "17/09/2026,Closing Balance,,,45000,",
      "18/09/2026,NEFT rent,800,0,44200,NEFT44556677",
    ].join("\n");
    const bank = parseStatementText(csv);
    assert.equal(bank.length, 2);
    assert.equal(bank[0]?.credit, 1500);
    assert.equal(bank[0]?.debit, 0);
    assert.equal(bank[1]?.debit, 800);
    assert.equal(bank[1]?.credit, 0);
    assert.equal(bank.some((r) => /closing/i.test(r.particular)), false);
  });

  it("does not upload opening or closing balance rows", () => {
    const csv = [
      "Date,Narration,Ch./Ref. no.,Debit,Credit,Closing Balance",
      "01/09/2026,Opening Balance,,, ,12000",
      "02/09/2026,UPI hotel,UPI1111222233,0,1500,13500",
      "30/09/2026,Closing Balance,,,,13500",
    ].join("\n");
    const bank = parseStatementText(csv);
    assert.equal(bank.length, 1);
    assert.equal(bank[0]?.particular, "UPI hotel");
    assert.equal(bank[0]?.ref, "UPI1111222233");
    assert.equal(bank[0]?.credit, 1500);
  });

  it("does not crash when a row is missing the ref cell", () => {
    const csv = [
      "Date,Narration,Ch./Ref. no.,Debit,Credit",
      "17/09/2026,UPI hotel",
      "18/09/2026,IMPS guest,IMPS99887766,0,2200",
    ].join("\n");
    const bank = parseStatementText(csv);
    assert.equal(bank.length, 1);
    assert.equal(bank[0]?.ref, "IMPS99887766");
  });

  it("reads Ch./Ref. no. when the header is below the title", () => {
    const csv = [
      "Account Statement September 2026",
      "Hotel Status Residency",
      "Date,Narration,Ch./Ref. no.,Withdrawal,Deposit,Balance",
      "17/09/2026,TO TRANSFER UPI/DR/412345678901/RAMESH,412345678901,0,1800,20000",
    ].join("\n");
    const bank = parseStatementText(csv);
    assert.equal(bank.length, 1);
    assert.equal(bank[0]?.ref, "412345678901");
  });

  it("pulls UPI/IMPS numbers out of narration", () => {
    assert.equal(extractRef("TO TRANSFER UPI/DR/412345678901/RAMESH/SBIN"), "412345678901");
    assert.equal(extractRef("UPI-998877665544-FLYSKY"), "998877665544");
    assert.equal(extractRef("IMPS/P2A/IMPS99887766/SITA"), "IMPS99887766");
  });

  it("matches office payment reference on the credit", () => {
    const bank = parseStatementText(
      "Date,Particulars,Credit,Ref\n17-09-2026,IMPS Flysky,2200,IMPS998877",
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
    assert.equal(lines[0]?.bank.credit, 2200);
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
