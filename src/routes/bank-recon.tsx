import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Landmark, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SaveCube, useAccountSave } from "@/components/save-cube";
import { useGate } from "@/components/security-gate";
import {
  mergeBankRows,
  parseStatementText,
  reconcileBank,
  statementCsv,
  statementTextFromPdf,
  type BankRow,
} from "@/lib/bank-recon";
import { formatDayShort } from "@/lib/format";
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
  const headers = monthRows[0]?.headers?.filter(Boolean) ?? [];
  const matched = lines.filter((l) => l.office);
  const unmatched = lines.filter((l) => !l.office);

  function applyParsed(parsed: BankRow[]) {
    if (!parsed.length) {
      toast.error("No statement rows found in that file");
      return;
    }
    gate(
      () => {
        const kept = bankRows.filter((r) => r.month !== month);
        setBankRows(mergeBankRows(kept, parsed, month));
        toast.success(`Uploaded ${parsed.length} rows as printed`);
      },
      {
        title: "Upload this bank statement?",
        message: `${parsed.length} rows will replace ${month}, as printed.`,
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
      toast.error("No statement to download");
      return;
    }
    const cols = headers.length ? headers : ["Statement"];
    const csv = statementCsv(
      cols,
      monthRows.map((r) => (r.cells.length ? r.cells : [r.dateRaw, r.particular, r.ref])),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bank-statement-${month}.csv`;
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
            Bank statement is uploaded and downloaded as printed. No columns are
            changed.
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
            variant="outline"
            disabled={!monthRows.length}
            onClick={downloadStatement}
          >
            <Download className="size-4" />
            Download
          </Button>
          <SaveCube busy={saving} onSave={() => void saveToServer()} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Uploaded" value={String(monthRows.length)} />
        <Stat label="Matched" value={String(matched.length)} />
        <Stat label="Later" value={String(unmatched.length)} />
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
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-y border-border bg-bg-warm/50">
                <th
                  className="px-5 py-2 font-medium"
                  colSpan={Math.max(headers.length, 1)}
                >
                  Bank statement
                </th>
                <th className="px-3 py-2 font-medium" colSpan={3}>
                  Entry in office
                </th>
              </tr>
              <tr className="border-b border-border">
                {(headers.length ? headers : ["Statement"]).map((h) => (
                  <th key={h} className="px-3 py-2 font-medium first:px-5">
                    {h}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Yes/No</th>
                <th className="px-3 py-2 font-medium">Office date</th>
                <th className="px-3 py-2 font-medium">Office entry</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.bank.id} className="border-b border-border/70">
                  {(headers.length ? headers : ["Statement"]).map((h, i) => (
                    <td key={h} className="px-3 py-2.5 first:px-5">
                      {line.bank.cells[i] || "—"}
                    </td>
                  ))}
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
              ))}
            </tbody>
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
