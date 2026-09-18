import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModeBadge } from "@/components/mode-badge";
import { useGate } from "@/components/security-gate";
import { formatDayShort, money } from "@/lib/format";
import { buildGstStayBills } from "@/lib/invoice";
import { useLedger } from "@/lib/store";

export const Route = createFileRoute("/invoice")({ component: InvoicePage });

function InvoicePage() {
  const date = useLedger((s) => s.selectedDate);
  const guests = useLedger((s) => s.guests);
  const updateGuest = useLedger((s) => s.updateGuest);
  const { gate } = useGate();
  const [nameQ, setNameQ] = useState("");
  const [sourceQ, setSourceQ] = useState("");
  const month = date.slice(0, 7);
  const gstRows = useMemo(
    () =>
      buildGstStayBills(guests).filter(
        (b) => b.checkIn <= `${month}-31` && b.checkOut >= `${month}-01`,
      ),
    [guests, month],
  );
  const filtered = useMemo(() => {
    const name = nameQ.trim().toLowerCase();
    const source = sourceQ.trim().toLowerCase();
    return gstRows.filter((b) => {
      if (name && !b.name.toLowerCase().includes(name)) return false;
      if (source && !b.source.toLowerCase().includes(source)) return false;
      return true;
    });
  }, [gstRows, nameQ, sourceQ]);
  const gstTotal = filtered.reduce((s, b) => s + b.amount, 0);

  function saveField(
    id: string,
    field: "gstInvoiceNo" | "payRefNo",
    value: string,
  ) {
    const row = gstRows.find((b) => b.id === id);
    const next = value.trim() || null;
    const prev = (row?.[field] ?? "") || null;
    if (next === prev) return;
    gate(
      () => {
        updateGuest(id, { [field]: next }, { bypass: true });
        toast.success("Invoice updated for this stay");
      },
      {
        title: "Save this invoice?",
        message:
          "GST invoice number is one for check-in to check-out. Enter the security code to save.",
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
          One GST invoice number from check-in to check-out.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs font-medium text-muted">GST stays</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular">
            {filtered.length}
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
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            GST
            <Badge variant="ok">GST</Badge>
          </CardTitle>
          <div className="grid w-full gap-2 sm:grid-cols-2 md:w-[28rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                className="pl-9"
                placeholder="Filter name"
                value={nameQ}
                onChange={(e) => setNameQ(e.target.value)}
                aria-label="Filter by name"
              />
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                className="pl-9"
                placeholder="Filter source"
                value={sourceQ}
                onChange={(e) => setSourceQ(e.target.value)}
                aria-label="Filter by source"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border">
                <th className="px-5 py-2 font-medium">Check-in</th>
                <th className="px-3 py-2 font-medium">Check-out</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Room</th>
                <th className="px-3 py-2 font-medium">Mode</th>
                <th className="px-3 py-2 text-right font-medium">Nights</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">GST invoice number</th>
                <th className="px-3 py-2 font-medium">Payment reference number</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-border/70">
                  <td className="px-5 py-2.5 tabular text-muted">
                    {formatDayShort(b.checkIn)}
                  </td>
                  <td className="px-3 py-2.5 tabular text-muted">
                    {formatDayShort(b.checkOut)}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{b.name}</td>
                  <td className="px-3 py-2.5 text-muted">{b.source || "—"}</td>
                  <td className="px-3 py-2.5 tabular">{b.roomNo}</td>
                  <td className="px-3 py-2.5">
                    <ModeBadge mode={b.mode} />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">{b.nights}</td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {money(b.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <InvoiceCell
                      value={b.gstInvoiceNo}
                      placeholder="Invoice no."
                      ariaLabel={`GST invoice number for ${b.name}`}
                      onCommit={(v) => saveField(b.id, "gstInvoiceNo", v)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <InvoiceCell
                      value={b.payRefNo}
                      placeholder="Payment ref."
                      ariaLabel={`Payment reference for ${b.name}`}
                      onCommit={(v) => saveField(b.id, "payRefNo", v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              {gstRows.length === 0
                ? "No GST stays this month."
                : "No bill matches this name or source."}
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