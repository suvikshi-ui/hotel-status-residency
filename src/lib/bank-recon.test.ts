import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bankRowsFromPdfItems,
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
    assert.equal(lines[0]?.office?.date, "2026-09-18");
    assert.equal(lines[0]?.office?.reason, "room rent");
    assert.equal(lines[0]?.bank.ref, "IMPS998877");
  });

  it("does not fill office from GST invoice number, only payment reference", () => {
    const bank = parseStatementText(
      "Date,Particulars,Credit,Ref\n17-09-2026,IMPS Flysky,2200,IMPS998877",
      "2026-09",
    );
    const guests: GuestEntry[] = [
      {
        id: "g3",
        date: "2026-09-18",
        slNo: 3,
        name: "RAM",
        roomNo: "101",
        mode: "QRS",
        amount: 2200,
        gstInvoiceNo: "IMPS998877",
        source: "Walk-in",
        gst: true,
      },
    ];
    const lines = reconcileBank(bank, guests);
    assert.equal(lines[0]?.office, null);
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

  it("keeps the full journal list including continuation lines", () => {
    const text = [
      "Tran Date,Transaction Remarks,Chq/Ref No.,Withdrawal Amount,Deposit Amount,Balance",
      "17/09/2026,UPI-RAMESH,412345678901,0.00,1800.00,20000",
      "18/09/2026,NEFT FLYSKY,NEFT998877,500.00,0.00,19500",
      "   HOTEL PAYMENT",
      "30/09/2026,Closing Balance,,,,21500",
    ].join("\n");
    const bank = parseStatementText(text, "2026-09");
    assert.equal(bank.length, 2);
    assert.equal(bank[0]?.particular, "UPI-RAMESH");
    assert.match(bank[1]?.particular ?? "", /NEFT FLYSKY/);
    assert.match(bank[1]?.particular ?? "", /HOTEL PAYMENT/);
    assert.equal(bank[1]?.debit, 500);
  });

  it("does not put closing/running balance into deposit", () => {
    const loose = parseStatementText(
      "17/09/2026 UPI-RAMESH 1,800.00 20,000.00\n18/09/2026 ATM WDL 500.00 19,500.00",
      "2026-09",
    );
    assert.equal(loose[0]?.credit, 1800);
    assert.equal(loose[0]?.debit, 0);
    assert.equal(loose[1]?.debit, 500);
    assert.equal(loose[1]?.credit, 0);
    assert.equal(loose.every((r) => r.credit !== 20000 && r.debit !== 20000), true);

    const grid = parseStatementText(
      [
        "Date,Narration,Ch./Ref. no.,Withdrawal,Deposit,Balance",
        "17/09/2026,UPI hotel,4123,0,1800,20000",
        "30/09/2026,Closing Balance,,,,21500",
      ].join("\n"),
      "2026-09",
    );
    assert.equal(grid.length, 1);
    assert.equal(grid[0]?.credit, 1800);
    assert.equal(grid[0]?.debit, 0);
  });

  it("reads an HDFC PDF column layout and drops closing balance", () => {
    const rows = bankRowsFromPdfItems([
      { page: 1, x: 40, y: 600, str: "Date" },
      { page: 1, x: 144, y: 600, str: "Narration" },
      { page: 1, x: 284, y: 600, str: "Chq./Ref.No." },
      { page: 1, x: 405, y: 600, str: "Withdrawal Amt." },
      { page: 1, x: 491, y: 600, str: "Deposit Amt." },
      { page: 1, x: 564, y: 600, str: "Closing Balance" },
      { page: 1, x: 34, y: 580, str: "01/09/26" },
      { page: 1, x: 72, y: 580, str: "NEFT DR-IBKL0000183-VIJAYKUMAR" },
      { page: 1, x: 281, y: 580, str: "HDFCH01230643481" },
      { page: 1, x: 362, y: 580, str: "01/09/26" },
      { page: 1, x: 438, y: 580, str: "35,000.00" },
      { page: 1, x: 591, y: 580, str: "255,667.53" },
      { page: 1, x: 68, y: 560, str: "RAMAKRISH" },
      { page: 2, x: 72, y: 700, str: "NA YERMAL-NETBANK" },
      { page: 2, x: 34, y: 680, str: "11/09/26" },
      { page: 2, x: 72, y: 680, str: "UPI-RAVI-HOTEL" },
      { page: 2, x: 289, y: 680, str: "0000129437828912" },
      { page: 2, x: 520, y: 680, str: "1,794.00" },
      { page: 2, x: 595, y: 680, str: "41,569.71" },
      { page: 2, x: 68, y: 400, str: "STATEMENT SUMMARY :-" },
    ]);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.date, "2026-09-01");
    assert.equal(rows[0]?.ref, "HDFCH01230643481");
    assert.equal(rows[0]?.debit, 35000);
    assert.equal(rows[0]?.credit, 0);
    assert.match(rows[0]?.particular ?? "", /VIJAYKUMAR/);
    assert.match(rows[0]?.particular ?? "", /RAMAKRISH/);
    assert.match(rows[0]?.particular ?? "", /YERMAL/);
    assert.equal(rows[0]?.cells.includes("255,667.53"), false);
    assert.equal(rows[1]?.credit, 1794);
    assert.equal(rows[1]?.debit, 0);
    assert.equal(rows[1]?.ref, "0000129437828912");
    assert.equal(rows.some((row) => /summary|closing/i.test(row.particular)), false);
  });

  it("fills office date, guest name and reason when the daily ref matches", () => {
    const bank = parseStatementText(
      [
        "Date,Narration,Ch./Ref. no.,Withdrawal,Deposit",
        "26/09/2026,UPI NITYA,0000626947241710,0,2280",
        "25/09/2026,SBIEPY,0002677926800114,66560,0",
        "15/09/2026,FOOD,0000291479694407,0,5112",
      ].join("\n"),
      "2026-09",
    );
    const lines = reconcileBank(
      bank,
      [
        {
          id: "g1",
          date: "2026-09-26",
          slNo: 1,
          name: "NITYA",
          roomNo: "105",
          mode: "QRPK",
          amount: 2280,
          payRefNo: "626947241710",
        },
      ],
      {
        food: [
          {
            id: "f1",
            date: "2026-09-15",
            mode: "QRPK",
            amount: 5112,
            payRef: "291479694407",
          },
        ],
        expenses: [
          {
            id: "e1",
            date: "2026-09-25",
            mode: "QRPK",
            amount: 66560,
            particular: "electricity bill payment",
            payRef: "2677926800114",
          },
        ],
      },
    );
    assert.equal(lines[0]?.office?.date, "2026-09-26");
    assert.equal(lines[0]?.office?.name, "NITYA");
    assert.equal(lines[0]?.office?.reason, "room rent");
    assert.equal(lines[1]?.office?.name, "");
    assert.equal(lines[1]?.office?.reason, "electricity bill payment");
    assert.equal(lines[1]?.office?.date, "2026-09-25");
    assert.equal(lines[2]?.office?.reason, "food bill");
    assert.equal(lines[2]?.office?.date, "2026-09-15");
  });

  it("keeps every place for one reference, but not the same place twice", () => {
    const bank = parseStatementText(
      "Date,Narration,Ch./Ref. no.,Withdrawal,Deposit\n26/09/2026,UPI,REF9988776655,0,5000",
      "2026-09",
    );
    const lines = reconcileBank(
      bank,
      [
        {
          id: "g1",
          date: "2026-09-26",
          slNo: 1,
          name: "NITYA",
          roomNo: "105",
          mode: "QRPK",
          amount: 2000,
          payRefNo: "REF9988776655",
        },
        {
          id: "g2",
          date: "2026-09-26",
          slNo: 2,
          name: "AMIT",
          roomNo: "106",
          mode: "QRPK",
          amount: 1500,
          payRefNo: "REF9988776655",
        },
      ],
      {
        food: [
          {
            id: "f1",
            date: "2026-09-26",
            mode: "QRPK",
            amount: 400,
            payRef: "REF9988776655",
          },
        ],
        wholesale: [
          {
            id: "w1",
            date: "2026-09-26",
            mode: "QRPK",
            amount: 300,
            payRef: "REF9988776655",
          },
        ],
        expenses: [
          {
            id: "e1",
            date: "2026-09-26",
            mode: "QRPK",
            amount: 800,
            particular: "electricity bill payment",
            payRef: "REF9988776655",
          },
        ],
      },
    );
    assert.equal(lines.length, 1);
    assert.equal(lines[0]?.office?.name, "NITYA");
    assert.equal(
      lines[0]?.office?.reason,
      "room rent, food bill, WS, electricity bill payment",
    );
  });

  it("pulls UPI/IMPS numbers out of narration", () => {
    assert.equal(extractRef("TO TRANSFER UPI/DR/412345678901/RAMESH/SBIN"), "412345678901");
  });
});
