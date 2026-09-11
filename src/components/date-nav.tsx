import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/format";
import { useLedger } from "@/lib/store";

export function DateNav() {
  const date = useLedger((s) => s.selectedDate);
  const setDate = useLedger((s) => s.setDate);
  const openingDate = useLedger((s) => s.openingDate);
  const guests = useLedger((s) => s.guests);
  const d = parseISO(date);
  const earliestGuest = guests.reduce((m, g) => {
    const day = (g.date || "").slice(0, 10);
    if (!day) return m;
    return !m || day < m ? day : m;
  }, "");
  const min = parseISO(
    [openingDate || "", earliestGuest, "2026-09-01"].filter(Boolean).sort()[0] ||
      "2026-09-01",
  );

  function shift(n: number) {
    const next = addDays(d, n);
    if (next < min) return;
    setDate(format(next, "yyyy-MM-dd"));
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-10 min-h-10"
        onClick={() => shift(-1)}
        aria-label="Previous day"
      >
        <ChevronLeft className="size-5" />
      </Button>
      <div className="min-w-[10.5rem] text-center">
        <div className="font-display text-sm font-semibold leading-tight tracking-tight sm:text-base">
          {formatDay(date)}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-10 min-h-10"
        onClick={() => shift(1)}
        aria-label="Next day"
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
