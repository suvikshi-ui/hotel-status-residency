import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModeBadge } from "@/components/mode-badge";
import { useGate } from "@/components/security-gate";
import { formatDayShort, money } from "@/lib/format";
import { useLedger } from "@/lib/store";

export const Route = createFileRoute("/invoice")({ component: InvoicePage });

function InvoicePage() {
  const date = useLedger((s) => s.selectedDate);
  const guests = useLedger((s) => s.guests);
  const updateGuest = useLedger((s) => s.updateGuest);
  const { gate } = useGate();
  const month = date.slice(0, 7);
  const gstRows = useMemo(
    () =>
      guests
        .filter((g) => g.gst && g.date.startsWith(month))
        .slice()
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            a.slNo - b.slNo ||
            a.name.localeCompare(b.name),
        ),
    [guests, month],
  );
  const gstTotal = gstRows.reduce((s, g) => s + g.amount, 0);

  function saveField(
    id: string,
    field: "gstInvoiceNo" | "payRefNo",
    value: string,
  ) {
    const row = gstRows.find((g) => g.id === id);
    const next = value.trim() || null;
    const prev = (row?.[field] ?? null) || null;
    if (next === prev) return;
    gate(
      () => {
        updateGuest(id, { [field]: next }, { bypass: true });
        toast.success("Invoice updated");
      },
      {
        title: "Save this invoice?",
        message: "Enter the security code to save GST invoice or payment reference.",
        confirmLabel: "Save",
      },
    );
  }

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
          Only GST bills. Tick GST on a new posting and it comes here.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">GST bills</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {gstRows.length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">GST total</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {money(gstTotal)}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            GST
            <Badge variant="ok">GST</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Room</th>
                <th className="px-3 py-2 font-medium">Mode</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">GST invoice number</th>
                <th className="px-3 py-2 font-medium">Payment reference number</th>
              </tr>
            </thead>
            <tbody>
              {gstRows.map((g) => (
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
                  <td className="px-3 py-2">
                    <InvoiceCell
                      value={g.gstInvoiceNo ?? ""}
                      placeholder="Invoice no."
                      ariaLabel={`GST invoice number for ${g.name}`}
                      onCommit={(v) => saveField(g.id, "gstInvoiceNo", v)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <InvoiceCell
                      value={g.payRefNo ?? ""}
                      placeholder="Payment ref."
                      ariaLabel={`Payment reference for ${g.name}`}
                      onCommit={(v) => saveField(g.id, "payRefNo", v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {gstRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No GST bills this month.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceCell({
  value,
  placeholder,
  ariaLabel,
  onCommit,
}: {
  value: string;
  placeholder: string;
  ariaLabel: string;
  onCommit: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => {
    setText(value);
  }, [value]);
  return (
    <Input
      value={text}
      aria-label={ariaLabel}
      placeholder={placeholder}
      autoComplete="off"
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text.trim() === value.trim()) return;
        onCommit(text);
      }}
    />
  );
}
