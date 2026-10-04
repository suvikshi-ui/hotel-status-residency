import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Search, Trash2, Lock, LockOpen, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuestForm } from "@/components/guest-form";
import { RegisterLines } from "@/components/register-lines";
import { ModeBadge } from "@/components/mode-badge";
import { PkRefField } from "@/components/pk-ref";
import { YesterdayRoll } from "@/components/yesterday-roll";
import { ReportsLink } from "@/components/reports-link";
import { useGate } from "@/components/security-gate";
import { buildDayTake } from "@/lib/day-report";
import { formatDay, formatDayShort, money, uid } from "@/lib/format";
import { stayDates } from "@/lib/stay";
import { useLedger } from "@/lib/store";
import { isDayLocked } from "@/lib/register-lock";
import { openingForMonth } from "@/lib/month-opening";
import { buildBackupFile, downloadBackupJson } from "@/lib/backup";
import { canWrite } from "@/lib/roles";
import type { GuestEntry } from "@/lib/types";
import { requestCloudPullNow } from "@/lib/supabase-sync";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { AccountWriteFix } from "@/components/account-write-fix";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const date = useLedger((s) => s.selectedDate);
  const allGuests = useLedger((s) => s.guests);
  const allFood = useLedger((s) => s.food);
  const allWs = useLedger((s) => s.wholesale);
  const guests = allGuests.filter((g) => g.date === date);
  const food = allFood.filter((f) => f.date === date);
  const ws = allWs.filter((w) => w.date === date);
  const allExp = useLedger((s) => s.expenses);
  const allBal = useLedger((s) => s.balReceived);
  const expenses = allExp.filter((e) => e.date === date);
  const receipts = allBal.filter((r) => r.date === date);
  const take = buildDayTake(guests, food, ws);
  const removeGuest = useLedger((s) => s.removeGuest);
  const setStay = useLedger((s) => s.setStay);
  const setLineRef = useLedger((s) => s.setLineRef);
  const lockedDates = useLedger((s) => s.lockedDates);
  const openingDate = useLedger((s) => s.openingDate);
  const openMonths = useLedger((s) => s.openMonths);
  const lockRegister = useLedger((s) => s.lockRegister);
  const unlockRegister = useLedger((s) => s.unlockRegister);
  const lockMonth = useLedger((s) => s.lockMonth);
  const { busy: saving, saveToServer } = useAccountSave();
  const guestCards = useLedger((s) => s.guestCards);
  const saveGuestCard = useLedger((s) => s.saveGuestCard);
  const { gate } = useGate();
  const locked = isDayLocked(lockedDates, date);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailFor, setDetailFor] = useState<GuestEntry | null>(null);

  useEffect(() => {
    setEditingId(null);
  }, [date]);

  useEffect(() => {
    if (locked) setEditingId(null);
  }, [locked]);

  const editing = allGuests.find((g) => g.id === editingId) ?? null;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(t) ||
        g.roomNo.toLowerCase().includes(t) ||
        g.mode.toLowerCase().includes(t) ||
        (g.source ?? "").toLowerCase().includes(t),
    );
  }, [guests, q]);

  const month = date.slice(0, 7);
  const monthName = format(parseISO(`${month}-01`), "MMMM");
  const latestMark = [
    openingDate,
    date,
    ...allGuests.map((row) => row.date),
    ...allFood.map((row) => row.date),
    ...allWs.map((row) => row.date),
    ...allExp.map((row) => row.date),
    ...allBal.map((row) => row.date),
  ]
    .filter(Boolean)
    .reduce((max, value) => (value > max ? value : max), openingDate || date);
  const priorMonth = month < latestMark.slice(0, 7);
  const monthReopened = (openMonths ?? []).includes(month);

  return (
    <div className="flex flex-col gap-5">
        <AccountWriteFix />
        <MonthBooks />
        <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Guest book
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Daily register
        </h1>
        <p className="mt-2 font-display text-xl font-medium tracking-tight text-primary">
          {formatDay(date)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {guests.length} postings · {money(take.roomsTotal)} room revenue ·
          Lock / Unlock / Edit / Delete always need the security code. Then press Save.
        </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <SaveCube busy={saving} onSave={() => void saveToServer()} />
          {priorMonth && !monthReopened ? null : priorMonth && monthReopened ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                gate(
                  () => {
                    lockMonth(month);
                    setEditingId(null);
                    toast.success(`${monthName} locked`);
                  },
                  {
                    title: `Lock ${monthName}?`,
                    message:
                      "Enter the security code. This month's register and report stay as they are.",
                    confirmLabel: "Lock month",
                    requireCode: true,
                  },
                )
              }
            >
              <Lock className="size-4" />
              Lock {monthName}
            </Button>
          ) : locked ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                gate(
                  () => {
                    unlockRegister(date);
                    toast.success(`Unlocked ${formatDay(date)}`);
                  },
                  {
                    title: "Unlock this day's register?",
                    message:
                      "Enter the security code to unlock. Edit and Delete come back after unlock.",
                    confirmLabel: "Unlock",
                    requireCode: true,
                  },
                );
              }}
            >
              <LockOpen className="size-4" />
              Unlock
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                gate(
                  () => {
                    lockRegister(date);
                    setEditingId(null);
                    toast.success(`Locked ${formatDay(date)}`);
                  },
                  {
                    title: "Lock this day's register?",
                    message:
                      "Enter the security code to lock. Edit and Delete hide until you unlock with the same code.",
                    confirmLabel: "Lock",
                    requireCode: true,
                  },
                )
              }
            >
              <Lock className="size-4" />
              Lock
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              requestCloudPullNow();
              toast.message("Checking the other desk…");
            }}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <ReportsLink view="daily" label="Reports" />
        </div>
        </div>

      {priorMonth && !monthReopened ? (
        <p className="rounded-lg bg-bg-warm px-4 py-3 text-sm">
          {monthName} is a locked cube. Tap a date to read that day. Reports stay
          open, and not one entry is deleted. October does not change this month.
        </p>
      ) : locked ? (
        <p className="rounded-lg bg-bg-warm px-4 py-3 text-sm">
          This day's register is locked on every desk. Unlock with the digit
          code to add or edit. You do not need to press Lock again on another
          computer.
        </p>
      ) : null}
      <YesterdayRoll />
      {locked ? null : (
      <GuestForm
        editing={editing}
        onCancelEdit={() => setEditingId(null)}
      />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          ["Cash", take.cash.rooms],
          ["Santosh QR", take.santosh.rooms],
          ["Praween QR", take.pk.rooms],
          ["Online", take.online.rooms],
          ["Balance", take.due.rooms],
          ["Food + WS", take.foodTotal + take.wsTotal],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <div className="text-xs font-medium text-muted">
              {label}
            </div>
            <div className="mt-1 font-display text-xl font-semibold tabular">
              {money(Number(value))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Postings</CardTitle>
            <p className="text-sm text-muted">{formatDay(date)}</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder="Search name, room, mode, source"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Room</th>
                <th className="px-3 py-2 font-medium">Mode</th>
                <th className="px-3 py-2 font-medium">P.K. ref</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Check-in</th>
                <th className="px-3 py-2 font-medium">Check-out</th>
                <th className="px-3 py-2 font-medium">Stay</th>
                <th className="px-3 py-2 font-medium">Guest</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => {
                const dates = stayDates(allGuests, g);
                return (
                <tr
                  key={g.id}
                  className="border-b border-border/70 hover:bg-bg-warm/50"
                >
                  <td className="px-5 py-2.5 tabular text-muted">{g.slNo}</td>
                  <td className="px-3 py-2.5 font-medium">{g.name}</td>
                  <td className="px-3 py-2.5 tabular">{g.roomNo}</td>
                  <td className="px-3 py-2.5">
                    <ModeBadge mode={g.mode} />
                  </td>
                  <td className="px-3 py-2.5">
                    {g.mode === "QRPK" ? (
                      <PkRefField
                        value={g.payRefNo}
                        disabled={locked}
                        onSave={(ref) => setLineRef("guest", g.id, ref)}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {money(g.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{g.source || "—"}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={g.gst ? "ok" : "muted"}>
                      {g.gst ? "GST" : "Non GST"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 tabular text-muted">
                    {formatDayShort(dates.checkIn)}
                    {g.inTime ? ` · ${g.inTime}` : ""}
                  </td>
                  <td className="px-3 py-2.5 tabular text-muted">
                    {dates.checkOut
                      ? `${formatDayShort(dates.checkOut)}${g.outTime ? ` · ${g.outTime}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {g.stay === "out" ? (
                      <Badge variant="muted">Out</Badge>
                    ) : locked ? (
                      <Badge variant="muted">Continue</Badge>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          gate(
                            () => setStay(g.id, "out", { bypass: true }),
                            {
                              title: "Check out?",
                              message: `Check out ${g.name} from room ${g.roomNo}. Enter the security code.`,
                              confirmLabel: "Check out",
                              requireCode: true,
                            },
                          )
                        }
                      >
                        Check out
                      </Button>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="size-5 accent-[#1f4a3c]"
                      checked={guestCards.some((card) => card.postingId === g.id)}
                      aria-label={`Guest detail for ${g.name}`}
                      onChange={() => setDetailFor(g)}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {locked ? null : (
                    <div className="flex justify-end gap-1 print:hidden">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Edit ${g.name}`}
                        onClick={() =>
                          gate(() => setEditingId(g.id), {
                            title: "Edit this entry?",
                            message: `Edit ${g.name} · Room ${g.roomNo}. Enter the security code.`,
                            confirmLabel: "Edit",
                            requireCode: true,
                          })
                        }
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-danger hover:text-danger"
                        aria-label={`Delete ${g.name}`}
                        onClick={() =>
                          gate(
                            () => {
                              if (editingId === g.id) setEditingId(null);
                              removeGuest(g.id, { bypass: true });
                              toast.success(`Removed ${g.name}`);
                            },
                            {
                              title: "Delete this entry?",
                              message: `Delete ${g.name} · Room ${g.roomNo}. Enter the security code. Then press Save.`,
                              confirmLabel: "Delete",
                              danger: true,
                              requireCode: true,
                            },
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No matching guests on {formatDay(date)}.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <RegisterLines />
      <GuestDetailDialog
        posting={detailFor}
        existing={guestCards.find((card) => card.postingId === detailFor?.id) ?? null}
        onClose={() => setDetailFor(null)}
        onSave={(card) => {
          saveGuestCard(card);
          setDetailFor(null);
          toast.success(`${card.fullName} added to Guest list`);
          void saveToServer();
        }}
      />
    </div>
  );
}

function GuestDetailDialog({
  posting,
  existing,
  onClose,
  onSave,
}: {
  posting: GuestEntry | null;
  existing: {
    id: string;
    fullName: string;
    phone: string;
    company: string;
    cameFrom: string;
    bookedBy: string;
  } | null;
  onClose: () => void;
  onSave: (card: {
    id: string;
    postingId: string;
    date: string;
    roomNo: string;
    fullName: string;
    phone: string;
    company: string;
    cameFrom: string;
    bookedBy: string;
  }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [cameFrom, setCameFrom] = useState("");
  const [bookedBy, setBookedBy] = useState("");

  useEffect(() => {
    if (!posting) return;
    setFullName(existing?.fullName || posting.name);
    setPhone(existing?.phone ?? "");
    setCompany(existing?.company ?? "");
    setCameFrom(existing?.cameFrom ?? "");
    setBookedBy(existing?.bookedBy ?? "");
  }, [posting, existing]);

  return (
    <Dialog open={Boolean(posting)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guest detail</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!posting || !fullName.trim()) return;
            onSave({
              id: existing?.id || uid("guestcard"),
              postingId: posting.id,
              date: posting.date,
              roomNo: posting.roomNo,
              fullName: fullName.trim(),
              phone: phone.trim(),
              company: company.trim(),
              cameFrom: cameFrom.trim(),
              bookedBy: bookedBy.trim(),
            });
          }}
        >
          <p className="text-sm text-muted">
            Room {posting?.roomNo} · {posting ? formatDayShort(posting.date) : ""}
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guest-full-name">Full name</Label>
            <Input id="guest-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guest-phone">Phone number</Label>
            <Input id="guest-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guest-company">Company name</Label>
            <Input id="guest-company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guest-from">Where from</Label>
            <Input id="guest-from" value={cameFrom} onChange={(e) => setCameFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guest-booked">Who booked</Label>
            <Input id="guest-booked" value={bookedBy} onChange={(e) => setBookedBy(e.target.value)} />
          </div>
          <Button type="submit">Save to Guest list</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function monthSpan(openingDate: string, dates: string[]) {
  const start = (openingDate || "2026-09-01").slice(0, 7);
  const now = new Date();
  let end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  for (const date of dates) {
    const month = (date || "").slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(month) && month > end) end = month;
  }
  if (start > end) end = start;
  const out: string[] = [];
  let year = Number(start.slice(0, 4));
  let month = Number(start.slice(5, 7));
  const endYear = Number(end.slice(0, 4));
  const endMonth = Number(end.slice(5, 7));
  while (year < endYear || (year === endYear && month <= endMonth)) {
    out.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out;
}

function MonthBooks() {
  const date = useLedger((s) => s.selectedDate);
  const setDate = useLedger((s) => s.setDate);
  const openingDate = useLedger((s) => s.openingDate);
  const days = useLedger((s) => s.days);
  const guests = useLedger((s) => s.guests);
  const food = useLedger((s) => s.food);
  const wholesale = useLedger((s) => s.wholesale);
  const expenses = useLedger((s) => s.expenses);
  const balReceived = useLedger((s) => s.balReceived);
  const openings = useLedger((s) => s.monthOpenings);
  const archives = useLedger((s) => s.monthArchives);
  const openMonths = useLedger((s) => s.openMonths);
  const setMonthOpenings = useLedger((s) => s.setMonthOpenings);
  const role = useLedger((s) => s.appRole);
  const write = canWrite(role);
  const { gate } = useGate();
  const { busy, saveToServer } = useAccountSave();
  const dates = useMemo(
    () => [
      ...guests.map((row) => row.date),
      ...days.map((row) => row.date),
    ],
    [guests, days],
  );
  const months = useMemo(
    () => monthSpan(openingDate, dates),
    [openingDate, dates],
  );
  const years = [...new Set(months.map((month) => month.slice(0, 4)))];
  const selectedMonth = date.slice(0, 7);
  const selectedYear = selectedMonth.slice(0, 4);
  const yearMonths = months.filter((month) => month.startsWith(selectedYear));
  const firstMonth = (openingDate || "2026-09-01").slice(0, 7);
  const latestMark = dates.reduce(
    (max, value) => (value > max ? value : max),
    openingDate || date,
  );
  const latestMonth = (latestMark || date).slice(0, 7);
  function closedMonth(month: string) {
    return month < latestMonth && !(openMonths ?? []).includes(month);
  }
  const saved = openingForMonth(openings, selectedMonth);
  const carriedDay = [...days].reverse().find((day) => day.date.slice(0, 7) < selectedMonth);
  const [cash, setCash] = useState(saved ? String(saved.cash) : "");
  const [santosh, setSantosh] = useState(saved ? String(saved.santosh) : "");
  const [pk, setPk] = useState(saved ? String(saved.pk) : "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const row = openingForMonth(openings, selectedMonth);
    setCash(row ? String(row.cash) : "");
    setSantosh(row ? String(row.santosh) : "");
    setPk(row ? String(row.pk) : "");
    setOpen(false);
  }, [date, selectedMonth, openings]);

  function openMonth(month: string) {
    if (closedMonth(month)) {
      setDate(`${month}-01`);
      return;
    }
    if (date.startsWith(month)) return;
    const today = format(new Date(), "yyyy-MM-dd");
    if (today.startsWith(month)) {
      setDate(today);
      return;
    }
    const inMonth = days.filter((day) => day.date.startsWith(month)).map((day) => day.date);
    setDate(inMonth.length ? inMonth[inMonth.length - 1] : `${month}-01`);
  }

  function saveOpening() {
    const row = {
      month: selectedMonth,
      cash: Math.max(0, Math.round(Number(cash) || 0)),
      santosh: Math.max(0, Math.round(Number(santosh) || 0)),
      pk: Math.max(0, Math.round(Number(pk) || 0)),
      online: 0,
    };
    gate(
      () => {
        const rest = openings.filter((item) => item.month !== selectedMonth);
        setMonthOpenings([...rest, row]);
        toast.success(`${format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")} opening saved`);
        void saveToServer();
      },
      {
        title: "Set this month's opening?",
        message:
          "Cash, Santosh QR and P.K. QR start from these figures. Online and outstanding balance still come from the previous month.",
        confirmLabel: "Set opening",
      },
    );
  }

  const monthDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const count = new Date(year, month, 0).getDate();
    const today = format(new Date(), "yyyy-MM-dd");
    const out: string[] = [];
    for (let day = 1; day <= count; day += 1) {
      const iso = `${selectedMonth}-${String(day).padStart(2, "0")}`;
      if (iso.slice(0, 7) < firstMonth) continue;
      if (selectedMonth >= today.slice(0, 7) && iso > today) break;
      out.push(iso);
    }
    return out;
  }, [selectedMonth, firstMonth]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {years.map((year) => (
          <Button
            key={year}
            type="button"
            size="sm"
            variant={year === selectedYear ? "default" : "outline"}
            onClick={() => openMonth(months.find((month) => month.startsWith(year)) || `${year}-01`)}
          >
            {year}
          </Button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {yearMonths.map((month) => (
          <Button
            key={month}
            type="button"
            size="sm"
            variant={month === selectedMonth ? "default" : "outline"}
            onClick={() => openMonth(month)}
          >
            {format(parseISO(`${month}-01`), "MMMM")}
            {closedMonth(month) ? " · lock" : ""}
          </Button>
        ))}
      </div>
      {closedMonth(selectedMonth) ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>
                {format(parseISO(`${selectedMonth}-01`), "MMMM")} lock
              </CardTitle>
              <p className="text-sm text-muted">
                Separate cube. Read every date from the 1st to month end. Cash,
                Santosh QR, P.K. QR, online and balance already carry to the 1st
                of the next month. This JSON backup stays in the account.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const savedArchive = archives.find((row) => row.month === selectedMonth);
                const file = buildBackupFile({
                  guests:
                    savedArchive?.guests ??
                    guests.filter((row) => row.date.startsWith(selectedMonth)),
                  food:
                    savedArchive?.food ??
                    food.filter((row) => row.date.startsWith(selectedMonth)),
                  wholesale:
                    savedArchive?.wholesale ??
                    wholesale.filter((row) => row.date.startsWith(selectedMonth)),
                  expenses:
                    savedArchive?.expenses ??
                    expenses.filter((row) => row.date.startsWith(selectedMonth)),
                  balReceived:
                    savedArchive?.balReceived ??
                    balReceived.filter((row) => row.date.startsWith(selectedMonth)),
                  openingDate: `${selectedMonth}-01`,
                  selectedDate: `${selectedMonth}-01`,
                  savedAt: Date.now(),
                });
                downloadBackupJson(file, `HSR-${selectedMonth}-lock.json`);
                toast.success(`${selectedMonth} backup downloaded. The account copy stays.`);
              }}
            >
              <Download className="size-4" />
              JSON backup
            </Button>
          </CardHeader>
        </Card>
      ) : null}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {monthDays.map((iso) => (
          <Button
            key={iso}
            type="button"
            size="sm"
            variant={iso === date ? "default" : "outline"}
            className="min-w-10 px-2"
            onClick={() => setDate(iso)}
          >
            {Number(iso.slice(8))}
          </Button>
        ))}
      </div>
      {date.endsWith("-01") && selectedMonth !== firstMonth ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Opening balance · 1st</CardTitle>
              <p className="text-sm text-muted">
                Cash, Santosh QR, P.K. QR only. Online and balance carry forward.
                {saved ? " Saved." : " Not set yet."}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
              {open ? "Hide" : "Expand"}
            </Button>
          </CardHeader>
          {open ? (
            <CardContent className="flex flex-col gap-3">
              {carriedDay ? (
                <p className="text-sm text-muted">
                  Carried · online {money(carriedDay.online.cb)} · balance{" "}
                  {money(carriedDay.outstanding.cb)}
                </p>
              ) : null}
              {write ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {(
                      [
                        ["Cash", cash, setCash],
                        ["Santosh QR", santosh, setSantosh],
                        ["P.K. QR", pk, setPk],
                      ] as const
                    ).map(([label, value, set]) => (
                      <div key={label} className="grid gap-1.5">
                        <Label>{label}</Label>
                        <Input
                          inputMode="numeric"
                          value={value}
                          onChange={(e) => set(e.target.value.replace(/[^\d]/g, ""))}
                        />
                      </div>
                    ))}
                  </div>
                  <Button type="button" disabled={busy} onClick={saveOpening}>
                    {busy ? "Saving…" : "Set opening"}
                  </Button>
                </>
              ) : null}
            </CardContent>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

