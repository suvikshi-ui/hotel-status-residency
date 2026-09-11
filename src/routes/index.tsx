import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, BedDouble, UtensilsCrossed, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeBadge } from "@/components/mode-badge";
import { Button } from "@/components/ui/button";
import { formatDayShort, money, moneyCompact, normRoom } from "@/lib/format";
import { useLedger, useDayBooks } from "@/lib/store";
import { HotelLogo } from "@/components/hotel-logo";

export const Route = createFileRoute("/")({ component: Overview });

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warn" | "muted";
}) {
  const color =
    tone === "ok" ? "text-ok" : tone === "warn" ? "text-due" : "text-fg";
  return (
    <Card className="p-4 md:p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className={`mt-2 font-display text-2xl font-semibold tabular tracking-tight md:text-3xl ${color}`}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </Card>
  );
}

function Overview() {
  const date = useLedger((s) => s.selectedDate);
  const days = useLedger((s) => s.days);
  const allGuests = useLedger((s) => s.guests);
  const rooms = useLedger((s) => s.rooms);
  const hotel = useLedger((s) => s.hotel);
  const guests = allGuests.filter((g) => g.date === date);
  const books = useDayBooks(date);
  const occSet = new Set(guests.map((g) => normRoom(g.roomNo)));
  const occupied = rooms.filter((r) => occSet.has(normRoom(r.no))).length;
  const occPct = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;
  const sales = books?.mix.totals.sale ?? 0;
  const vsTarget = sales - hotel.dailyTarget;
  const monthSales = days.reduce((s, d) => s + d.mix.totals.sale, 0);
  const monthFood = days.reduce((s, d) => s + d.mix.totals.food, 0);
  const chart = days.map((d) => ({
    date: formatDayShort(d.date),
    iso: d.date,
    sales: d.mix.totals.sale,
    target: hotel.dailyTarget,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Night audit
          </p>
          <div className="mt-1 flex items-center gap-3">
            <HotelLogo mark className="h-12 w-auto shrink-0" />
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {hotel.name}
            </h1>
          </div>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Daily occupancy, sales and night audit — start posting from today.
          </p>
        </div>
        <Button asChild>
          <Link to="/register">Post a guest</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Room sales"
          value={money(sales)}
          hint={
            vsTarget >= 0
              ? `${money(vsTarget)} over ₹60,000 target`
              : `${money(Math.abs(vsTarget))} under target`
          }
          tone={vsTarget >= 0 ? "ok" : "warn"}
        />
        <Kpi
          label="Occupancy"
          value={`${occupied}/${rooms.length}`}
          hint={`${occPct}% of house · ${guests.length} postings`}
        />
        <Kpi
          label="Cash in hand"
          value={money(books?.cashBook.cb ?? 0)}
          hint={`Food ${money(books?.mix.totals.food ?? 0)} · WS ${money(books?.mix.totals.ws ?? 0)}`}
        />
        <Kpi
          label="Outstanding"
          value={money(books?.outstanding.cb ?? 0)}
          hint={`${money(books?.outstanding.sales ?? 0)} new dues today`}
          tone="warn"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-end justify-between">
          <div>
            <CardTitle>Room sales</CardTitle>
            <p className="text-sm text-muted">
              Month to date {money(monthSales)} · food {money(monthFood)} · daily
              target {money(hotel.dailyTarget)}
            </p>
          </div>
          <Link
            to="/reports"
            search={{ view: "month" }}
            className="hidden items-center gap-1 text-sm text-primary md:inline-flex"
          >
            Full report <ArrowUpRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent className="h-56 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1f5c54" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#1f5c54" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ddd4c2" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6f675c", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                tickFormatter={(v) => moneyCompact(Number(v))}
                tick={{ fill: "#6f675c", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                formatter={(v: number) => money(v)}
                contentStyle={{
                  background: "#faf6ee",
                  border: "1px solid #ddd4c2",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#c4b8a1"
                strokeDasharray="4 4"
                fill="none"
                name="Target"
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#1f5c54"
                strokeWidth={2}
                fill="url(#salesFill)"
                name="Sales"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-5">
        {[
          { label: "Cash", value: books?.cashBook.cb, icon: Wallet },
          { label: "Santosh QR", value: books?.santosh.cb, icon: Wallet },
          { label: "P.K. QR", value: books?.pk.cb, icon: Wallet },
          { label: "Online", value: books?.online.cb, icon: BedDouble },
          { label: "Balance", value: books?.outstanding.cb, icon: UtensilsCrossed },
        ].map((row) => (
          <Card key={row.label} className="p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted">
              {row.label}
            </div>
            <div className="mt-2 font-display text-xl font-semibold tabular">
              {money(row.value ?? 0)}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Today's register</CardTitle>
          <Link to="/register" className="text-sm text-primary">
            Open register
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-muted">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Guest</th>
                <th className="py-2 pr-3 font-medium">Room</th>
                <th className="py-2 pr-3 font-medium">Mode</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {guests.slice(0, 12).map((g) => (
                <tr key={g.id} className="border-b border-border/70">
                  <td className="py-2.5 pr-3 tabular text-muted">{g.slNo}</td>
                  <td className="py-2.5 pr-3 font-medium">{g.name}</td>
                  <td className="py-2.5 pr-3 tabular">{g.roomNo}</td>
                  <td className="py-2.5 pr-3">
                    <ModeBadge mode={g.mode} />
                  </td>
                  <td className="py-2.5 text-right tabular">{money(g.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {guests.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No postings this day.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
