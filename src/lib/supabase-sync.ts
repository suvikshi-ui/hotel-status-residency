import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  anonymousLedgerUnclaimed,
  claimAnonymousLedger,
  ledgerActivityScore,
  pullLedger,
  pushLedger,
  readLocalLedger,
  type LedgerSnapshot,
} from "./supabase-db";
import { LEDGER_STORAGE_KEY, useLedger } from "./store";
import { isSupabaseConfigured } from "./supabase-config";

export type CloudPhase =
  | "off"
  | "loading"
  | "synced"
  | "saving"
  | "migrated"
  | "local"
  | "missing-schema"
  | "error";

type CloudState = { phase: CloudPhase; message?: string };

let phase: CloudPhase = "off";
let message: string | undefined;
const listeners = new Set<(s: CloudState) => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setInterval> | null = null;
let hydrating = false;
let lastHash = "";
let lastUserId: string | null = null;
let warnedMissing = false;
let hideFlush: (() => void) | null = null;
let hideVis: (() => void) | null = null;
let inFlight: Promise<void> | null = null;
let queued = false;

function emit() {
  const snap = { phase, message };
  listeners.forEach((fn) => fn(snap));
}

function setPhase(next: CloudPhase, nextMessage?: string) {
  phase = next;
  message = nextMessage;
  emit();
}

export function getCloudState(): CloudState {
  return { phase, message };
}

export function subscribeCloud(fn: (s: CloudState) => void) {
  listeners.add(fn);
  fn(getCloudState());
  return () => {
    listeners.delete(fn);
  };
}

function snapshotFromStore(): LedgerSnapshot {
  const s = useLedger.getState();
  return {
    hotel: s.hotel,
    opening: s.opening,
    rooms: s.rooms,
    guests: s.guests,
    food: s.food,
    wholesale: s.wholesale,
    expenses: s.expenses,
    balReceived: s.balReceived,
    staff: s.staff,
    advances: s.advances,
    ota: s.ota,
    janSales: s.janSales,
    janFood: s.janFood,
    creditGuests: s.creditGuests,
    selectedDate: s.selectedDate,
    openingDate: s.openingDate,
    securityCode: s.securityCode,
  };
}

function hashOf(s: LedgerSnapshot) {
  return JSON.stringify(s);
}

function disarmRetry() {
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
}

function armRetry(userId: string) {
  if (retryTimer) return;
  retryTimer = setInterval(() => {
    lastHash = "";
    void flush(userId);
  }, 8000);
}

async function doFlush(userId: string) {
  const snap = snapshotFromStore();
  const hash = hashOf(snap);
  if (hash === lastHash && (phase === "synced" || phase === "migrated")) return;
  setPhase("saving");
  const result = await pushLedger(userId, snap);
  if (!result.ok) {
    if (result.missingSchema) {
      setPhase("missing-schema", result.message);
      if (!warnedMissing) {
        warnedMissing = true;
        toast.error("Could not save to your account yet. Entries stay on this phone until cloud tables exist.");
      }
      armRetry(userId);
      return;
    }
    setPhase("error", result.message);
    armRetry(userId);
    return;
  }
  disarmRetry();
  lastHash = hashOf(snapshotFromStore());
  setPhase("synced");
}

async function flush(userId: string) {
  if (hydrating || !lastUserId || lastUserId !== userId) return;
  if (inFlight) {
    queued = true;
    return inFlight;
  }
  inFlight = doFlush(userId)
    .catch((err) => {
      setPhase("error", err instanceof Error ? err.message : "Save failed");
      armRetry(userId);
    })
    .finally(() => {
      inFlight = null;
      if (queued && lastUserId === userId) {
        queued = false;
        void flush(userId);
      }
    });
  return inFlight;
}

/** Call from every ledger mutation. Coalesces in-flight writes. */
export function requestCloudSave() {
  const userId = lastUserId;
  if (!userId || hydrating) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flush(userId);
  }, 0);
}

export function stopCloudSync() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  disarmRetry();
  lastUserId = null;
  lastHash = "";
  hydrating = false;
  queued = false;
  if (typeof window !== "undefined" && hideFlush) {
    window.removeEventListener("pagehide", hideFlush);
    hideFlush = null;
  }
  if (typeof document !== "undefined" && hideVis) {
    document.removeEventListener("visibilitychange", hideVis);
    hideVis = null;
  }
  if (phase !== "off") setPhase("off");
}

export function startCloudSync(userId: string) {
  lastUserId = userId;
  if (typeof window !== "undefined") {
    if (hideFlush) window.removeEventListener("pagehide", hideFlush);
    if (hideVis) document.removeEventListener("visibilitychange", hideVis);
    hideFlush = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      void flush(userId);
    };
    hideVis = () => {
      if (document.visibilityState === "hidden") hideFlush?.();
      if (document.visibilityState === "visible") requestCloudSave();
    };
    window.addEventListener("pagehide", hideFlush);
    document.addEventListener("visibilitychange", hideVis);
  }
  requestCloudSave();
}

export async function hydrateFromCloud(userId: string): Promise<CloudPhase> {
  if (!isSupabaseConfigured()) {
    setPhase("off");
    return "off";
  }
  hydrating = true;
  setPhase("loading");
  try {
    const pulled = await pullLedger(userId);
    if (!pulled.ok) {
      if (pulled.missingSchema) {
        setPhase("missing-schema", pulled.message);
        if (!warnedMissing) {
          warnedMissing = true;
          toast.error("Cloud tables are missing. Books stay on this device.");
        }
        return "missing-schema";
      }
      setPhase("error", pulled.message);
      toast.error(pulled.message || "Could not load cloud books.");
      return "error";
    }

    const current = snapshotFromStore();
    const localRicher = (): LedgerSnapshot => {
      let local = current;
      if (anonymousLedgerUnclaimed()) {
        const anon = readLocalLedger(LEDGER_STORAGE_KEY, current);
        if (anon && ledgerActivityScore(anon) > ledgerActivityScore(local)) {
          local = anon;
        }
      }
      return local;
    };

    if (pulled.kind === "data") {
      const cloud = pulled.snapshot;
      const local = localRicher();
      if (ledgerActivityScore(local) > ledgerActivityScore(cloud)) {
        useLedger.getState().applySnapshot(local);
        const pushed = await pushLedger(userId, local, "localStorage");
        if (!pushed.ok) {
          if (pushed.missingSchema) {
            setPhase("missing-schema", pushed.message);
            if (!warnedMissing) {
              warnedMissing = true;
              toast.error("Cloud tables are missing. Books stay on this device.");
            }
            return "missing-schema";
          }
          setPhase("error", pushed.message);
          return "error";
        }
        claimAnonymousLedger(userId);
        lastHash = hashOf(snapshotFromStore());
        setPhase("migrated");
        toast.success("This device's books were copied to your account.");
        return "migrated";
      }
      if (!cloud.rooms.length) cloud.rooms = current.rooms;
      if (!cloud.staff.length) cloud.staff = current.staff;
      if (!cloud.hotel?.name) cloud.hotel = current.hotel;
      useLedger.getState().applySnapshot(cloud);
      lastHash = hashOf(snapshotFromStore());
      claimAnonymousLedger(userId);
      setPhase("synced");
      return "synced";
    }

    const source = localRicher();
    const migratedFrom = "localStorage";

    useLedger.getState().applySnapshot(source);
    const pushed = await pushLedger(userId, source, migratedFrom);
    if (!pushed.ok) {
      if (pushed.missingSchema) {
        setPhase("missing-schema", pushed.message);
        if (!warnedMissing) {
          warnedMissing = true;
          toast.error("Cloud tables are missing. Books stay on this device.");
        }
        return "missing-schema";
      }
      setPhase("error", pushed.message);
      return "error";
    }
    claimAnonymousLedger(userId);
    lastHash = hashOf(snapshotFromStore());
    setPhase("migrated");
    toast.success("This device's books were copied to your account.");
    return "migrated";
  } catch (err) {
    const text = err instanceof Error ? err.message : "Could not reach cloud books.";
    setPhase("error", text);
    return "error";
  } finally {
    hydrating = false;
  }
}

export function useCloudSync() {
  const [state, setState] = useState<CloudState>(getCloudState);
  useEffect(() => subscribeCloud(setState), []);
  return state;
}

export async function retryCloudHydrate(userId: string) {
  warnedMissing = false;
  lastHash = "";
  const phaseNow = await hydrateFromCloud(userId);
  startCloudSync(userId);
  return phaseNow;
}
