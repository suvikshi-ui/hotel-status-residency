import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO, isValid } from "date-fns";
import { Download, Landmark, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { useGate } from "@/components/security-gate";
import {
  bankRowsFromPdf,
  downloadBankStatementPdf,
  mergeBankRows,
  parseStatementText,
  pkMovesForMonth,
  reconcileBank,
  type BankRow,
} from "@/lib/bank-recon";
import { formatDayShort, money } from "@/lib/format";
import { englishNarration } from "@/lib/english-narration";
import { isDayLocked } from "@/lib/register-lock";
import { useLedger } from "@/lib/store";
import { canWrite } from "@/lib/roles";
import { GuardedPkRef } from "@/components/pk-ref";

export const Route = createFileRoute("/bank-recon")({
  component: BankReconPage,
});

function BankReconPage() {
  const date = useLedger((s) => s.selectedDate);
  const guests = useLedger((s) => s.guests);
  const food = useLedger((s) => s.food);
  const wholesale = useLedger((s) => s.wholesale);
  const expenses = useLedger((s) => s.expenses);
  const receipts = useLedger((s) => s.balReceived);
  const bankRows = useLedger((s) => s.bankRows);
  const setBankRows = useLedger((s) => s.setBankRows);
  const setLineRef = useLedger((s) => s.setLineRef);
  const lockedDates = useLedger((s) => s.lockedDates);
  const setDate = useLedger((s) => s.setDate);
  const { busy: saving, saveToServer } = useAccountSave();
  const write = canWrite(useLedger((s) => s.appRole));
  const { gate } = useGate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const months = useMemo(
    () =>
      [...new Set(bankRows.map((row) => row.month))]
        .filter((key) => /^\d{4}-\d{2}$/.test(key))
        .sort(),
    [bankRows],
  );
  const liveMonth = date.slice(0, 7);
  const month =
    picked && months.includes(picked)
      ? picked
      : months.includes(liveMonth)
        ? liveMonth
        : (months[months.length - 1] ?? liveMonth);
  const monthLabel = (() => {
    const d = parseISO(`${month}-01`);
    return isValid(d) ? format(d, "MMMM yyyy") : month;
  })();
  const monthRows = useMemo(
    () => bankRows.filter((r) => r.month === month),
    [bankRows, month],
  );
  const lines = useMemo(
    () => reconcileBank(monthRows, guests, { food, wholesale, expenses, receipts }),
    [monthRows, guests, food, wholesale, expenses, receipts],
  );
  const pkMoves = useMemo(
    () => pkMovesForMonth({ month, guests, food, wholesale, expenses, receipts }),
    [month, guests, food, wholesale, expenses, receipts],
  );
  const pkIn = pkMoves.filter((row) => row.side === "in").reduce((sum, row) => sum + row.amount, 0);
  const pkOut = pkMoves.filter((row) => row.side === "out").reduce((sum, row) => sum + row.amount, 0);

  function applyParsed(parsed: BankRow[]) {
    if (!parsed.length) {
      toast.error("No statement rows found in that file");
      return;
    }
    gate(
      () => {
        const months = new Set(parsed.map((row) => row.month).filter(Boolean));
        const kept = bankRows.filter((row) => !months.has(row.month));
        setBankRows(mergeBankRows(kept, parsed));
        const first = parsed.find((row) => row.date)?.date;
        if (first) setDate(first);
        const savedMonth = parsed.find((row) => row.month)?.month;
        if (savedMonth) setPicked(savedMonth);
        toast.success(`${parsed.length} rows ready in the chart`);
      },
      {
        title: "Upload this bank statement?",
        message: `${parsed.length} rows. Date, narration, Chq/Ref, withdrawal and deposit only.`,
        confirmLabel: "Upload",
      },
    );
  }

  async function onFile(file: File) {
    setBusy(true);
    try {
      const name = file.name.toLowerCase();
      if (name.endsWith(".pdf") || file.type === "application/pdf") {
        applyParsed(await bankRowsFromPdf(await file.arrayBuffer(), password));
        return;
      }
      applyParsed(parseStatementText(await file.text(), month));
    } catch (err) {
      const msg = err instanceof Error && err.message
        ? err.message
        : "Could not read this statement";
      toast.error(msg);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function downloadStatement() {
    if (!lines.length) {
      toast.error("Upload a statement first");
      return;
    }
    await downloadBankStatementPdf({
      title: `Bank statement · ${monthLabel}`,
      fileName: `bank-statement-${month}.pdf`,
      lines: lines.map((line) => ({
        date: line.bank.dateRaw || "—",
        narration: englishNarration(line.bank.particular) || "—",
        ref: line.bank.ref || "—",
        withdrawal: line.bank.debit
          ? Math.round(line.bank.debit).toLocaleString("en-IN")
          : "—",
        deposit: line.bank.credit
          ? Math.round(line.bank.credit).toLocaleString("en-IN")
          : "—",
        officeDate: line.office ? formatDayShort(line.office.date) : "—",
        name: line.office?.name || "—",
        reason: line.office?.reason ? englishNarration(line.office.reason) : "—",
      })),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Accounts
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Bank recon
          </h1>
          <p className="mt-1 text-sm text-muted">
            Journal from the bank statement. Save keeps that month as a cube.
            Open the cube any time — office date, name and reason update when a
            P.K. QR reference matches. Download is one landscape PDF page.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {write ? (
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted">
              Statement password
            </span>
            <Input
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="If the file is locked"
              className="w-44"
              aria-label="Statement password"
            />
          </label>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.pdf,text/csv,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
          {write ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
            {busy ? "Reading…" : "Upload statement"}
          </Button>
          ) : null}
          <Button
            type="button"
            disabled={!monthRows.length || busy}
            onClick={() => void downloadStatement()}
          >
            <Download className="size-4" />
            Download
          </Button>
          {write ? (
          <SaveCube
            busy={saving}
            onSave={() => {
              if (monthRows.length) setPicked(month);
              return saveToServer();
            }}
          />
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {months.map((key) => {
          const d = parseISO(`${key}-01`);
          const label = isValid(d) ? format(d, "MMMM yyyy") : key;
          return (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={key === month ? "default" : "outline"}
              onClick={() => setPicked(key)}
            >
              {label}
            </Button>
          );
        })}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => document.getElementById("pk-qr")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          P.K. QR
        </Button>
      </div>

      <Card id="pk-qr">
        <CardHeader>
          <CardTitle>P.K. QR · {monthLabel}</CardTitle>
          <p className="text-sm text-muted">
            Every payment in and out through P.K. QR this month. A reference saved here is the same reference on the register. It does not change the amount.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border bg-bg-warm/50">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Reason</th>
                <th className="px-3 py-2 text-right font-medium">In</th>
                <th className="px-3 py-2 text-right font-medium">Out</th>
                <th className="px-3 py-2 font-medium">Reference number</th>
              </tr>
            </thead>
            <tbody>
              {pkMoves.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="border-b border-border/70">
                  <td className="px-5 py-2.5 tabular">{formatDayShort(row.date)}</td>
                  <td className="px-3 py-2.5 font-medium">{row.name || "—"}</td>
                  <td className="px-3 py-2.5">{englishNarration(row.reason) || row.reason}</td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {row.side === "in" ? money(row.amount) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {row.side === "out" ? money(row.amount) : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {write ? (
                      <GuardedPkRef
                        locked={isDayLocked(lockedDates, row.date)}
                        value={row.ref}
                        onSave={(ref, bypass) =>
                          setLineRef(row.kind, row.id, ref, bypass ? { bypass: true } : undefined)
                        }
                      />
                    ) : (
                      <span className="text-sm tabular">{row.ref || "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-bg-warm/50 font-semibold">
                <td className="px-5 py-2.5" colSpan={3}>
                  {monthLabel} total
                </td>
                <td className="px-3 py-2.5 text-right tabular">{money(pkIn)}</td>
                <td className="px-3 py-2.5 text-right tabular">{money(pkOut)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
          {pkMoves.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No P.K. QR payments this month.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-4" />
            {monthRows.length
              ? `${monthLabel} · ${monthRows.length} rows`
              : "Journal entries"}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[72rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border bg-bg-warm/50">
                <th className="px-5 py-2 font-medium" colSpan={5}>
                  Bank statement
                </th>
                <th className="px-3 py-2 font-medium" colSpan={3}>
                  Office
                </th>
              </tr>
              <tr className="border-b border-border bg-bg-warm/50">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Narration</th>
                <th className="px-3 py-2 font-medium">Ch./Ref. no.</th>
                <th className="px-3 py-2 text-right font-medium">Withdrawal</th>
                <th className="px-3 py-2 text-right font-medium">Deposit</th>
                <th className="px-3 py-2 font-medium">Office date</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.bank.id} className="border-b border-border/70">
                  <td className="px-5 py-2.5 tabular">
                    {line.bank.dateRaw || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {englishNarration(line.bank.particular) || "—"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {line.bank.ref || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {line.bank.debit ? money(line.bank.debit) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {line.bank.credit ? money(line.bank.credit) : "—"}
                  </td>
                  {line.office ? (
                    <>
                      <td className="px-3 py-2.5 tabular">
                        {formatDayShort(line.office.date)}
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        {line.office.name}
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        {line.office.reason ? englishNarration(line.office.reason) : "—"}
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-2.5 text-muted" colSpan={3}>
                      —
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {monthRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              Upload a statement to fill this chart.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
