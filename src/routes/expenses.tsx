import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeBadge } from "@/components/mode-badge";
import { GuardedPkRef } from "@/components/pk-ref";
import { EXPENSE_DESKS, expenseDesk, sumByDay, sumByHead, sumByMode } from "@/lib/expense-tally";
import { formatDayShort, money } from "@/lib/format";
import { isDayLocked } from "@/lib/register-lock";
import { useLedger } from "@/lib/store";
import { ReportsLink } from "@/components/reports-link";

export const Route = createFileRoute("/expenses")({ component: ExpensesPage });

function ExpensesPage() {
  const date = useLedger((s) => s.selectedDate);
  const all = useLedger((s) => s.expenses);
  const setLineRef = useLedger((s) => s.setLineRef);
  const lockedDates = useLedger((s) => s.lockedDates);
  const month = date.slice(0, 7);
  const monthRows = useMemo(
    () => all.filter((e) => e.date.startsWith(month)),
    [all, month],
  );
  const monthTotal = monthRows.reduce((s, e) => s + e.amount, 0);
  const [desk, setDesk] = useState<string>("all");
  const shown = useMemo(
    () =>
      desk === "all" ? monthRows : monthRows.filter((row) => expenseDesk(row.particular) === desk),
    [desk, monthRows],
  );
  const shownTotal = shown.reduce((s, e) => s + e.amount, 0);
  const byHead = useMemo(() => sumByHead(shown), [shown]);
  const byDay = useMemo(() => sumByDay(shown), [shown]);
  const byMode = useMemo(() => sumByMode(monthRows), [monthRows]);
  const sorted = useMemo(
    () =>
      [...shown].sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.particular.localeCompare(b.particular),
      ),
    [shown],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Monthly sheet
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-muted">
            {monthRows.length} entries · {byHead.length} heads · post from Register
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <ReportsLink view="month" />
          <Button variant="outline" className="print:hidden" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Month total</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(monthTotal)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Cash</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(byMode.CASH)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Santosh QR</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(byMode.QRS)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">P.K. QR</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(byMode.QRPK)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setDesk("all")}
          className={`rounded-2xl border px-4 py-3 text-left ${
            desk === "all" ? "border-[#1f4a3c] bg-[#1f4a3c] text-[#f4faf6]" : "border-border bg-card"
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
            All
          </div>
          <div className="mt-1 font-display text-xl font-semibold tabular">{money(monthTotal)}</div>
        </button>
        {EXPENSE_DESKS.map((item) => {
          const amount = monthRows
            .filter((row) => expenseDesk(row.particular) === item.id)
            .reduce((sum, row) => sum + row.amount, 0);
          const on = desk === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setDesk(item.id)}
              className={`rounded-2xl border px-4 py-3 text-left ${
                on ? "border-[#1f4a3c] bg-[#1f4a3c] text-[#f4faf6]" : "border-border bg-card"
              }`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                {item.label}
              </div>
              <div className="mt-1 font-display text-xl font-semibold tabular">{money(amount)}</div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By head — what it was for</CardTitle>
          <p className="text-sm text-muted">
            {desk === "all" ? "Every particular this month" : "This group only"}
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Particular</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-5 py-2 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {byHead.map(([name, amt]) => (
                <tr key={name} className="border-b border-border/70">
                  <td className="px-5 py-2.5 font-medium">{name}</td>
                  <td className="px-3 py-2.5 text-right tabular">{money(amt)}</td>
                  <td className="px-5 py-2.5 text-right tabular text-muted">
                    {shownTotal ? Math.round((amt / shownTotal) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-bg-warm/50 font-semibold">
                <td className="px-5 py-2.5">Total expenses</td>
                <td className="px-3 py-2.5 text-right tabular">{money(shownTotal)}</td>
                <td className="px-5 py-2.5 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Day by day</CardTitle>
          <p className="text-sm text-muted">Each day’s spend, added up</p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[24rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-3 py-2 text-right font-medium">Entries</th>
                <th className="px-5 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {byDay.map(([d, amt]) => (
                <tr key={d} className="border-b border-border/70">
                  <td className="px-5 py-2.5">{formatDayShort(d)}</td>
                  <td className="px-3 py-2.5 text-right tabular text-muted">
                    {shown.filter((e) => e.date === d).length}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular">{money(amt)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-bg-warm/50 font-semibold">
                <td className="px-5 py-2.5">Month</td>
                <td className="px-3 py-2.5 text-right tabular">{shown.length}</td>
                <td className="px-5 py-2.5 text-right tabular">{money(shownTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All entries · {money(shownTotal)}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Particular</th>
                <th className="px-3 py-2 font-medium">Paid by</th>
                <th className="px-3 py-2 font-medium">P.K. ref</th>
                <th className="px-5 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.id} className="border-b border-border/70">
                  <td className="px-5 py-2.5 tabular text-muted">
                    {formatDayShort(e.date)}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{e.particular}</td>
                  <td className="px-3 py-2.5">
                    <ModeBadge mode={e.mode} />
                  </td>
                  <td className="px-3 py-2.5">
                    {e.mode === "QRPK" ? (
                      <GuardedPkRef
                        locked={isDayLocked(lockedDates, e.date)}
                        value={e.payRef}
                        onSave={(ref, bypass) =>
                          setLineRef(
                            "expense",
                            e.id,
                            ref,
                            bypass ? { bypass: true } : undefined,
                          )
                        }
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular">{money(e.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-bg-warm/50 font-semibold">
                <td className="px-5 py-2.5" colSpan={4}>
                  Total
                </td>
                <td className="px-5 py-2.5 text-right tabular">{money(shownTotal)}</td>
              </tr>
            </tfoot>
          </table>
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No expenses this month.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
