import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Search, Trash2, Lock, LockOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GuestForm } from "@/components/guest-form";
import { RegisterLines } from "@/components/register-lines";
import { ModeBadge } from "@/components/mode-badge";
import { YesterdayRoll } from "@/components/yesterday-roll";
import { ReportsLink } from "@/components/reports-link";
import { useGate } from "@/components/security-gate";
import { buildDayTake } from "@/lib/day-report";
import { formatDay, formatDayShort, money } from "@/lib/format";
import { stayDates } from "@/lib/stay";
import { useLedger } from "@/lib/store";
import { isDayLocked } from "@/lib/register-lock";
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
  const lockedDates = useLedger((s) => s.lockedDates);
  const lockRegister = useLedger((s) => s.lockRegister);
  const unlockRegister = useLedger((s) => s.unlockRegister);
  const { busy: saving, saveToServer } = useAccountSave();
  const { gate } = useGate();
  const locked = isDayLocked(lockedDates, date);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col gap-5">
        <AccountWriteFix />
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
          {locked ? (
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

      {locked ? (
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
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Check-in</th>
                <th className="px-3 py-2 font-medium">Check-out</th>
                <th className="px-3 py-2 font-medium">Stay</th>
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
                  <td className="px-3 py-2.5 text-right tabular">
                    {money(g.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{g.source || "—"}</td>
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
    </div>
  );
}

