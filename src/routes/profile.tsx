import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddUserCard } from "@/components/add-user-form";
import { useGate } from "@/components/security-gate";
import { formatDay, money } from "@/lib/format";
import { canAddUsers } from "@/lib/roles";
import { codeOk, hashCode } from "@/lib/pin";
import { useLedger } from "@/lib/store";
import { HotelLogo } from "@/components/hotel-logo";
import { CloudSchemaSetup } from "@/components/cloud-schema-setup";
import { useStaffSession } from "@/lib/supabase-auth";
import { useCloudSync, importBackupAndRefresh } from "@/lib/supabase-sync";
import {
  backupCounts,
  backupFilename,
  buildBackupFile,
  downloadBackupJson,
  parseBackupFile,
} from "@/lib/backup";
import { hotelForCloud } from "@/lib/register-lock";
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
    ),
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

function BackupCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { gate } = useGate();
  const guests = useLedger((s) => s.guests.length);
  const { user } = useStaffSession();
  const [busy, setBusy] = useState(false);
  const ownerId = user?.ownerId || user?.id || null;

  function download() {
    const snap = snapshotNow();
    downloadBackupJson(buildBackupFile(snap), backupFilename());
    const n = backupCounts(snap);
    toast.success(
      `Backup saved · ${n.guests} guests · ${n.dates.length || 0} days`,
    );
  }

  function onFile(file: File) {
    if (!ownerId) {
      toast.error("Sign in to import into the hotel books.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseBackupFile(JSON.parse(String(reader.result)));
        const tables = snapshotFromUnknown(parsed.tables, snapshotNow());
        const n = backupCounts(tables);
        gate(
          () => {
            setBusy(true);
            void importBackupAndRefresh(ownerId, tables)
              .then((result) => {
                if (!result.ok) {
                  toast.error(result.message || "Could not import backup");
                  return;
                }
                toast.success(
                  `Imported to the account · ${n.guests} guests · ${n.dates[0] ?? "—"} to ${n.dates.at(-1) ?? "—"}. Every desk now matches.`,
                );
              })
              .catch((err) => {
                toast.error(err instanceof Error ? err.message : "Could not import backup");
              })
              .finally(() => setBusy(false));
          },
          {
            title: "Import this backup into the hotel account?",
            message: `Rows in the file are added or updated in Supabase (${n.guests} guests, ${n.food} food, ${n.expenses} expenses). Existing rows keep their id — no duplicates. Then this computer reloads the account copy.`,
            confirmLabel: "Import",
          },
        );
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
          Download every table as a JSON file. Import puts each table into the
          hotel account — existing rows update, new rows add, nothing is
          duplicated — then all desks refresh from that copy.
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={download} disabled={busy}>
          <Download className="size-4" />
          Download backup
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {busy ? "Importing…" : "Import backup"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />
        <p className="text-xs text-muted">{guests} guests in the live books</p>
      </CardContent>
    </Card>
  );
}

function ProfilePage() {
  const hotel = useLedger((s) => s.hotel);
  const opening = useLedger((s) => s.opening);
  const openingDate = useLedger((s) => s.openingDate);
  const stored = useLedger((s) => s.securityCode);
  const role = useLedger((s) => s.appRole);
  const setOpening = useLedger((s) => s.setOpening);
  const setSecurityCode = useLedger((s) => s.setSecurityCode);
  const { gate, hasCode } = useGate();
  const { user } = useStaffSession();
  const cloud = useCloudSync();

  const [date, setDate] = useState(openingDate);
  const [cash, setCash] = useState(String(opening.cash));
  const [santosh, setSantosh] = useState(String(opening.santosh));
  const [pk, setPk] = useState(String(opening.pk));
  const [online, setOnline] = useState(String(opening.online));
  const [outstanding, setOutstanding] = useState(String(opening.outstanding));

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
          </p>
        </div>
      </div>

      {canAddUsers(role) ? <AddUserCard /> : null}

      {role === "admin" || role === "supervisor" ? <BackupCard /> : null}

      {user ? (
        <Card>
          <CardHeader>
            <CardTitle>Cloud books</CardTitle>
            <p className="text-sm text-muted">
              {cloud.phase === "missing-schema"
                ? "Rooms, staff, expenses and balance tables are not in your Supabase project yet. Books stay on this device until those tables exist."
                : cloud.phase === "error"
                  ? cloud.message || "Could not reach your account's books."
                  : cloud.phase === "migrated"
                    ? "This device's older books were copied into your account."
                    : cloud.phase === "saving"
                      ? "Sending the latest entries to every desk…"
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
          <CardTitle>Opening balance</CardTitle>
          <p className="text-sm text-muted">
            Now from {formatDay(openingDate)}. Saved on the hotel account, not
            this computer. Books from this date start with these figures.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!date) {
                toast.error("Pick a date");
                return;
              }
              const n = (v: string) => Number(v);
              const next = {
                cash: n(cash),
                santosh: n(santosh),
                pk: n(pk),
                online: n(online),
                outstanding: n(outstanding),
              };
              if (Object.values(next).some((v) => !Number.isFinite(v))) {
                toast.error("Enter valid amounts");
                return;
              }
              const save = () => {
                setOpening(date, next);
                toast.success(`Opening set from ${formatDay(date)}`);
              };
              gate(save, {
                title: "Are you sure?",
                message: `Set opening balances from ${formatDay(date)}? Books will rebuild from this date.`,
                confirmLabel: "Save",
              });
            }}
          >
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="ob-date">From date</Label>
              <Input
                id="ob-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {(
              [
                ["Cash", cash, setCash],
                ["Santosh QR", santosh, setSantosh],
                ["P.K. QR", pk, setPk],
                ["Online", online, setOnline],
                ["Outstanding / Balance", outstanding, setOutstanding],
              ] as const
            ).map(([label, value, set]) => (
              <div key={label} className="grid gap-1.5">
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button type="submit">Save opening</Button>
            </div>
          </form>
          <p className="mt-4 text-xs text-muted">
            Current: cash {money(opening.cash)} · Santosh {money(opening.santosh)}{" "}
            · P.K. {money(opening.pk)} · Online {money(opening.online)} ·
            Balance {money(opening.outstanding)}
          </p>
        </CardContent>
      </Card>

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
