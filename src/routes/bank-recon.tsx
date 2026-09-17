import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Landmark, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { useGate } from "@/components/security-gate";
import {
  dcOf,
  mergeBankRows,
  parseStatementText,
  reconcileBank,
  statementTextFromPdf,
  type BankRow,
} from "@/lib/bank-recon";
import { formatDayShort, money } from "@/lib/format";
import { useLedger } from "@/lib/store";

export const Route = createFileRoute("/bank-recon")({
  component: BankReconPage,
});

function BankReconPage() {
  const date = useLedger((s) => s.selectedDate);
  const guests = useLedger((s) => s.guests);
  const bankRows = useLedger((s) => s.bankRows);
  const setBankRows = useLedger((s) => s.setBankRows);
  const { busy: saving, saveToServer } = useAccountSave();
  const { gate } = useGate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const month = date.slice(0, 7);
  const monthRows = useMemo(
    () => bankRows.filter((r) => r.month === month),
    [bankRows, month],
  );
  const lines = useMemo(
    () => reconcileBank(monthRows, guests),
    [monthRows, guests],
  );
  const matched = lines.filter((l) => l.office);
  const unmatched = lines.filter((l) => !l.office);
  const debitTotal = monthRows.reduce((s, r) => s + r.debit, 0);
  const creditTotal = monthRows.reduce((s, r) => s + r.credit, 0);

  function applyParsed(parsed: BankRow[]) {
    if (!parsed.length) {
      toast.error("No statement rows found in that file");
      return;
    }
    const months = [...new Set(parsed.map((r) => r.month))];
    gate(
      () => {
        const kept = bankRows.filter((r) => !months.includes(r.month));
        setBankRows(mergeBankRows(kept, parsed));
        toast.success(
          `Uploaded ${parsed.length} bank rows · ${matchedLabel(months)}`,
        );
      },
      {
        title: "Upload this bank statement?",
        message: `${parsed.length} rows will replace ${matchedLabel(months)}.`,
        confirmLabel: "Upload",
      },
    );
  }

  async function onFile(file: File) {
    setBusy(true);
    try {
      const name = file.name.toLowerCase();
      let text = "";
      if (name.endsWith(".pdf") || file.type === "application/pdf") {
        text = await statementTextFromPdf(await file.arrayBuffer(), password);
      } else {
        text = await file.text();
      }
      applyParsed(parseStatementText(text));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read file");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
            Upload only Date, Narration, Ch./Ref. no., Debit and Credit.
            Closing balance is not uploaded.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
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
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
            {busy ? "Reading…" : "Upload statement"}
          </Button>
          <SaveCube busy={saving} onSave={() => void saveToServer()} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Uploaded" value={String(monthRows.length)} />
        <Stat label="Debit" value={money(debitTotal)} />
        <Stat label="Credit" value={money(creditTotal)} />
        <Stat label="Matched" value={String(matched.length)} />
      </div>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-4" />
            {month}
            <Badge variant="ok">{matched.length} matched</Badge>
            {unmatched.length ? (
              <Badge variant="muted">{unmatched.length} later</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[70rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border bg-bg-warm/50">
                <th className="px-5 py-2 font-medium" colSpan={7}>
                  Bank statement
                </th>
                <th className="px-3 py-2 font-medium" colSpan={2}>
                  Entry in office
                </th>
              </tr>
              <tr className="border-b border-border">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Narration</th>
                <th className="px-3 py-2 font-medium">Ch./Ref. no.</th>
                <th className="px-3 py-2 font-medium">D/C</th>
                <th className="px-3 py-2 text-right font-medium">Amount Debited</th>
                <th className="px-3 py-2 text-right font-medium">Amount Credited</th>
                <th className="px-3 py-2 font-medium">Yes/No</th>
                <th className="px-3 py-2 font-medium">Office date</th>
                <th className="px-3 py-2 font-medium">Office entry</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const side = dcOf(line.bank);
                return (
                <tr key={line.bank.id} className="border-b border-border/70">
                  <td className="px-5 py-2.5 tabular text-muted">
                    {formatDayShort(line.bank.date)}
                  </td>
                  <td className="px-3 py-2.5">{line.bank.particular || "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {line.bank.ref || "—"}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{side || "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {line.bank.debit ? money(line.bank.debit) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {line.bank.credit ? money(line.bank.credit) : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={line.office ? "ok" : "muted"}>
                      {line.office ? "Yes" : "No"}
                    </Badge>
                  </td>
                  {line.office ? (
                    <>
                      <td className="px-3 py-2.5 tabular">
                        {formatDayShort(line.office.date)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium">{line.office.name}</div>
                        <div className="text-xs text-muted">
                          {line.office.source || line.office.ref}
                        </div>
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-2.5 text-muted" colSpan={2}>
                      —
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
            {lines.length ? (
              <tfoot>
                <tr className="border-t border-border bg-bg-warm/40 font-medium">
                  <td className="px-5 py-2.5" colSpan={4}>
                    Total
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {money(debitTotal)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {money(creditTotal)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            ) : null}
          </table>
          {lines.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              Upload this month's bank statement. CSV, TXT or PDF.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold tabular">
        {value}
      </div>
    </Card>
  );
}

function matchedLabel(months: string[]) {
  return months.join(", ") || "statement";
}
