import { useEffect, useMemo, useRef, useState } from "react";
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
import { drawForMonth } from "@/lib/month-draw";
import { todayIso } from "@/lib/reminders";
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
  parseBackupFile,
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
    monthDraws: s.monthDraws,
    guestCards: s.guestCards,
    bankRows: s.bankRows,
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
  const ownerId = user?.ownerId || user?.id || null;

  async function download() {
    setBusy("file");
    try {
      const account = await saveAccountNow();
      const snap = snapshotNow();
      downloadBackupJson(buildBackupFile(snap), backupFilename());
      const n = backupCounts(snap);
      if (account.ok) {
        toast.success(
          `Account saved · file saved · ${n.guests} guests · ${n.inventoryFiles} inventory files · ${n.payrollFiles} salary files · ${n.dates.length || 0} days`,
        );
      } else {
        toast.error(
          `File saved on this computer. Account: ${account.message}`,
        );
      }
    } finally {
      setBusy(null);
    }
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
            setBusy("import");
            void importBackupAndRefresh(ownerId, tables)
              .then((result) => {
                if (!result.ok) {
                  toast.error(result.message || "JSON account में सेव नहीं हुआ");
                  return;
                }
                toast.success(
                  `JSON account में सेव हो गया · ${n.guests} guests · ${n.dates[0] ?? "—"} to ${n.dates.at(-1) ?? "—"}. Refresh के बाद भी यही रहेगा.`,
                );
              })
              .catch((err) => {
                toast.error(err instanceof Error ? err.message : "Could not import backup");
              })
              .finally(() => setBusy(null));
          },
          {
            title: "Import this backup into the hotel account?",
            message: `This JSON will save into the hotel account (${n.guests} guests, ${n.food} food, ${n.expenses} expenses). After that, refresh will keep this copy.`,
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
          Download JSON, import JSON, or Save to send the live books to the
          hotel account. Import JSON सेव करके account में चढ़ा देता है —
          refresh के बाद पुराना डेटा वापस नहीं आएगा.
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void download()} disabled={Boolean(busy)}>
          {busy === "file" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {busy === "file" ? "Saving…" : "Save file"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={Boolean(busy)}
          onClick={() => fileRef.current?.click()}
        >
          {busy === "import" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {busy === "import" ? "Saving to account…" : "Import JSON"}
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
      </CardContent>
    </Card>
  );
}

function EmptyBooksCard() {
  const restore = useLedger((s) => s.restoreSeed);
  const { gate } = useGate();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Empty books</CardTitle>
        <p className="text-sm text-muted">
          Reset all books to empty and start from today. Local entries on this
          desk will be cleared.
        </p>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          onClick={() =>
            gate(() => restore(), {
              title: "Are you sure?",
              message:
                "Reset all books to empty and start from today? Local entries will be cleared.",
              confirmLabel: "Restore",
              danger: true,
            })
          }
        >
          Reset empty books
        </Button>
      </CardContent>
    </Card>
  );
}

function closedMonths(openingDate: string) {
  const start = (openingDate || "2026-09-01").slice(0, 7);
  const today = todayIso().slice(0, 7);
  const out: string[] = [];
  let year = Number(start.slice(0, 4));
  let month = Number(start.slice(5, 7));
  const endYear = Number(today.slice(0, 4));
  const endMonth = Number(today.slice(5, 7));
  while (year < endYear || (year === endYear && month < endMonth)) {
    out.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out;
}

function monthTitle(month: string) {
  const [year, m] = month.split("-");
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${names[Number(m) - 1] ?? month} ${year}`;
}

function nextMonth(month: string) {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  if (m === 12) return `${year + 1}-01`;
  return `${year}-${String(m + 1).padStart(2, "0")}`;
}

function MonthEndCard() {
  const days = useLedger((s) => s.days);
  const draws = useLedger((s) => s.monthDraws);
  const openingDate = useLedger((s) => s.openingDate);
  const setMonthDraws = useLedger((s) => s.setMonthDraws);
  const { gate } = useGate();
  const { busy, saveToServer } = useAccountSave();
  const months = useMemo(() => closedMonths(openingDate), [openingDate]);
  const [month, setMonth] = useState(months.at(-1) ?? "");
  const saved = drawForMonth(draws, month);
  const [cash, setCash] = useState(saved.cash ? String(saved.cash) : "");
  const [santosh, setSantosh] = useState(saved.santosh ? String(saved.santosh) : "");
  const [pk, setPk] = useState(saved.pk ? String(saved.pk) : "");
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !months.length) return;
    started.current = true;
    const next = months.at(-1) ?? "";
    const row = drawForMonth(draws, next);
    setMonth(next);
    setCash(row.cash ? String(row.cash) : "");
    setSantosh(row.santosh ? String(row.santosh) : "");
    setPk(row.pk ? String(row.pk) : "");
  }, [months, draws]);

  function pick(next: string) {
    const row = drawForMonth(draws, next);
    setMonth(next);
    setCash(row.cash ? String(row.cash) : "");
    setSantosh(row.santosh ? String(row.santosh) : "");
    setPk(row.pk ? String(row.pk) : "");
  }

  const close = days.filter((day) => day.date.startsWith(month)).at(-1);
  const totals = {
    cash: close?.cashBook.cb ?? 0,
    santosh: close?.santosh.cb ?? 0,
    pk: close?.pk.cb ?? 0,
  };
  const take = {
    cash: Math.min(Math.max(0, Math.round(Number(cash) || 0)), Math.max(0, totals.cash)),
    santosh: Math.min(
      Math.max(0, Math.round(Number(santosh) || 0)),
      Math.max(0, totals.santosh),
    ),
    pk: Math.min(Math.max(0, Math.round(Number(pk) || 0)), Math.max(0, totals.pk)),
  };
  const left = {
    cash: totals.cash - take.cash,
    santosh: totals.santosh - take.santosh,
    pk: totals.pk - take.pk,
  };

  function saveDraw() {
    if (!month || !close) {
      toast.error("Is month ka closing abhi book mein nahi hai");
      return;
    }
    gate(
      () => {
        const rest = draws.filter((row) => row.month !== month);
        setMonthDraws([...rest, { month, ...take }]);
        toast.success(`${monthTitle(nextMonth(month))} opening set`);
        void saveToServer();
      },
      {
        title: "Withdraw and set next month?",
        message: `${monthTitle(month)} close se cash ${money(take.cash)}, Santosh ${money(take.santosh)}, P.K. ${money(take.pk)} nikaloge. ${monthTitle(nextMonth(month))} cash ${money(left.cash)} se start hoga.`,
        confirmLabel: "Withdraw",
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Month-end withdraw</CardTitle>
        <p className="text-sm text-muted">
          September opening upar jaisa hai waisa hi rahega. Month end ke baad cash, Santosh QR
          aur P.K. ka total yahan hai. Jo withdraw karoge, uske baad bacha hua agle month ki
          starting balance hai.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {months.length === 0 ? (
          <p className="text-sm text-muted">Month end ke baad yahan withdraw ka option aayega.</p>
        ) : (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="draw-month">Month</Label>
              <select
                id="draw-month"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={month}
                onChange={(e) => pick(e.target.value)}
              >
                {months.map((value) => (
                  <option key={value} value={value}>
                    {monthTitle(value)}
                  </option>
                ))}
              </select>
            </div>
            {close ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["Cash", totals.cash, cash, setCash],
                    ["Santosh QR", totals.santosh, santosh, setSantosh],
                    ["P.K. QR", totals.pk, pk, setPk],
                  ] as const
                ).map(([label, total, value, set]) => (
                  <div key={label} className="grid gap-1.5">
                    <Label>
                      {label} · {money(total)}
                    </Label>
                    <Input
                      inputMode="numeric"
                      placeholder="Withdraw"
                      value={value}
                      onChange={(e) => set(e.target.value.replace(/[^\d]/g, ""))}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Is month ka closing abhi book mein nahi hai.</p>
            )}
            <p className="text-sm">
              {monthTitle(nextMonth(month || months[0] || "2026-10"))} opening: cash{" "}
              {money(left.cash)} · Santosh {money(left.santosh)} · P.K. {money(left.pk)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={busy || !close} onClick={saveDraw}>
                {busy ? "Saving…" : "Withdraw"}
              </Button>
            </div>
          </>
        )}
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
          <CardTitle>Opening balance</CardTitle>
          <p className="text-sm text-muted">
            Now from {formatDay(openingDate)}. This September opening stays as it is.
            Month-end withdraw is the next card and does not change these figures.
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

      <MonthEndCard />

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
