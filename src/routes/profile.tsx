import { useMemo, useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddUserCard } from "@/components/add-user-form";
import { useGate } from "@/components/security-gate";
import { canAddUsers } from "@/lib/roles";
import { codeOk, hashCode } from "@/lib/pin";
import { useLedger } from "@/lib/store";
import { HotelLogo } from "@/components/hotel-logo";
import { CloudSchemaSetup } from "@/components/cloud-schema-setup";
import { useStaffSession } from "@/lib/supabase-auth";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { useCloudSync, importBackupAndRefresh, saveAccountNow } from "@/lib/supabase-sync";
import {
  backupCounts,
  backupFilename,
  buildBackupFile,
  downloadBackupJson,
  mergeMonthBooks,
  monthLabel,
  monthsInTables,
  parseBackupFile,
  sliceBackupTables,
  type BackupTables,
} from "@/lib/backup";
import { hotelForCloud } from "@/lib/register-lock";
import { gstBillsFromGuests } from "@/lib/invoice";
import { snapshotFromUnknown, type LedgerSnapshot } from "@/lib/supabase-db";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function snapshotNow(): LedgerSnapshot {
  const s = useLedger.getState();
  return {
    hotel: hotelForCloud(
      s.hotel,
      s.lockedDates ?? {},
      s.lockRev ?? {},
      s.sealedIds ?? {},
      s.deletedIds ?? {},
      s.reminders ?? [],
      gstBillsFromGuests(s.guests),
      s.bankRows ?? [],
      s.guestCards ?? [],
      s.contacts ?? [],
      s.corporates ?? [],
      s.monthDraws ?? [],
      s.agents ?? [],
      s.monthOpenings ?? [],
      s.openMonths ?? [],
      s.monthArchives ?? [],
    ),
    opening: s.opening,
    rooms: s.rooms,
    guests: s.guests,
    food: s.food,
    wholesale: s.wholesale,
    expenses: s.expenses,
    balReceived: s.balReceived,
    staff: s.staff,
    staffRegister: s.staffRegister,
    payrollFiles: s.payrollFiles,
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
    deletedIds: s.deletedIds ?? {},
    inventory: s.inventory,
    inventoryFiles: s.inventoryFiles,
    complaints: s.complaints,
    reminders: s.reminders,
    contacts: s.contacts,
    corporates: s.corporates,
    agents: s.agents,
    bookers: s.bookers,
    monthDraws: s.monthDraws,
    monthOpenings: s.monthOpenings,
    monthArchives: s.monthArchives,
    openMonths: s.openMonths,
    guestCards: s.guestCards,
    bankRows: s.bankRows,
    cashCounts: s.cashCounts,
    savedAt: s.savedAt,
  };
}

function BackupCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { gate } = useGate();
  const guests = useLedger((s) => s.guests.length);
  const { user } = useStaffSession();
  const { busy: saving, saveToServer } = useAccountSave();
  const [busy, setBusy] = useState<"file" | "import" | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importMonths, setImportMonths] = useState<string[]>([]);
  const [pendingTables, setPendingTables] = useState<BackupTables | null>(null);
  const ownerId = user?.ownerId || user?.id || null;
  const savedAt = useLedger((s) => s.savedAt);
  const exportMonths = useMemo(
    () => monthsInTables(snapshotNow()).slice().reverse(),
    [savedAt, guests, exportOpen],
  );

  async function downloadMonth(month: string | null) {
    setBusy("file");
    try {
      const account = await saveAccountNow();
      const snap = snapshotNow();
      const file = month
        ? buildBackupFile(sliceBackupTables(snap, month), month)
        : buildBackupFile(snap);
      downloadBackupJson(file, month ? backupFilename(month) : backupFilename());
      const n = backupCounts(month ? sliceBackupTables(snap, month) : snap);
      const label = month ? monthLabel(month) : "All months";
      if (account.ok) {
        toast.success(
          `${label} file saved · ${n.guests} guests · ${n.dates.length || 0} days`,
        );
      } else {
        toast.error(`File saved on this computer. Account: ${account.message}`);
      }
      setExportOpen(false);
    } finally {
      setBusy(null);
    }
  }

  function confirmImport(month: string) {
    if (!pendingTables) {
      toast.error("Choose a backup file first.");
      return;
    }
    const deskId = ownerId || "offline";
    const sliced = sliceBackupTables(pendingTables, month);
    const incoming = snapshotFromUnknown(sliced, clearedSnapshot(snapshotNow()));
    const monthOpen = (sliced.openMonths ?? []).includes(month);
    const merged = mergeMonthBooks(snapshotNow(), incoming, month, monthOpen);
    const n = backupCounts(sliced);
    const other = monthsInTables(merged).filter((item) => item !== month);
    gate(
      () => {
        setBusy("import");
        void importBackupAndRefresh(deskId, merged)
          .then((result) => {
            if (!result.ok) {
              toast.error(result.message || "The backup was not saved to the account");
              return;
            }
            toast.success(
              result.cloud
                ? `${monthLabel(month)} imported · ${n.guests} guests. ${
                    other.length ? `${other.map(monthLabel).join(", ")} was not deleted.` : "No other month was in the books."
                  }`
                : `${monthLabel(month)} saved on this computer · ${n.guests} guests. The server is off.`,
            );
            setPendingTables(null);
            setImportMonths([]);
          })
          .catch((err) => {
            toast.error(err instanceof Error ? err.message : "Could not import backup");
          })
          .finally(() => setBusy(null));
      },
      {
        title: `Import ${monthLabel(month)}?`,
        message: `Only ${monthLabel(month)} will be replaced (${n.guests} guests). ${
          other.length ? `${other.map(monthLabel).join(", ")} stays as it is.` : "Other months stay empty until you import their file."
        }`,
        confirmLabel: "Import",
      },
    );
  }

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseBackupFile(JSON.parse(String(reader.result)));
        const months = monthsInTables(parsed.tables);
        if (!months.length) {
          toast.error("No month was found in this file.");
          return;
        }
        setPendingTables(parsed.tables);
        setImportMonths(months.slice().reverse());
        setExportOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not read backup");
      }
    };
    reader.onerror = () => toast.error("Could not read backup");
    reader.readAsText(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup</CardTitle>
        <p className="text-sm text-muted">
          The server is off. Import stays on this computer. Import September, then October, each as its own file. The other desk imports on its own.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => setExportOpen((open) => !open)} disabled={Boolean(busy)}>
            {busy === "file" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {busy === "file" ? "Saving…" : "Monthly backup"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(busy)}
            onClick={() => fileRef.current?.click()}
          >
            {busy === "import" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {busy === "import" ? "Saving to account…" : "Import month"}
          </Button>
          <SaveCube
            busy={saving || Boolean(busy)}
            onSave={() => void saveToServer()}
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            disabled={Boolean(busy)}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onFile(file);
            }}
          />
          <p className="text-xs text-muted">{guests} guests in the live books</p>
        </div>
        {exportOpen ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Which month's backup?</p>
            <div className="flex flex-wrap gap-2">
              {exportMonths.map((month) => (
                <Button
                  key={month}
                  type="button"
                  variant="outline"
                  disabled={Boolean(busy)}
                  onClick={() => void downloadMonth(month)}
                >
                  {monthLabel(month)}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(busy)}
                onClick={() => void downloadMonth(null)}
              >
                All months
              </Button>
            </div>
          </div>
        ) : null}
        {importMonths.length ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Which month should be imported? The other month will not be deleted.</p>
            <div className="flex flex-wrap gap-2">
              {importMonths.map((month) => (
                <Button
                  key={month}
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => confirmImport(month)}
                >
                  {monthLabel(month)}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPendingTables(null);
                  setImportMonths([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function clearedSnapshot(base: LedgerSnapshot): LedgerSnapshot {
  return {
    ...base,
    guests: [],
    food: [],
    wholesale: [],
    expenses: [],
    balReceived: [],
    staff: [],
    staffRegister: [],
    payrollFiles: [],
    advances: [],
    ota: [],
    janSales: [],
    janFood: [],
    creditGuests: [],
    inventory: [],
    inventoryFiles: [],
    complaints: [],
    reminders: [],
    contacts: [],
    corporates: [],
    agents: [],
    guestCards: [],
    bankRows: [],
    monthDraws: [],
    monthOpenings: [],
    monthArchives: [],
    openMonths: [],
    lockedDates: {},
    lockRev: {},
    sealedIds: {},
    deletedIds: {},
    rooms: [],
  };
}

function EmptyBooksCard() {
  const clearBooks = useLedger((s) => s.clearBooks);
  const { gate } = useGate();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Empty books</CardTitle>
        <p className="text-sm text-muted">
          Reset makes the live book zero. Guests, balance, expenses and every
          other entry are removed. A JSON file imported after this stays saved.
        </p>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          onClick={() =>
            gate(() => clearBooks(), {
              title: "Are you sure?",
              message:
                "Reset the live book to zero? Every entry on this desk will be removed. Import your JSON after this.",
              confirmLabel: "Reset to zero",
              danger: true,
            })
          }
        >
          Reset to zero
        </Button>
      </CardContent>
    </Card>
  );
}

function ProfilePage() {
  const hotel = useLedger((s) => s.hotel);
  const stored = useLedger((s) => s.securityCode);
  const role = useLedger((s) => s.appRole);
  const setSecurityCode = useLedger((s) => s.setSecurityCode);
  const { gate, hasCode } = useGate();
  const { user } = useStaffSession();
  const cloud = useCloudSync();

  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Hotel
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Profile
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <HotelLogo mark className="h-12 w-auto shrink-0" />
          <p className="text-sm text-muted">
            {hotel.name} · {hotel.place}
            {role === "owner" ? " · View only" : ""}
          </p>
        </div>
      </div>

      {canAddUsers(role) ? <AddUserCard /> : null}

      {role === "admin" || role === "supervisor" ? <BackupCard /> : null}
      {role === "admin" || role === "supervisor" ? <EmptyBooksCard /> : null}

      {user ? (
        <Card>
          <CardHeader>
            <CardTitle>Cloud books</CardTitle>
            <p className="text-sm text-muted">
              {cloud.phase === "missing-schema"
                ? "Rooms, staff, expenses and balance tables are not in your Supabase project yet. Books stay on this device until those tables exist."
                : cloud.phase === "error"
                  ? cloud.message || "Could not reach your account's books."
                  : cloud.phase === "saving"
                    ? "Sending the latest entries to every desk…"
                    : cloud.phase === "migrated"
                      ? "Account saved. This desk's older books were copied into the hotel account. Save file downloads that copy."
                      : cloud.phase === "synced"
                        ? "Account saved. Save file downloads this same copy for every desk."
                        : "On sign-in this computer drops its old copy and loads the hotel books from the account, so every desk matches."}
            </p>
          </CardHeader>
          <CardContent>
            {cloud.phase === "missing-schema" ? (
              <CloudSchemaSetup userId={user.id} />
            ) : (
              <p className="text-xs text-muted">
                Sign in again on a desk to refresh it from the account. Lock,
                guests, food and expenses then stay in step across every
                computer. Press Refresh on the register if a desk was offline.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {role === "admin" ? (
      <>
      <Card>
        <CardHeader>
          <CardTitle>Security code</CardTitle>
          <p className="text-sm text-muted">
            {hasCode
              ? "Required to edit or remove anything in the ledger."
              : "Not set — edits are open. Set a code to lock changes."}
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:max-w-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (hasCode && !codeOk(stored, currentPin)) {
                toast.error("Current code is wrong");
                return;
              }
              if (nextPin && nextPin.length < 4) {
                toast.error("Use at least 4 digits");
                return;
              }
              if (nextPin !== confirmPin) {
                toast.error("New code does not match");
                return;
              }
              gate(
                () => {
                  setSecurityCode(nextPin ? hashCode(nextPin) : "");
                  setCurrentPin("");
                  setNextPin("");
                  setConfirmPin("");
                  toast.success(
                    nextPin ? "Security code saved" : "Security code cleared",
                  );
                },
                {
                  title: "Are you sure?",
                  message: nextPin
                    ? "Change the security code?"
                    : "Clear the security code?",
                  confirmLabel: "Save",
                },
              );
            }}
          >
            {hasCode ? (
              <div className="grid gap-1.5">
                <Label htmlFor="pin-now">Current code</Label>
                <Input
                  id="pin-now"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                />
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <Label htmlFor="pin-new">New code</Label>
              <Input
                id="pin-new"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={nextPin}
                onChange={(e) => setNextPin(e.target.value)}
                placeholder={hasCode ? "Leave blank to clear" : "At least 4 digits"}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pin-confirm">Confirm</Label>
              <Input
                id="pin-confirm"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
              />
            </div>
            <Button type="submit">{hasCode ? "Update code" : "Set code"}</Button>
          </form>
        </CardContent>
      </Card>
      </>
      ) : (
        <p className="text-sm text-muted">
          Housekeeping can open Inventory to count linen and Complaints to
          register or edit a room issue.
        </p>
      )}
    </div>
  );
}
