import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeBadge } from "@/components/mode-badge";
import { formatDayShort, money } from "@/lib/format";
import { useLedger } from "@/lib/store";
import type { GuestEntry } from "@/lib/types";

export const Route = createFileRoute("/invoice")({ component: InvoicePage });

function InvoicePage() {
  const date = useLedger((s) => s.selectedDate);
  const guests = useLedger((s) => s.guests);
  const month = date.slice(0, 7);
  const monthRows = useMemo(
    () =>
      guests
        .filter((g) => g.date.startsWith(month))
        .slice()
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            a.slNo - b.slNo ||
            a.name.localeCompare(b.name),
        ),
    [guests, month],
  );
  const gstRows = monthRows.filter((g) => g.gst);
  const nonGstRows = monthRows.filter((g) => !g.gst);
  const gstTotal = gstRows.reduce((s, g) => s + g.amount, 0);
  const nonGstTotal = nonGstRows.reduce((s, g) => s + g.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Register
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Invoice
        </h1>
        <p className="mt-1 text-sm text-muted">
          New postings land here. Default Non GST. Tick GST on Register to put
          the bill in the GST column.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">Non GST</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(nonGstTotal)}
          </div>
          <p className="mt-1 text-xs text-muted">{nonGstRows.length} bills</p>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">GST</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(gstTotal)}
          </div>
          <p className="mt-1 text-xs text-muted">{gstRows.length} bills</p>
        </Card>
        <Card className="col-span-2 p-4 lg:col-span-1">
          <div className="text-xs font-medium text-muted">Month total</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(nonGstTotal + gstTotal)}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <BillColumn title="Non GST" rows={nonGstRows} gst={false} />
        <BillColumn title="GST" rows={gstRows} gst />
      </div>
    </div>
  );
}

function BillColumn({
  title,
  rows,
  gst,
}: {
  title: string;
  rows: GuestEntry[];
  gst: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant={gst ? "ok" : "muted"}>{title}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr className="border-y border-border">
              <th className="px-5 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Room</th>
              <th className="px-3 py-2 font-medium">Mode</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id} className="border-b border-border/70">
                <td className="px-5 py-2.5 tabular text-muted">
                  {formatDayShort(g.date)}
                </td>
                <td className="px-3 py-2.5 font-medium">{g.name}</td>
                <td className="px-3 py-2.5 tabular">{g.roomNo}</td>
                <td className="px-3 py-2.5">
                  <ModeBadge mode={g.mode} />
                </td>
                <td className="px-3 py-2.5 text-right tabular">
                  {money(g.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No {title} bills this month.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
