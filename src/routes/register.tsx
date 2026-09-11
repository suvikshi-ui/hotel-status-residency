import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DayChart } from "@/components/day-chart";
import { GuestForm } from "@/components/guest-form";
import { RegisterLines } from "@/components/register-lines";
import { ModeBadge } from "@/components/mode-badge";
import { StayToggle } from "@/components/stay-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGate } from "@/components/security-gate";
import { buildDayTake } from "@/lib/day-report";
import { formatDay, formatDayShort, money } from "@/lib/format";
import { printHtmlDocument } from "@/lib/print-sheet";
import { stayDates } from "@/lib/stay";
import { useLedger, useDayBooks } from "@/lib/store";
import type { DayBooks, GuestEntry, ModeAmount, NamedAmount } from "@/lib/types";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const date = useLedger((s) => s.selectedDate);
  const allGuests = useLedger((s) => s.guests);
  const allFood = useLedger((s) => s.food);
  const allWs = useLedger((s) => s.wholesale);
  const allExp = useLedger((s) => s.expenses);
  const allRecv = useLedger((s) => s.balReceived);
  const hotel = useLedger((s) => s.hotel);
  const books = useDayBooks(date);
  const guests = allGuests.filter((g) => g.date === date);
  const food = allFood.filter((f) => f.date === date);
  const ws = allWs.filter((w) => w.date === date);
  const expenses = allExp.filter((e) => e.date === date);
  const receipts = allRecv.filter((r) => r.date === date);
  const take = buildDayTake(guests, food, ws);
  const removeGuest = useLedger((s) => s.removeGuest);
  const setStay = useLedger((s) => s.setStay);
  const { gate } = useGate();
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setEditingId(null);
  }, [date]);

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
          {guests.length} postings · {money(take.roomsTotal)} room revenue
        </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button asChild variant="outline">
            <Link to="/reports">Daily report</Link>
          </Button>
        </div>
        </div>

      <Tabs defaultValue="register" className="flex flex-col gap-5">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="detail">Detail report</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="mt-0 flex flex-col gap-5">
      <GuestForm
        editing={editing}
        onCancelEdit={() => setEditingId(null)}
      />

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
                    <StayToggle
                      stay={g.stay}
                      onChange={(stay) =>
                        gate(
                          () => setStay(g.id, stay),
                          {
                            title: "Are you sure?",
                            message:
                              stay === "out"
                                ? `Check out ${g.name} from room ${g.roomNo}?`
                                : `Continue ${g.name} to the next day?`,
                          },
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 min-h-9 text-muted hover:text-primary"
                        aria-label={`Edit ${g.name}`}
                        onClick={() => setEditingId(g.id)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 min-h-9 text-muted hover:text-danger"
                        aria-label={`Remove ${g.name}`}
                        onClick={() =>
                          gate(
                            () => {
                              if (editingId === g.id) setEditingId(null);
                              removeGuest(g.id);
                              toast.success(`Removed ${g.name}`);
                            },
                            {
                              title: "Are you sure?",
                              message: `Delete ${g.name} · Room ${g.roomNo}? This cannot be undone.`,
                              confirmLabel: "Delete",
                              danger: true,
                            },
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
        </TabsContent>

        <TabsContent value="detail" className="mt-0">
          <DetailReport
            date={date}
            hotel={hotel.name}
            blessing={hotel.blessing}
            guests={guests}
            allGuests={allGuests}
            food={food}
            ws={ws}
            expenses={expenses}
            receipts={receipts}
            books={books}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailReport({
  date,
  hotel,
  blessing,
  guests,
  allGuests,
  food,
  ws,
  expenses,
  receipts,
  books,
}: {
  date: string;
  hotel: string;
  blessing: string;
  guests: GuestEntry[];
  allGuests: GuestEntry[];
  food: ModeAmount[];
  ws: ModeAmount[];
  expenses: NamedAmount[];
  receipts: NamedAmount[];
  books?: DayBooks;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end print:hidden">
        <Button
          type="button"
          onClick={() => {
            const el = document.getElementById("day-chart");
            if (!el) {
              toast.error("Report is not ready");
              return;
            }
            toast.message("Opening print…");
            printHtmlDocument("Day chart", el.outerHTML);
          }}
        >
          <Printer className="size-4" />
          Print
        </Button>
      </div>
      <DayChart
        hotel={hotel}
        blessing={blessing}
        date={date}
        guests={guests}
        allGuests={allGuests}
        food={food}
        ws={ws}
        expenses={expenses}
        receipts={receipts}
        books={books}
      />
    </div>
  );
}

