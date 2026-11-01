import { useEffect, useState, type ReactNode } from "react";
import { setLedgerOwner, useLedger } from "@/lib/store";

export function HydrateLedger({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await setLedgerOwner(null);
      if (cancelled) return;
      const state = useLedger.getState();
      const date = state.selectedDate;
      if (date && (state.openDays?.[date] || !state.lockedDates?.[date])) {
        state.lockRegister(date);
      }
      for (const day of Object.keys(useLedger.getState().openDays ?? {})) {
        useLedger.getState().lockRegister(day);
      }
      useLedger.getState().setAppRole("admin");
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
