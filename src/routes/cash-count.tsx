import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, isValid, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGate } from "@/components/security-gate";
import {
  CASH_NOTES,
  cashCountTotal,
  emptyCashLines,
  emptyCashNotes,
  type CashAdjust,
} from "@/lib/cash-count";
import { formatDay, money } from "@/lib/format";
import { canWrite } from "@/lib/roles";
import { useDayBooks, useLedger } from "@/lib/store";

export const Route = createFileRoute("/cash-count")({
  component: CashCountPage,
});

function monthTitle(key: string) {
  const d = parseISO(`${key}-01`);
  return isValid(d) ? format(d, "MMMM yyyy") : key;
}

function daysOf(month: string) {
  const d = parseISO(`${month}-01`);
  if (!isValid(d)) return [];
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Array.from({ length: last }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${month}-${day}`;
  });
}

function CashCountPage() {
  const selected = useLedger((s) => s.selectedDate);
  const counts = useLedger((s) => s.cashCounts);
  const [year, setYear] = useState(selected.slice(0, 4) || String(new Date().getFullYear()));
  const [month, setMonth] = useState(selected.slice(0, 7));
  const [day, setDay] = useState(selected.slice(0, 10));

  useEffect(() => {
    const next = selected.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) return;
    setYear(next.slice(0, 4));
    setMonth(next.slice(0, 7));
    setDay(next);
  }, [selected]);

  const years = useMemo(() => {
    const found = new Set(counts.map((row) => row.date.slice(0, 4)));
    found.add(year);
    found.add(String(new Date().getFullYear()));
    return [...found].filter((value) => /^\d{4}$/.test(value)).sort();
  }, [counts, year]);
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`),
    [year],
  );
  const dayList = useMemo(() => daysOf(month), [month]);
  const savedDates = useMemo(() => new Set(counts.map((row) => row.date)), [counts]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Cash</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Cash count</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          The day's cash closing from the report shows here. Counting or saving does not change the register or the report.
        </p>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Year</p>
        <div className="flex flex-wrap gap-2">
          {years.map((value) => (
            <Button key={value} type="button" size="sm" variant={year === value ? "default" : "outline"} onClick={() => setYear(value)}>
              {value}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Month</p>
        <div className="flex flex-wrap gap-2">
          {months.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={month === value ? "default" : "outline"}
              onClick={() => {
                setMonth(value);
                if (!day.startsWith(value)) setDay(`${value}-01`);
              }}
            >
              {monthTitle(value)}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Day</p>
        <div className="flex flex-wrap gap-2">
          {dayList.map((value) => (
            <Button key={value} type="button" size="sm" variant={day === value ? "default" : "outline"} onClick={() => setDay(value)}>
              {Number(value.slice(8, 10))}
              {savedDates.has(value) ? " ·" : ""}
            </Button>
          ))}
        </div>
      </div>
      <CashDaySheet key={day} day={day} />
    </div>
  );
}

function CashDaySheet({ day }: { day: string }) {
  const counts = useLedger((s) => s.cashCounts);
  const saveCashCount = useLedger((s) => s.saveCashCount);
  const write = canWrite(useLedger((s) => s.appRole));
  const { gate } = useGate();
  const books = useDayBooks(day);
  const closing = books?.cashBook.cb ?? 0;
  const saved = counts.find((row) => row.date === day);
  const loaded = useRef(Boolean(saved));
  const [editing, setEditing] = useState(!saved);
  const [notes, setNotes] = useState(saved ? { ...emptyCashNotes(), ...saved.notes } : emptyCashNotes);
  const [coins, setCoins] = useState(saved?.coins ?? 0);
  const [lines, setLines] = useState<CashAdjust[]>(saved?.lines?.length ? saved.lines : emptyCashLines);
  const counted = cashCountTotal({ notes, coins, lines });
  const locked = Boolean(saved) && !editing;
  const open = write && !locked;

  useEffect(() => {
    if (loaded.current) return;
    const row = counts.find((item) => item.date === day);
    if (!row) return;
    loaded.current = true;
    setNotes({ ...emptyCashNotes(), ...row.notes });
    setCoins(row.coins ?? 0);
    setLines(row.lines?.length ? row.lines : emptyCashLines());
  }, [counts, day]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatDay(day)}</CardTitle>
        <p className="text-sm text-muted">
          {locked ? "Saved. Use Edit to change this count." : "Count the notes for this day. Saving stays on this page only."}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-bg-warm px-3 py-3">
            <div className="text-xs font-medium text-muted">Cash closing</div>
            <div className="mt-1 font-display text-xl font-semibold tabular">{money(closing)}</div>
            <p className="mt-1 text-xs text-muted">From the daily report. Not changed by this count.</p>
          </div>
          <div className="rounded-lg bg-bg-warm px-3 py-3">
            <div className="text-xs font-medium text-muted">Counted</div>
            <div className="mt-1 font-display text-xl font-semibold tabular">{money(counted)}</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          {CASH_NOTES.map((note) => {
            const count = notes[String(note)] ?? 0;
            return (
              <div key={note} className="grid grid-cols-[5.5rem_1fr_6.5rem] items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
                <span className="font-display text-lg font-semibold tabular">₹{note}</span>
                <Input
                  inputMode="numeric"
                  className="tabular"
                  value={count ? String(count) : ""}
                  disabled={!open}
                  aria-label={`${note} notes`}
                  placeholder="How many"
                  onChange={(event) => {
                    const next = Math.max(0, Math.round(Number(event.target.value) || 0));
                    setNotes((prev) => ({ ...prev, [String(note)]: next }));
                  }}
                />
                <span className="text-right text-sm font-medium tabular">{money(note * count)}</span>
              </div>
            );
          })}
          <div className="grid grid-cols-[5.5rem_1fr_6.5rem] items-center gap-3 px-3 py-2">
            <span className="font-display text-lg font-semibold">Coins</span>
            <Input
              inputMode="numeric"
              className="tabular"
              value={coins ? String(coins) : ""}
              disabled={!open}
              aria-label="Coins"
              placeholder="Amount"
              onChange={(event) => setCoins(Math.max(0, Math.round(Number(event.target.value) || 0)))}
            />
            <span className="text-right text-sm font-medium tabular">{money(coins)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Note</p>
          <p className="text-xs text-muted">Optional. Add or less stays on this count only.</p>
          {lines.map((line, index) => {
            const amount = Math.max(0, Math.round(Number(line.amount) || 0));
            const signed = line.side === "add" ? amount : -amount;
            return (
              <div key={index} className="grid items-center gap-2 rounded-lg border border-border p-2 md:grid-cols-[1fr_auto_8rem_6.5rem]">
                <Input
                  value={line.description}
                  disabled={!open}
                  placeholder="Description"
                  aria-label={`Cash note ${index + 1}`}
                  onChange={(event) => {
                    const description = event.target.value;
                    setLines((prev) => prev.map((row, i) => (i === index ? { ...row, description } : row)));
                  }}
                />
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant={line.side === "add" ? "default" : "outline"} disabled={!open} onClick={() => setLines((prev) => prev.map((row, i) => (i === index ? { ...row, side: "add" } : row)))}>
                    Add
                  </Button>
                  <Button type="button" size="sm" variant={line.side === "less" ? "default" : "outline"} disabled={!open} onClick={() => setLines((prev) => prev.map((row, i) => (i === index ? { ...row, side: "less" } : row)))}>
                    Less
                  </Button>
                </div>
                <Input
                  inputMode="numeric"
                  className="tabular"
                  value={amount ? String(amount) : ""}
                  disabled={!open}
                  placeholder="Amount"
                  aria-label={`Amount ${index + 1}`}
                  onChange={(event) => {
                    const next = Math.max(0, Math.round(Number(event.target.value) || 0));
                    setLines((prev) => prev.map((row, i) => (i === index ? { ...row, amount: next } : row)));
                  }}
                />
                <span className="text-right text-sm font-medium tabular">
                  {signed < 0 ? `− ${money(Math.abs(signed))}` : money(signed)}
                </span>
              </div>
            );
          })}
        </div>
        {write ? (
          <div className="flex gap-2">
            {locked ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  gate(
                    () => setEditing(true),
                    {
                      title: `Edit ${formatDay(day)}?`,
                      message: "Enter the security code to change this cash count.",
                      confirmLabel: "Edit",
                      requireCode: true,
                    },
                  )
                }
              >
                Edit
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  saveCashCount({ id: `cc-${day}`, date: day, notes, coins, lines });
                  setEditing(false);
                  toast.success(`${formatDay(day)} cash count saved`);
                }}
              >
                Save count
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
