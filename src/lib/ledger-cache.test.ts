import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { clearLocalLedgerCache, isLedgerCacheKey } from "./ledger-cache.ts";

function memoryStorage() {
  const store: Record<string, string> = {};
  const api: Storage = {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      for (const key of Object.keys(store)) delete store[key];
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
  };
  return { store, api };
}

describe("login ledger cache", () => {
  const had = Object.prototype.hasOwnProperty.call(globalThis, "localStorage");
  const previous = had ? globalThis.localStorage : undefined;
  let mem = memoryStorage();

  beforeEach(() => {
    mem = memoryStorage();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: mem.api,
    });
  });

  afterEach(() => {
    if (had) {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: previous,
      });
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  it("recognises ledger and lock keys only", () => {
    assert.equal(isLedgerCacheKey("status-ledger-v6:abc"), true);
    assert.equal(isLedgerCacheKey("status-ledger-v5"), true);
    assert.equal(isLedgerCacheKey("status-register-locks:anon"), true);
    assert.equal(isLedgerCacheKey("theme"), false);
  });

  it("wipes old books and lock copies, keeps unrelated keys", () => {
    mem.api.setItem("status-ledger-v6:hotel", '{"state":{"guests":[1]}}');
    mem.api.setItem("status-ledger-v5", '{"state":{"guests":[2]}}');
    mem.api.setItem("status-register-locks:hotel", '{"2026-09-12":true}');
    mem.api.setItem("status-ledger-v5:migrated", "hotel");
    mem.api.setItem("other-app", "keep");
    const n = clearLocalLedgerCache();
    assert.equal(n, 4);
    assert.equal(mem.api.getItem("status-ledger-v6:hotel"), null);
    assert.equal(mem.api.getItem("status-register-locks:hotel"), null);
    assert.equal(mem.api.getItem("other-app"), "keep");
  });
});
