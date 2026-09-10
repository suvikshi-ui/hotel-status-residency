import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { DailyA4 } from "@/components/daily-a4";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildDayTake } from "@/lib/day-report";
import { sumByBucket } from "@/lib/expense-tally";
import { formatDay, formatDayShort, money, moneyCompact } from "@/lib/format";
import { printHtmlDocument } from "@/lib/print-sheet";
import { saveElementJpeg } from "@/lib/save-jpeg";
import { useLedger } from "@/lib/store";
import { useGate } from "@/components/security-gate";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

function ReportsPage() {
  const days = useLedger((s) => s.days);
  const guests = useLedger((s) => s.guests);
  const food = useLedger((s) => s.food);
  const wholesale = useLedger((s) => s.wholesale);
  const expenses = useLedger((s) => s.expenses);
  const jan = useLedger((s) => s.janSales);
  const janFood = useLedger((s) => s.janFood);
  const hotel = useLedger((s) => s.hotel);
  const restore = useLedger((s) => s.restoreSeed);
  const { gate } = useGate();

  const rows = days.map((d) => {
    const take = buildDayTake(
      guests.filter((g) => g.date === d.date),
      food.filter((f) => f.date === d.date),
      wholesale.filter((w) => w.date === d.date),
    );
    const vs = take.roomsTotal - hotel.dailyTarget;
    return { date: d.date, take, vs, hit: take.roomsTotal >= hotel.dailyTarget };
  });

  const febSales = rows.reduce((s, r) => s + r.take.roomsTotal, 0);
  const febFood = rows.reduce((s, r) => s + r.take.foodTotal, 0);
  const febWs = rows.reduce((s, r) => s + r.take.wsTotal, 0);
  const janSales = jan.reduce((s, d) => s + d.sales, 0);
  const janF = janFood.reduce((s, d) => s + d.food, 0);
  const janW = janFood.reduce((s, d) => s + d.ws, 0);
  const daysHit = rows.filter((r) => r.hit).length;
  const cash = rows.reduce((s, r) => s + r.take.cash.rooms, 0);
  const qr = rows.reduce((s, r) => s + r.take.santosh.rooms, 0);
  const pk = rows.reduce((s, r) => s + r.take.pk.rooms, 0);
  const online = rows.reduce((s, r) => s + r.take.online.rooms, 0);
  const due = rows.reduce((s, r) => s + r.take.due.rooms, 0);
  const buckets = sumByBucket(expenses);
  const expTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const expByDay = new Map<string, number>();
  for (const e of expenses) {
    expByDay.set(e.date, (expByDay.get(e.date) ?? 0) + e.amount);
  }
  const foodPlusWs = febFood + febWs;
  const flyskyPlusWs = buckets.flysky + buckets.ws;

  const matchRows = [
    {
      label: "Flysky vs Food",
      leftLabel: "Flysky expense",
      left: buckets.flysky,
      rightLabel: "Food sales",
      right: febFood,
    },
    {
      label: "WS expense vs WS sales",
      leftLabel: "WS expense",
      left: buckets.ws,
      rightLabel: "WS sales",
      right: febWs,
    },
    {
      label: "Flysky + WS vs Food + WS",
      leftLabel: "Flysky + WS expense",
      left: flyskyPlusWs,
      rightLabel: "Food + WS sales",
      right: foodPlusWs,
    },
    {
      label: "Kitchen vs Food",
      leftLabel: "Kitchen expense",
      left: buckets.kitchen,
      rightLabel: "Food sales",
      right: febFood,
    },
  ];

  const compare = [
    { name: "Rooms", Jan: janSales, Feb: febSales },
    { name: "Food", Jan: janF, Feb: febFood },
    { name: "Wholesale", Jan: janW, Feb: febWs },
  ];

  const daily = rows.map((r) => ({
    date: formatDayShort(r.date),
    Cash: r.take.cash.rooms,
    QR: r.take.santosh.rooms,
    PK: r.take.pk.rooms,
    Online: r.take.online.rooms,
    Due: r.take.due.rooms,
  }));

  return (
    <Tabs defaultValue="daily" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Books
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Reports
          </h1>
        </div>
        <TabsList>
          <TabsTrigger value="daily">Daily report</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="daily" className="flex flex-col gap-5">
        <DailyReportPanel />
      </TabsContent>

      <TabsContent value="month" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Month close
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            September report
          </h1>
          <p className="mt-1 text-sm text-muted">
            {daysHit} of {rows.length} days hit the ₹60,000 target
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
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
          <Button type="button" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Feb room sales" value={money(febSales)} hint={`Jan ${money(janSales)}`} />
        <Stat label="Feb food" value={money(febFood)} hint={`Jan ${money(janF)}`} />
        <Stat label="Feb wholesale" value={money(febWs)} hint={`Jan ${money(janW)}`} />
        <Stat
          label="Feb expenses"
          value={money(expTotal)}
          hint={`Flysky ${money(buckets.flysky)} · WS ${money(buckets.ws)}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match — Flysky / Food / WS</CardTitle>
          <p className="text-sm text-muted">
            Flysky against food sales. WS expense against WS sales.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Line</th>
                <th className="px-3 py-2 text-right font-medium">Expense</th>
                <th className="px-3 py-2 text-right font-medium">Sales</th>
                <th className="px-5 py-2 text-right font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {matchRows.map((r) => {
                const diff = r.right - r.left;
                return (
                  <tr key={r.label} className="border-b border-border/70">
                    <td className="px-5 py-2.5">
                      <div className="font-medium">{r.label}</div>
                      <div className="text-xs text-muted">
                        {r.leftLabel} vs {r.rightLabel}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {money(r.left)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {money(r.right)}
                    </td>
                    <td
                      className={`px-5 py-2.5 text-right tabular font-medium ${diff >= 0 ? "text-ok" : "text-due"}`}
                    >
                      {diff >= 0 ? "+" : ""}
                      {money(diff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
        <Mix label="Cash" value={cash} total={febSales} />
        <Mix label="Santosh QR" value={qr} total={febSales} />
        <Mix label="Praween QR" value={pk} total={febSales} />
        <Mix label="Online" value={online} total={febSales} />
        <Mix label="Balance" value={due} total={febSales} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Day-wise book</CardTitle>
          <p className="text-sm text-muted">
            Same split as the Excel — cash, Santosh QR, Praween QR, online, due, food
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-3 py-2 text-right font-medium">Cash</th>
                <th className="px-3 py-2 text-right font-medium">Santosh QR</th>
                <th className="px-3 py-2 text-right font-medium">Praween QR</th>
                <th className="px-3 py-2 text-right font-medium">Online</th>
                <th className="px-3 py-2 text-right font-medium">Balance</th>
                <th className="px-3 py-2 text-right font-medium">Food</th>
                <th className="px-3 py-2 text-right font-medium">WS</th>
                <th className="px-3 py-2 text-right font-medium">Expense</th>
                <th className="px-3 py-2 text-right font-medium">Rooms</th>
                <th className="px-3 py-2 text-right font-medium">vs ₹60k</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className="border-b border-border/70">
                  <td className="px-5 py-2 font-medium">{formatDayShort(r.date)}</td>
                  <td className="px-3 py-2 text-right tabular">{money(r.take.cash.rooms)}</td>
                  <td className="px-3 py-2 text-right tabular">{money(r.take.santosh.rooms)}</td>
                  <td className="px-3 py-2 text-right tabular">{money(r.take.pk.rooms)}</td>
                  <td className="px-3 py-2 text-right tabular">{money(r.take.online.rooms)}</td>
                  <td className="px-3 py-2 text-right tabular">{money(r.take.due.rooms)}</td>
                  <td className="px-3 py-2 text-right tabular">{money(r.take.foodTotal)}</td>
                  <td className="px-3 py-2 text-right tabular">{money(r.take.wsTotal)}</td>
                  <td className="px-3 py-2 text-right tabular">{money(expByDay.get(r.date) ?? 0)}</td>
                  <td className="px-3 py-2 text-right tabular font-medium">
                    {money(r.take.roomsTotal)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular ${r.vs >= 0 ? "text-ok" : "text-due"}`}
                  >
                    {r.vs >= 0 ? "+" : ""}
                    {money(r.vs)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-bg-warm/50 font-semibold">
                <td className="px-5 py-2.5">February</td>
                <td className="px-3 py-2.5 text-right tabular">{money(cash)}</td>
                <td className="px-3 py-2.5 text-right tabular">{money(qr)}</td>
                <td className="px-3 py-2.5 text-right tabular">{money(pk)}</td>
                <td className="px-3 py-2.5 text-right tabular">{money(online)}</td>
                <td className="px-3 py-2.5 text-right tabular">{money(due)}</td>
                <td className="px-3 py-2.5 text-right tabular">{money(febFood)}</td>
                <td className="px-3 py-2.5 text-right tabular">{money(febWs)}</td>
                <td className="px-3 py-2.5 text-right tabular">{money(expTotal)}</td>
                <td className="px-3 py-2.5 text-right tabular">{money(febSales)}</td>
                <td className="px-3 py-2.5 text-right tabular">
                  {money(febSales - hotel.dailyTarget * rows.length)}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>January vs February</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compare}>
              <CartesianGrid stroke="#ddd4c2" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6f675c", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => moneyCompact(Number(v))}
                tick={{ fill: "#6f675c", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                formatter={(v: number) => money(v)}
                contentStyle={{ background: "#faf6ee", border: "1px solid #ddd4c2", borderRadius: 12 }}
              />
              <Legend />
              <Bar dataKey="Jan" fill="#c4b8a1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Feb" fill="#1f5c54" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Daily mix</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <CartesianGrid stroke="#ddd4c2" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#6f675c", fontSize: 10 }} interval={3} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => moneyCompact(Number(v))}
                tick={{ fill: "#6f675c", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                formatter={(v: number) => money(v)}
                contentStyle={{ background: "#faf6ee", border: "1px solid #ddd4c2", borderRadius: 12 }}
              />
              <Legend />
              <Bar dataKey="Cash" stackId="a" fill="#2f6b4f" />
              <Bar dataKey="QR" stackId="a" fill="#1f5c54" />
              <Bar dataKey="PK" stackId="a" fill="#3d5a80" />
              <Bar dataKey="Online" stackId="a" fill="#6f675c" />
              <Bar dataKey="Due" stackId="a" fill="#8a5a22" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </TabsContent>
    </Tabs>
  );
}

function DailyReportPanel() {
  const date = useLedger((s) => s.selectedDate);
  const hotel = useLedger((s) => s.hotel);
  const allGuests = useLedger((s) => s.guests);
  const allFood = useLedger((s) => s.food);
  const allWs = useLedger((s) => s.wholesale);
  const allExp = useLedger((s) => s.expenses);
  const allRecv = useLedger((s) => s.balReceived);
  const days = useLedger((s) => s.days);
  const guests = allGuests.filter((g) => g.date === date);
  const food = allFood.filter((f) => f.date === date);
  const ws = allWs.filter((w) => w.date === date);
  const expenses = allExp.filter((e) => e.date === date);
  const receipts = allRecv.filter(
    (r) => r.date === date && r.kind !== "other",
  );
  const books = days.find((d) => d.date === date);
  const take = buildDayTake(guests, food, ws);

  async function saveJpeg() {
    const el = document.getElementById("daily-a4");
    if (!el) {
      toast.error("Report is not ready");
      return;
    }
    toast.message("Saving JPEG…");
    try {
      await saveElementJpeg(el, `HSR-daily-${date}.jpg`);
      toast.success("JPEG saved");
    } catch {
      toast.error("Could not save JPEG");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted">
          {formatDay(date)} · A4 daily report
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="text-sm font-medium text-primary underline underline-offset-4"
            onClick={() => void saveJpeg()}
          >
            Save as JPEG
          </button>
          <Button
            type="button"
            onClick={() => {
              const el = document.getElementById("daily-a4");
              if (!el) {
                window.print();
                return;
              }
              toast.message("Opening print…");
              printHtmlDocument("Daily report", el.outerHTML);
            }}
          >
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[210mm]">
      <DailyA4
        hotel={hotel.name}
        blessing={hotel.blessing}
        date={date}
        books={books}
        take={take}
        expenses={expenses}
        receipts={receipts}
        guests={guests}
      />
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold tabular">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </Card>
  );
}

function Mix({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold tabular">{money(value)}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-warm">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-xs text-muted">{pct}% of room sales</div>
    </Card>
  );
}
