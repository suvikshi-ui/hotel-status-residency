import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addMonths, endOfMonth, format, parseISO } from "date-fns";
import { Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeBadge } from "@/components/mode-badge";
import { useGate } from "@/components/security-gate";
import { formatDayShort, money } from "@/lib/format";
import { buildGstStayBills, buildRegisterStays, type GstStayBill } from "@/lib/invoice";
import { escapeHtml, printDocument } from "@/lib/print-sheet";
import { useLedger } from "@/lib/store";

export const Route = createFileRoute("/invoice")({ component: InvoicePage });

function InvoicePage() {
  const date = useLedger((s) => s.selectedDate);
  const hotel = useLedger((s) => s.hotel);
  const guests = useLedger((s) => s.guests);
  const receipts = useLedger((s) => s.balReceived);
  const updateGuest = useLedger((s) => s.updateGuest);
  const { gate } = useGate();
  const [month, setMonth] = useState(date.slice(0, 7));
  const [nameQ, setNameQ] = useState("");
  const [sourceQ, setSourceQ] = useState("");
  const monthStart = `${month}-01`;
  const monthEnd = format(endOfMonth(parseISO(monthStart)), "yyyy-MM-dd");
  const inMonth = (row: GstStayBill) => row.checkIn <= monthEnd && row.checkOut >= monthStart;
  const gstRows = useMemo(
    () => buildGstStayBills(guests, receipts).filter(inMonth),
    [guests, receipts, monthStart, monthEnd],
  );
  const registerRows = useMemo(
    () => buildRegisterStays(guests, receipts).filter(inMonth),
    [guests, receipts, monthStart, monthEnd],
  );
  const gstFiltered = useMemo(
    () => filterBills(gstRows, nameQ, sourceQ),
    [gstRows, nameQ, sourceQ],
  );
  const registerFiltered = useMemo(
    () => filterBills(registerRows, nameQ, sourceQ),
    [registerRows, nameQ, sourceQ],
  );
  const gstTotal = gstFiltered.reduce((s, b) => s + b.amount, 0);
  const registerTotal = registerFiltered.reduce((s, b) => s + b.amount, 0);

  function saveField(id: string, field: "gstInvoiceNo" | "payRefNo", value: string) {
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

  function printRegister() {
    const body = `<table>
      <thead><tr>
        <th>Check-in</th><th>Check-out</th><th>Name</th><th>Company / source</th>
        <th>Room</th><th>Mode</th><th class="num">Nights</th><th class="num">Amount</th>
        <th>GST invoice number</th><th>Payment reference number</th>
      </tr></thead>
      <tbody>
        ${registerFiltered
          .map(
            (b) => `<tr>
              <td>${escapeHtml(formatDayShort(b.checkIn))}</td>
              <td>${escapeHtml(formatDayShort(b.checkOut))}</td>
              <td>${escapeHtml(b.name)}</td>
              <td>${escapeHtml(b.source || "—")}</td>
              <td>${escapeHtml(b.roomNo)}</td>
              <td>${escapeHtml(b.mode)}</td>
              <td class="num">${b.nights}</td>
              <td class="num">${money(b.amount)}</td>
              <td>${escapeHtml(b.gstInvoiceNo || "—")}</td>
              <td>${escapeHtml(b.payRefNo || "—")}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>`;
    printDocument({
      title: "Register",
      heading: hotel.name,
      sub: `${hotel.place} · ${format(parseISO(monthStart), "MMMM yyyy")} · 1 to ${format(parseISO(monthEnd), "d")}`,
      table: body,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Books</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Invoice</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, -1))}>
            Previous
          </Button>
          <span className="min-w-36 text-center text-sm font-semibold">
            {format(parseISO(monthStart), "MMMM yyyy")}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, 1))}>
            Next
          </Button>
        </div>
      </div>

      <Tabs defaultValue="gst">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gst">GST invoice</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        <TabsContent value="gst" className="flex flex-col gap-5">
          <p className="text-sm text-muted">One GST invoice number from check-in to check-out.</p>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-xs font-medium text-muted">GST stays</div>
              <div className="mt-1 font-display text-2xl font-semibold tabular">{gstFiltered.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs font-medium text-muted">GST total</div>
              <div className="mt-1 font-display text-2xl font-semibold tabular">{money(gstTotal)}</div>
            </Card>
          </div>
          <BillCard
            title="GST invoice"
            badge="GST"
            rows={gstFiltered}
            empty={gstRows.length === 0 ? "No GST stays this month." : "No bill matches this name or company."}
            nameQ={nameQ}
            sourceQ={sourceQ}
            onName={setNameQ}
            onSource={setSourceQ}
            editable
            onSave={saveField}
          />
        </TabsContent>

        <TabsContent value="register" className="flex flex-col gap-5">
          <p className="text-sm text-muted">
            {format(parseISO(monthStart), "d MMM")} to {format(parseISO(monthEnd), "d MMM yyyy")} · full register
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-xs font-medium text-muted">Stays</div>
              <div className="mt-1 font-display text-2xl font-semibold tabular">{registerFiltered.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs font-medium text-muted">Register total</div>
              <div className="mt-1 font-display text-2xl font-semibold tabular">{money(registerTotal)}</div>
            </Card>
          </div>
          <BillCard
            title="Register"
            rows={registerFiltered}
            empty={
              registerRows.length === 0
                ? "No register stays this month."
                : "No stay matches this name or company."
            }
            nameQ={nameQ}
            sourceQ={sourceQ}
            onName={setNameQ}
            onSource={setSourceQ}
            onPrint={printRegister}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function shiftMonth(month: string, by: number) {
  return format(addMonths(parseISO(`${month}-01`), by), "yyyy-MM");
}

function filterBills(rows: GstStayBill[], nameQ: string, sourceQ: string) {
  const name = nameQ.trim().toLowerCase();
  const source = sourceQ.trim().toLowerCase();
  return rows.filter((b) => {
    if (name && !b.name.toLowerCase().includes(name)) return false;
    if (source && !b.source.toLowerCase().includes(source)) return false;
    return true;
  });
}

function BillCard({
  title,
  badge,
  rows,
  empty,
  nameQ,
  sourceQ,
  onName,
  onSource,
  editable,
  onSave,
  onPrint,
}: {
  title: string;
  badge?: string;
  rows: GstStayBill[];
  empty: string;
  nameQ: string;
  sourceQ: string;
  onName: (value: string) => void;
  onSource: (value: string) => void;
  editable?: boolean;
  onSave?: (id: string, field: "gstInvoiceNo" | "payRefNo", value: string) => void;
  onPrint?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2">
          {title}
          {badge ? <Badge variant="ok">{badge}</Badge> : null}
        </CardTitle>
        <div className="grid w-full gap-2 sm:grid-cols-3 md:w-[36rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder="Filter name"
              value={nameQ}
              onChange={(e) => onName(e.target.value)}
              aria-label="Filter by name"
            />
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder="Filter company / source"
              value={sourceQ}
              onChange={(e) => onSource(e.target.value)}
              aria-label="Filter by company or source"
            />
          </div>
          {onPrint ? (
            <Button type="button" variant="outline" onClick={onPrint}>
              <Printer className="size-4" />
              Print
            </Button>
          ) : (
            <span />
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[64rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr className="border-y border-border">
              <th className="px-5 py-2 font-medium">Check-in</th>
              <th className="px-3 py-2 font-medium">Check-out</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Company / source</th>
              <th className="px-3 py-2 font-medium">Room</th>
              <th className="px-3 py-2 font-medium">Mode</th>
              <th className="px-3 py-2 text-right font-medium">Nights</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">GST invoice number</th>
              <th className="px-3 py-2 font-medium">Payment reference number</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-border/70">
                <td className="px-5 py-2.5 tabular text-muted">{formatDayShort(b.checkIn)}</td>
                <td className="px-3 py-2.5 tabular text-muted">{formatDayShort(b.checkOut)}</td>
                <td className="px-3 py-2.5 font-medium">{b.name}</td>
                <td className="px-3 py-2.5 text-muted">{b.source || "—"}</td>
                <td className="px-3 py-2.5 tabular">{b.roomNo}</td>
                <td className="px-3 py-2.5">
                  <ModeBadge mode={b.mode} />
                </td>
                <td className="px-3 py-2.5 text-right tabular">{b.nights}</td>
                <td className="px-3 py-2.5 text-right tabular">{money(b.amount)}</td>
                <td className="px-3 py-2">
                  {editable && onSave ? (
                    <InvoiceCell
                      value={b.gstInvoiceNo}
                      placeholder="Invoice no."
                      ariaLabel={`GST invoice number for ${b.name}`}
                      onCommit={(v) => onSave(b.id, "gstInvoiceNo", v)}
                    />
                  ) : (
                    b.gstInvoiceNo || "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  {editable && onSave ? (
                    <InvoiceCell
                      value={b.payRefNo}
                      placeholder="Payment ref."
                      ariaLabel={`Payment reference for ${b.name}`}
                      onCommit={(v) => onSave(b.id, "payRefNo", v)}
                    />
                  ) : (
                    b.payRefNo || "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="py-10 text-center text-sm text-muted">{empty}</p> : null}
      </CardContent>
    </Card>
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