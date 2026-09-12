import { useEffect, useState } from "react";
import { toast } from "sonner";
import { mergeLiveSnapshot } from "./live-merge";
import { clearLocalLedgerCache } from "./ledger-cache";
import { pullLockState } from "./pull-locks";
import {
  claimAnonymousLedger,
  pullLedger,
  pullLedgerStamp,
  pruneFromBase,
  pushLedger,
  upsertLedgerFromBackup,
  type LedgerSnapshot,
} from "./supabase-db";
import { ledgerOwnerKey, useLedger } from "./store";
import { isSupabaseConfigured } from "./supabase-config";
import {
  isDayLocked,
  locksEqual,
  mergeLockState,
  parseLockRev,
  parseLockedDates,
  writeStoredLocks,
} from "./register-lock";

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
let locksDirty = false;
let lockTimer: ReturnType<typeof setInterval> | null = null;
let lastPulled: LedgerSnapshot | null = null;
let lastCloudStamp = "";

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
    lockedDates: s.lockedDates ?? {},
    lockRev: s.lockRev ?? {},
    sealedIds: s.sealedIds ?? {},
    inventory: s.inventory,
    complaints: s.complaints,
    savedAt: s.savedAt,
  };
}

function hashOf(s: LedgerSnapshot) {
  const { selectedDate: _d, savedAt: _t, cloudUpdatedAt: _c, ...rest } = s;
  return JSON.stringify(rest);
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

function rememberPulled(snap: LedgerSnapshot, stamp?: string) {
  lastPulled = snap;
  if (stamp) lastCloudStamp = stamp;
  else if (snap.cloudUpdatedAt) lastCloudStamp = snap.cloudUpdatedAt;
}

function applyMerged(merged: LedgerSnapshot, previous: LedgerSnapshot) {
  const selected = useLedger.getState().selectedDate;
  const wasLocked = isDayLocked(previous.lockedDates, selected);
  const nowLocked = isDayLocked(merged.lockedDates, selected);
  useLedger.getState().adoptLiveSnapshot({
    hotel: merged.hotel,
    opening: merged.opening,
    rooms: merged.rooms,
    guests: merged.guests,
    food: merged.food,
    wholesale: merged.wholesale,
    expenses: merged.expenses,
    balReceived: merged.balReceived,
    staff: merged.staff,
    advances: merged.advances,
    ota: merged.ota,
    janSales: merged.janSales,
    janFood: merged.janFood,
    creditGuests: merged.creditGuests,
    openingDate: merged.openingDate,
    securityCode: merged.securityCode,
    lockedDates: merged.lockedDates ?? {},
    lockRev: merged.lockRev ?? {},
    sealedIds: merged.sealedIds ?? {},
    inventory: merged.inventory,
    complaints: merged.complaints,
    savedAt: merged.savedAt,
  });
  writeStoredLocks(ledgerOwnerKey(), merged.lockedDates ?? {});
  if (!wasLocked && nowLocked) {
    toast.message(`Register locked for ${selected} on the other desk.`);
  } else if (wasLocked && !nowLocked) {
    toast.message(`Register unlocked for ${selected} on the other desk.`);
  }
}

function applyRemoteLocks(next: {
  locked: Record<string, true>;
  rev: Record<string, number>;
}) {
  const selected = useLedger.getState().selectedDate;
  const previous = useLedger.getState().lockedDates ?? {};
  const wasLocked = isDayLocked(previous, selected);
  const nowLocked = isDayLocked(next.locked, selected);
  useLedger.setState({ lockedDates: next.locked, lockRev: next.rev });
  writeStoredLocks(ledgerOwnerKey(), next.locked);
  if (lastPulled) {
    lastPulled = { ...lastPulled, lockedDates: next.locked, lockRev: next.rev };
  }
  if (!wasLocked && nowLocked) {
    toast.message(`Register locked for ${selected} on the other desk.`);
  } else if (wasLocked && !nowLocked) {
    toast.message(`Register unlocked for ${selected} on the other desk.`);
  }
}

async function syncLocksFromHotel(userId: string) {
  if (locksDirty || hydrating || lastUserId !== userId) return;
  try {
    const remote = await pullLockState(userId);
    if (remote == null || locksDirty) return;
    const current = useLedger.getState().lockedDates ?? {};
    const currentRev = useLedger.getState().lockRev ?? {};
    const merged = mergeLockState({ locked: current, rev: currentRev }, remote);
    if (
      locksEqual(current, merged.locked) &&
      JSON.stringify(currentRev) === JSON.stringify(merged.rev)
    ) {
      return;
    }
    applyRemoteLocks(merged);
  } catch {
    /* keep local lock if hotel json cannot be read */
  }
}

async function doFlush(userId: string) {
  const local = snapshotFromStore();
  const localChanged = hashOf(local) !== lastHash || locksDirty;
  if (!localChanged && (phase === "synced" || phase === "migrated")) return;

  setPhase("saving");
  const pulled = await pullLedger(userId);
  if (!pulled.ok) {
    if (pulled.missingSchema) {
      setPhase("missing-schema", pulled.message);
      if (!warnedMissing) {
        warnedMissing = true;
        toast.error(
          "Could not save to your account yet. Entries stay on this phone until cloud tables exist.",
        );
      }
      armRetry(userId);
      return;
    }
    setPhase("error", pulled.message);
    armRetry(userId);
    return;
  }

  let toPush = local;
  const base = lastPulled;
  if (pulled.kind === "data") {
    const merged = mergeLiveSnapshot(base, snapshotFromStore(), pulled.snapshot);
    if (hashOf(merged) !== hashOf(local)) applyMerged(merged, local);
    toPush = merged;
  }

  const result = await pushLedger(
    userId,
    toPush,
    undefined,
    useLedger.getState().appRole,
    pruneFromBase(base, toPush),
  );
  if (!result.ok) {
    if (result.missingSchema) {
      setPhase("missing-schema", result.message);
      if (!warnedMissing) {
        warnedMissing = true;
        toast.error(
          "Could not save to your account yet. Entries stay on this phone until cloud tables exist.",
        );
      }
      armRetry(userId);
      return;
    }
    setPhase("error", result.message);
    armRetry(userId);
    return;
  }
  disarmRetry();
  rememberPulled(snapshotFromStore(), new Date().toISOString());
  lastHash = hashOf(snapshotFromStore());
  setPhase("synced");
  locksDirty = false;
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

export function markLocksDirty() {
  locksDirty = true;
}

export function requestCloudSaveNow() {
  const userId = lastUserId;
  if (!userId || hydrating) return;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  void flush(userId);
}

export function requestCloudPullNow() {
  const userId = lastUserId;
  if (!userId || hydrating) return;
  lastCloudStamp = "";
  void syncLocksFromHotel(userId);
  void pollCloud(userId);
}

async function pollCloud(userId: string) {
  if (hydrating || lastUserId !== userId || inFlight) return;
  try {
    if (locksDirty) {
      void flush(userId);
      return;
    }
    await syncLocksFromHotel(userId);
    const stamp = await pullLedgerStamp(userId);
    if (stamp && stamp === lastCloudStamp) return;
    const pulled = await pullLedger(userId);
    if (!pulled.ok || pulled.kind !== "data") return;
    if (locksDirty || hydrating || lastUserId !== userId) return;
    const local = snapshotFromStore();
    const localChanged = hashOf(local) !== lastHash;
    const merged = mergeLiveSnapshot(lastPulled, local, pulled.snapshot);
    if (hashOf(merged) !== hashOf(local)) applyMerged(merged, local);
    rememberPulled(merged, pulled.snapshot.cloudUpdatedAt);
    lastHash = hashOf(snapshotFromStore());
    if (localChanged || locksDirty) void flush(userId);
    else if (phase === "loading" || phase === "error") setPhase("synced");
  } catch {
    /* keep local books if the pull fails */
  }
}

export function requestCloudSave() {
  const userId = lastUserId;
  if (!userId || hydrating) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flush(userId);
  }, 300);
}

export function stopCloudSync() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (lockTimer) {
    clearInterval(lockTimer);
    lockTimer = null;
  }
  disarmRetry();
  lastUserId = null;
  lastHash = "";
  lastPulled = null;
  lastCloudStamp = "";
  hydrating = false;
  queued = false;
  locksDirty = false;
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
      if (document.visibilityState === "visible") {
        void syncLocksFromHotel(userId);
        void pollCloud(userId);
      }
    };
    window.addEventListener("pagehide", hideFlush);
    document.addEventListener("visibilitychange", hideVis);
  }
  if (lockTimer) clearInterval(lockTimer);
  lockTimer = setInterval(() => {
    void syncLocksFromHotel(userId);
    void pollCloud(userId);
  }, 2000);
  void syncLocksFromHotel(userId);
  void pollCloud(userId);
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
      try {
        await useLedger.persist.rehydrate();
      } catch {
        /* keep whatever is in memory */
      }
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

    clearLocalLedgerCache();

    if (pulled.kind === "data") {
      const cloud = pulled.snapshot;
      useLedger.getState().applyCloudBooks({
        ...cloud,
        lockedDates: parseLockedDates(cloud.lockedDates),
        lockRev: parseLockRev(cloud.lockRev),
        savedAt: cloud.savedAt ?? Date.now(),
      });
      writeStoredLocks(ledgerOwnerKey(), parseLockedDates(cloud.lockedDates));
      claimAnonymousLedger(userId);
      rememberPulled(snapshotFromStore(), cloud.cloudUpdatedAt);
      lastHash = hashOf(snapshotFromStore());
      setPhase("synced");
      return "synced";
    }

    const role = useLedger.getState().appRole;
    useLedger.getState().restoreSeed();
    useLedger.getState().setAppRole(role);
    rememberPulled(snapshotFromStore(), "");
    lastHash = hashOf(snapshotFromStore());
    setPhase("synced");
    return "synced";
  } catch (err) {
    try {
      await useLedger.persist.rehydrate();
    } catch {
      /* keep whatever is in memory */
    }
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
  lastPulled = null;
  lastCloudStamp = "";
  const phaseNow = await hydrateFromCloud(userId);
  startCloudSync(userId);
  return phaseNow;
}

export async function importBackupAndRefresh(
  userId: string,
  snap: LedgerSnapshot,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Sign in to import into the hotel account." };
  }
  hydrating = true;
  setPhase("saving");
  try {
    const role = useLedger.getState().appRole;
    const pushed = await upsertLedgerFromBackup(userId, snap, role);
    if (!pushed.ok) {
      setPhase(pushed.missingSchema ? "missing-schema" : "error", pushed.message);
      return { ok: false, message: pushed.message };
    }
    lastCloudStamp = "";
    lastPulled = null;
    const pulled = await pullLedger(userId);
    if (pulled.ok && pulled.kind === "data") {
      clearLocalLedgerCache();
      const cloud = pulled.snapshot;
      useLedger.getState().applyCloudBooks({
        ...cloud,
        lockedDates: parseLockedDates(cloud.lockedDates),
        lockRev: parseLockRev(cloud.lockRev),
        savedAt: cloud.savedAt ?? Date.now(),
      });
      writeStoredLocks(ledgerOwnerKey(), parseLockedDates(cloud.lockedDates));
      claimAnonymousLedger(userId);
      rememberPulled(snapshotFromStore(), cloud.cloudUpdatedAt);
    } else {
      useLedger.getState().applyCloudBooks({
        ...snap,
        lockedDates: parseLockedDates(snap.lockedDates),
        lockRev: parseLockRev(snap.lockRev),
        savedAt: Date.now(),
      });
      writeStoredLocks(ledgerOwnerKey(), parseLockedDates(snap.lockedDates));
      rememberPulled(snapshotFromStore(), new Date().toISOString());
    }
    lastHash = hashOf(snapshotFromStore());
    setPhase("synced");
    return { ok: true };
  } catch (err) {
    const text = err instanceof Error ? err.message : "Could not import backup.";
    setPhase("error", text);
    return { ok: false, message: text };
  } finally {
    hydrating = false;
  }
}
