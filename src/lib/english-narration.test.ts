import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { englishNarration } from "./english-narration.ts";

describe("english narration", () => {
  it("turns a UPI credit line into a full English sentence", () => {
    assert.equal(
      englishNarration("UPI/CR/412345678901/RAMESH KUMAR/PAYTM"),
      "UPI payment received from RAMESH KUMAR through Paytm. Reference 412345678901.",
    );
  });

  it("turns a Hindi expense into English", () => {
    assert.equal(englishNarration("बिजली बिल"), "Electricity bill");
    assert.equal(englishNarration("BIJLI BILL"), "Electricity bill");
  });

  it("leaves an English source name as it was", () => {
    assert.equal(englishNarration("CAESAR"), "CAESAR");
    assert.equal(englishNarration("room rent"), "room rent");
  });

  it("describes a cheque and an ATM line", () => {
    assert.match(englishNarration("BY CLG/000456789"), /Cheque/);
    assert.match(englishNarration("ATM WDL/123456"), /Cash withdrawn from ATM/);
  });
});
