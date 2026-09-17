import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Landmark, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { useGate } from "@/components/security-gate";
import {
  STATEMENT_HEADERS,
  mergeBankRows,
  parseStatementText,
  statementChartHtml,
  statementChartRows,
  statementTextFromPdf,
  type BankRow,
} from "@/lib/bank-recon";
import { money } from "@/lib/format";
import { useLedger } from "@/lib/store";

export const Route = createFileRoute("/bank-recon")({
  component: BankReconPage,
});

function BankReconPage() {
  const date = useLedger((s) => s.selectedDate);
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

  function applyParsed(parsed: BankRow[]) {
    if (!parsed.length) {
      toast.error("No statement rows found in that file");
      return;
    }
    gate(
      () => {
        const kept = bankRows.filter((r) => r.month !== month);
        setBankRows(mergeBankRows(kept, parsed, month));
        toast.success(`${parsed.length} rows ready in the chart`);
      },
      {
        title: "Upload this bank statement?",
        message: `${parsed.length} rows will replace ${month}.`,
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
      applyParsed(parseStatementText(text, month));
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

  function downloadStatement() {
    if (!monthRows.length) {
      toast.error("Upload a statement first");
      return;
    }
    const html = statementChartHtml(
      [...STATEMENT_HEADERS],
      statementChartRows(monthRows),
    );
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bank-statement-${month}.xls`;
    a.click();
    URL.revokeObjectURL(url);
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
            Journal list from the uploaded statement: Date, Narration,
            Ch./Ref. no., Withdrawal, Deposit.
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
          <Button
            type="button"
            disabled={!monthRows.length || busy}
            onClick={downloadStatement}
          >
            <Download className="size-4" />
            Download
          </Button>
          <SaveCube busy={saving} onSave={() => void saveToServer()} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-4" />
            {monthRows.length
              ? `Journal entries · ${monthRows.length}`
              : "Journal entries"}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border bg-bg-warm/50">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Narration</th>
                <th className="px-3 py-2 font-medium">Ch./Ref. no.</th>
                <th className="px-3 py-2 text-right font-medium">Withdrawal</th>
                <th className="px-3 py-2 text-right font-medium">Deposit</th>
              </tr>
            </thead>
            <tbody>
              {monthRows.map((row) => (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="px-5 py-2.5 tabular">{row.dateRaw || "—"}</td>
                  <td className="px-3 py-2.5">{row.particular || "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {row.ref || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {row.debit ? money(row.debit) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {row.credit ? money(row.credit) : "—"}
                  </td>
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
