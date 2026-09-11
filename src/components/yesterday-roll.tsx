import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGate } from "@/components/security-gate";
import { ModeBadge } from "@/components/mode-badge";
import { formatDay, formatDayShort, money } from "@/lib/format";
import { addDaysIso, occupantsOnDate, stayOnDate } from "@/lib/stay";
import { useLedger } from "@/lib/store";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    setTicked(new Set(alreadyIds ? alreadyIds.split(",") : []));
  }, [date, alreadyIds]);

  if (!rows.length) return null;
  if (yesterday < (openingDate || "2026-09-01")) return null;

  const continueN = rows.filter((g) => ticked.has(g.id)).length;
  const outN = rows.length - continueN;

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
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-bg-warm/60 px-5 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Yesterday
          </p>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {formatDay(yesterday)}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tick who continues today. Unticked guests check out at 11:00 AM.
            Tick again if you checked out by mistake.
          </p>
        </div>
        <p className="text-sm tabular text-muted">
          <span className="font-medium text-fg">{continueN}</span> continue ·{" "}
          <span className="font-medium text-fg">{outN}</span> check out
        </p>
      </div>
      <CardContent className="flex flex-col gap-2 p-3 sm:p-4">
        <ul className="flex flex-col gap-1.5">
          {rows.map((g) => {
            const on = ticked.has(g.id);
            const posted = Boolean(alreadyIds) && alreadyIds.split(",").includes(g.id);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => toggle(g.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full min-h-14 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    on ? "bg-ok/10" : "bg-card hover:bg-bg-warm/80",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-md border",
                      on
                        ? "border-ok/40 bg-ok text-primary-fg"
                        : "border-border bg-card text-transparent",
                    )}
                    aria-hidden
                  >
                    <Check className="size-5" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium">{g.name}</span>
                      <span className="text-sm tabular text-muted">
                        Room {g.roomNo}
                      </span>
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <ModeBadge mode={g.mode} />
                      <span className="tabular">{money(g.amount)}</span>
                      {g.source ? <span>{g.source}</span> : null}
                      {posted ? (
                        <span className="font-medium text-ok">On today</span>
                      ) : g.stay === "out" ? (
                        <span className="font-medium text-muted">Checked out</span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <Button type="button" className="mt-1 w-full sm:w-auto" onClick={apply}>
          {continueN === 0
            ? `Check out all ${outN}`
            : `Continue ${continueN} · check out ${outN}`}
        </Button>
      </CardContent>
    </Card>
  );
}
