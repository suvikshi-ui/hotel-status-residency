import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGate } from "@/components/security-gate";
import { formatDay, formatDayShort } from "@/lib/format";
import { addDaysIso, occupantsOnDate, stayDates, stayOnDate } from "@/lib/stay";
import { useLedger } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { GuestEntry } from "@/lib/types";

export function YesterdayRoll() {
  const date = useLedger((s) => s.selectedDate);
  const openingDate = useLedger((s) => s.openingDate);
  const guests = useLedger((s) => s.guests);
  const rollYesterday = useLedger((s) => s.rollYesterday);
  const { gate } = useGate();
  const yesterday = addDaysIso(date, -1);
  const rows = useMemo(
    () => occupantsOnDate(guests, yesterday),
    [guests, yesterday],
  );

  const alreadyIds = useMemo(() => {
    return rows
      .filter((g) => stayOnDate(guests, g, date))
      .map((g) => g.id)
      .sort()
      .join(",");
  }, [rows, guests, date]);

  const [ticked, setTicked] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setTicked(new Set(alreadyIds ? alreadyIds.split(",") : []));
  }, [date, alreadyIds]);

  useEffect(() => {
    setOpen(true);
  }, [date]);

  if (!rows.length) return null;
  if (yesterday < (openingDate || "2026-09-01")) return null;

  const continueN = rows.filter((g) => ticked.has(g.id)).length;
  const outN = rows.length - continueN;
  const colCount = rows.length > 24 ? 3 : 2;
  const colSize = Math.ceil(rows.length / colCount);
  const columns = Array.from({ length: colCount }, (_, i) =>
    rows.slice(i * colSize, (i + 1) * colSize),
  );

  function toggle(id: string) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function apply() {
    const namesIn = rows.filter((g) => ticked.has(g.id)).map((g) => g.name);
    const namesOut = rows.filter((g) => !ticked.has(g.id)).map((g) => g.name);
    const message =
      outN === 0
        ? `Continue all ${continueN} guests onto ${formatDay(date)}?`
        : continueN === 0
          ? `Check out all ${outN} guests from ${formatDayShort(yesterday)}? None continue today.`
          : `Continue ${continueN} (${namesIn.slice(0, 3).join(", ")}${namesIn.length > 3 ? "…" : ""}) onto ${formatDayShort(date)}. Check out ${outN} (${namesOut.slice(0, 3).join(", ")}${namesOut.length > 3 ? "…" : ""}).`;
    gate(
      () => {
        rollYesterday(yesterday, [...ticked]);
        toast.success(
          continueN === 0
            ? `Checked out ${outN}`
            : `Continued ${continueN} · checked out ${outN}`,
        );
        setOpen(false);
      },
      {
        title: "Are you sure?",
        message,
        confirmLabel:
          continueN === 0 ? "Check out all" : "Continue ticked",
        danger: continueN === 0,
      },
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg-warm/60 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted transition-transform duration-150",
              open ? "rotate-0" : "-rotate-90",
            )}
          />
          <span className="min-w-0">
            <span className="block text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Continue · {formatDayShort(yesterday)}
            </span>
            <span className="block text-sm tabular text-muted">
              <span className="font-medium text-fg">{continueN}</span> continue ·{" "}
              <span className="font-medium text-fg">{outN}</span> check out
            </span>
          </span>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Minimize" : "Expand"}
          </Button>
          {open ? (
            <Button type="button" size="sm" onClick={apply}>
              {continueN === 0
                ? `Check out all ${outN}`
                : `Continue ${continueN} · check out ${outN}`}
            </Button>
          ) : null}
        </div>
      </div>
      {open ? (
      <CardContent className="p-2 sm:p-3">
        <div
          className={cn(
            "grid gap-x-3 gap-y-0.5",
            colCount === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
          )}
        >
          {columns.map((col, i) => (
            <ul key={i} className="flex min-w-0 flex-col gap-0.5">
              {col.map((g) => (
                <li key={g.id}>
                  <RollRow
                    guest={g}
                    checkIn={stayDates(guests, g).checkIn}
                    on={ticked.has(g.id)}
                    posted={Boolean(alreadyIds) && alreadyIds.split(",").includes(g.id)}
                    onToggle={() => toggle(g.id)}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </CardContent>
      ) : null}
    </Card>
  );
}

function RollRow({
  guest,
  checkIn,
  on,
  posted,
  onToggle,
}: {
  guest: GuestEntry;
  checkIn: string;
  on: boolean;
  posted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={cn(
        "flex w-full min-h-10 items-center gap-2 rounded-md px-2 py-1 text-left transition-colors",
        on ? "bg-ok/10" : "hover:bg-bg-warm/80",
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-md border",
          on
            ? "border-ok/40 bg-ok text-primary-fg"
            : "border-border bg-card text-transparent",
        )}
        aria-hidden
      >
        <Check className="size-4" strokeWidth={3} />
      </span>
      <span className="w-8 shrink-0 tabular text-sm font-medium">
        {guest.roomNo}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{guest.name}</span>
      <span className="shrink-0 tabular text-xs text-muted">
        Continue from {formatDayShort(checkIn)}
      </span>
      {posted ? (
        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-ok">
          Today
        </span>
      ) : guest.stay === "out" ? (
        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
          Out
        </span>
      ) : null}
    </button>
  );
}
